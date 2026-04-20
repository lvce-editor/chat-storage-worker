import type { ChatViewEvent } from '../ChatViewEvent/ChatViewEvent.ts'
import { filterDebugChatViewEvents } from '../IsRequiredChatViewEvent/IsRequiredChatViewEvent.ts'

export interface ChatViewEventInfo {
  readonly [key: string]: unknown
  readonly sessionId: string
  readonly type: string
}

export interface ChatViewEventSummary {
  readonly duration: number
  readonly endTime?: number | string
  readonly eventId: number
  readonly requestId?: string
  readonly startTime?: number | string
  readonly timestamp?: number | string
  readonly type: string
}

type RawChatViewEvent = ChatViewEventInfo & {
  readonly eventId?: number
}

const startedEventType = 'tool-execution-started'
const finishedEventType = 'tool-execution-finished'
const mergedEventType = 'tool-execution'

const toTimeNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const timestamp = Date.parse(value)
    if (!Number.isNaN(timestamp)) {
      return timestamp
    }
  }
  return undefined
}

const getStartTime = (event: RawChatViewEvent): number | string | undefined => {
  const { started, startTime, timestamp } = event
  if (typeof started === 'number' || typeof started === 'string') {
    return started
  }
  if (typeof startTime === 'number' || typeof startTime === 'string') {
    return startTime
  }
  if (typeof timestamp === 'number' || typeof timestamp === 'string') {
    return timestamp
  }
  return undefined
}

const getEndTime = (event: RawChatViewEvent): number | string | undefined => {
  const { ended, endTime, timestamp } = event
  if (typeof ended === 'number' || typeof ended === 'string') {
    return ended
  }
  if (typeof endTime === 'number' || typeof endTime === 'string') {
    return endTime
  }
  if (typeof timestamp === 'number' || typeof timestamp === 'string') {
    return timestamp
  }
  return undefined
}

const getDuration = (event: RawChatViewEvent): number => {
  const explicitDuration = event.durationMs ?? event.duration
  if (typeof explicitDuration === 'number' && Number.isFinite(explicitDuration)) {
    return explicitDuration
  }
  const start = toTimeNumber(getStartTime(event))
  const end = toTimeNumber(getEndTime(event))
  if (start === undefined || end === undefined || !Number.isFinite(start) || !Number.isFinite(end)) {
    return 0
  }
  return Math.max(0, end - start)
}

const hasMatchingToolName = (startedEvent: RawChatViewEvent, finishedEvent: RawChatViewEvent): boolean => {
  const startedToolName = startedEvent.toolName
  const finishedToolName = finishedEvent.toolName
  if (typeof startedToolName === 'string' && typeof finishedToolName === 'string') {
    return startedToolName === finishedToolName
  }
  return true
}

const isMatchingToolExecutionPair = (startedEvent: RawChatViewEvent, finishedEvent: RawChatViewEvent): boolean => {
  return startedEvent.sessionId === finishedEvent.sessionId && hasMatchingToolName(startedEvent, finishedEvent)
}

const mergeToolExecutionEvents = (startedEvent: RawChatViewEvent, finishedEvent: RawChatViewEvent): RawChatViewEvent => {
  const ended = getEndTime(finishedEvent)
  const started = getStartTime(startedEvent)
  return {
    ...startedEvent,
    ...finishedEvent,
    ...(ended === undefined ? {} : { ended }),
    ...(typeof startedEvent.eventId === 'number' ? { eventId: startedEvent.eventId } : {}),
    ...(started === undefined ? {} : { started }),
    type: mergedEventType,
  }
}

const withEventIds = (events: readonly ChatViewEvent[]): readonly RawChatViewEvent[] => {
  return events.map((event, index) => {
    return {
      ...(event as unknown as RawChatViewEvent),
      eventId: index + 1,
    }
  })
}

const collapseToolExecutionEvents = (events: readonly RawChatViewEvent[]): readonly RawChatViewEvent[] => {
  const collapsedEvents: RawChatViewEvent[] = []
  for (let i = 0; i < events.length; i += 1) {
    const event = events[i]
    if (event.type === startedEventType) {
      const nextEvent = events[i + 1]
      if (nextEvent && nextEvent.type === finishedEventType && isMatchingToolExecutionPair(event, nextEvent)) {
        collapsedEvents.push(mergeToolExecutionEvents(event, nextEvent))
        i += 1
        continue
      }
    }
    collapsedEvents.push(event)
  }
  return collapsedEvents
}

const toLightweightEvent = (event: RawChatViewEvent, fallbackEventId: number): ChatViewEventSummary => {
  const startTime = getStartTime(event)
  const endTime = getEndTime(event)
  const { requestId, timestamp } = event
  return {
    duration: getDuration(event),
    ...(endTime === undefined ? {} : { endTime }),
    eventId: typeof event.eventId === 'number' ? event.eventId : fallbackEventId,
    ...(typeof requestId === 'string' ? { requestId } : {}),
    ...(startTime === undefined ? {} : { startTime }),
    ...(typeof timestamp === 'number' || typeof timestamp === 'string' ? { timestamp } : {}),
    type: event.type,
  }
}

export const listChatViewEventSummaries = (events: readonly ChatViewEvent[]): readonly ChatViewEventSummary[] => {
  const eventsWithIds = withEventIds(filterDebugChatViewEvents(events))
  return collapseToolExecutionEvents(eventsWithIds).map((event, index) => toLightweightEvent(event, index + 1))
}

export const loadSelectedChatViewEvent = (events: readonly ChatViewEvent[], eventId: number, summaryType: string): ChatViewEventInfo | null => {
  if (eventId < 1) {
    return null
  }
  const eventsWithIds = withEventIds(filterDebugChatViewEvents(events))
  const event = eventsWithIds[eventId - 1]
  if (!event) {
    return null
  }
  if (summaryType !== mergedEventType || event.type !== startedEventType) {
    return event
  }
  const nextEvent = eventsWithIds[eventId]
  if (!nextEvent || nextEvent.type !== finishedEventType || !isMatchingToolExecutionPair(event, nextEvent)) {
    return event
  }
  return mergeToolExecutionEvents(event, nextEvent)
}
