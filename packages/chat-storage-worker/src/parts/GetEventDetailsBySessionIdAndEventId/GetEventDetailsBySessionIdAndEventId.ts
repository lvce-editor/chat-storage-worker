// cspell:ignore IDBP
import type { IDBPObjectStore } from 'idb'
import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'
import { filterEventsBySessionId } from '../FilterEventsBySessionId/FilterEventsBySessionId.ts'
import { filterDebugChatViewEvents } from '../IsRequiredChatViewEvent/IsRequiredChatViewEvent.ts'

type EventStore = Pick<IDBPObjectStore, 'getAll' | 'index' | 'indexNames'>

const startedEventType = 'tool-execution-started'
const finishedEventType = 'tool-execution-finished'

const getEventsBySessionId = async (
  store: EventStore, // eslint-disable-line @typescript-eslint/prefer-readonly-parameter-types
  sessionId: string,
  sessionIdIndexName: string,
): Promise<readonly ChatViewEventSimple[]> => {
  if (store.indexNames.contains(sessionIdIndexName)) {
    const index = store.index(sessionIdIndexName)
    const events = await index.getAll(sessionId)
    return filterDebugChatViewEvents(filterEventsBySessionId(events as readonly ChatViewEventSimple[], sessionId))
  }
  const all = (await store.getAll()) as readonly ChatViewEventSimple[]
  return filterDebugChatViewEvents(filterEventsBySessionId(all, sessionId))
}

const getTimestamp = (value: unknown): string | number | undefined => {
  return typeof value === 'string' || typeof value === 'number' ? value : undefined
}

const hasMatchingToolName = (startedEvent: ChatViewEventSimple, finishedEvent: ChatViewEventSimple): boolean => {
  if (typeof startedEvent.toolName === 'string' && typeof finishedEvent.toolName === 'string') {
    return startedEvent.toolName === finishedEvent.toolName
  }
  return true
}

const mergeToolExecutionEvents = (startedEvent: ChatViewEventSimple, finishedEvent: ChatViewEventSimple, eventId: number): ChatViewEventSimple => {
  const ended = getTimestamp(finishedEvent.ended) ?? getTimestamp(finishedEvent.endTime) ?? getTimestamp(finishedEvent.timestamp)
  const started = getTimestamp(startedEvent.started) ?? getTimestamp(startedEvent.startTime) ?? getTimestamp(startedEvent.timestamp)
  return {
    ...startedEvent,
    ...finishedEvent,
    ...(ended === undefined ? {} : { ended }),
    eventId,
    ...(started === undefined ? {} : { started }),
    type: 'tool-execution',
  }
}

export const getEventDetailsBySessionIdAndEventId = async (
  store: EventStore, // eslint-disable-line @typescript-eslint/prefer-readonly-parameter-types
  sessionId: string,
  sessionIdIndexName: string,
  eventId: number,
  summaryType: string,
): Promise<ChatViewEventSimple | undefined> => {
  if (eventId < 1) {
    return undefined
  }
  const events = await getEventsBySessionId(store, sessionId, sessionIdIndexName)
  const event = events[eventId - 1]
  if (!event) {
    return undefined
  }
  if (summaryType !== 'tool-execution') {
    return {
      ...event,
      eventId,
    }
  }
  if (event.type !== startedEventType) {
    return {
      ...event,
      eventId,
    }
  }
  const nextEvent = events[eventId]
  if (!nextEvent || nextEvent.type !== finishedEventType || nextEvent.sessionId !== sessionId || !hasMatchingToolName(event, nextEvent)) {
    return {
      ...event,
      eventId,
    }
  }
  return mergeToolExecutionEvents(event, nextEvent, eventId)
}
