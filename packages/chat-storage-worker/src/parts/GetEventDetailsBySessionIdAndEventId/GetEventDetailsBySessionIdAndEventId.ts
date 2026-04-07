// cspell:ignore IDBP
import type { IDBPObjectStore } from 'idb'
import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'

type EventStore = Pick<IDBPObjectStore, 'get' | 'getAll' | 'index' | 'indexNames'>

const startedEventType = 'tool-execution-started'
const finishedEventType = 'tool-execution-finished'

const getRawEventBySessionIdAndEventId = async (
  store: EventStore, // eslint-disable-line @typescript-eslint/prefer-readonly-parameter-types
  sessionId: string,
  sessionIdIndexName: string,
  eventId: number,
): Promise<ChatViewEventSimple | undefined> => {
  if (eventId < 1) {
    return undefined
  }
  if (store.indexNames.contains(sessionIdIndexName)) {
    const index = store.index(sessionIdIndexName)
    const keys = await index.getAllKeys(sessionId, eventId)
    if (keys.length < eventId) {
      return undefined
    }
    const key = keys.at(-1)
    if (key === undefined) {
      return undefined
    }
    const event = await store.get(key)
    return event as ChatViewEventSimple | undefined
  }
  const all = (await store.getAll()) as readonly ChatViewEventSimple[]
  const events = all.filter((event) => event.sessionId === sessionId)
  return events[eventId - 1]
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
  const event = await getRawEventBySessionIdAndEventId(store, sessionId, sessionIdIndexName, eventId)
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
  const nextEvent = await getRawEventBySessionIdAndEventId(store, sessionId, sessionIdIndexName, eventId + 1)
  if (!nextEvent || nextEvent.type !== finishedEventType || nextEvent.sessionId !== sessionId || !hasMatchingToolName(event, nextEvent)) {
    return {
      ...event,
      eventId,
    }
  }
  return mergeToolExecutionEvents(event, nextEvent, eventId)
}
