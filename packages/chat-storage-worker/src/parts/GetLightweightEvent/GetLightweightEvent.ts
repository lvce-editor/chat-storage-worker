import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'
import { getDuration } from '../GetDuration/GetDuration.ts'
import { getEndTime } from '../GetEndTime/GetEndTime.ts'
import { getStartTime } from '../GetStartTime/GetStartTime.ts'
import { isTimeValue } from '../IsTimeValue/IsTimeValue.ts'

export const getLightweightEvent = (event: ChatViewEventSimple, fallbackEventId: number): ChatViewEventSimple => {
  const startTime = getStartTime(event)
  const endTime = getEndTime(event)
  return {
    duration: getDuration(event),
    ...(isTimeValue(endTime) ? { endTime } : {}),
    eventId: typeof event.eventId === 'number' ? event.eventId : fallbackEventId,
    ...(isTimeValue(startTime) ? { startTime } : {}),
    type: event.type,
  }
}
