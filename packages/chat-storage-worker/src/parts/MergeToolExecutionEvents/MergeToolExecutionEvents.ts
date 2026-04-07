import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'
import { mergedEventType } from '../EventTypes/EventTypes.ts'
import { getEndedTimestamp } from '../GetEndedTimestamp/GetEndedTimestamp.ts'
import { getOrCreateStableEventId } from '../GetOrCreateStableEventId/GetOrCreateStableEventId.ts'
import { getStartedTimestamp } from '../GetStartedTimestamp/GetStartedTimestamp.ts'
import { setStableEventId } from '../SetStableEventId/SetStableEventId.ts'

export const mergeToolExecutionEvents = (startedEvent: ChatViewEventSimple, finishedEvent: ChatViewEventSimple): ChatViewEventSimple => {
  const ended = getEndedTimestamp(finishedEvent)
  const { eventId } = startedEvent
  const started = getStartedTimestamp(startedEvent)
  const mergedEvent: ChatViewEventSimple = {
    ...startedEvent,
    ...finishedEvent,
    ...(ended === undefined ? {} : { ended }),
    ...(eventId === undefined ? {} : { eventId }),
    ...(started === undefined ? {} : { started }),
    type: mergedEventType,
  }
  const stableEventId = `${getOrCreateStableEventId(startedEvent)}:${getOrCreateStableEventId(finishedEvent)}`
  setStableEventId(mergedEvent, stableEventId)
  return mergedEvent
}
