import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'
import { getDuration } from '../GetDuration/GetDuration.ts'
import { getEndTime } from '../GetEndTime/GetEndTime.ts'
import { getStartTime } from '../GetStartTime/GetStartTime.ts'
import { isTimeValue } from '../IsTimeValue/IsTimeValue.ts'

export const getSize = (event: ChatViewEventSimple): number | undefined => {
  if (typeof event.size === 'number') {
    return event.size
  }
  if (!('value' in event)) {
    return undefined
  }
  try {
    const json = JSON.stringify(event.value)
    return typeof json === 'string' ? json.length : undefined
  } catch {
    return undefined
  }
}

export const getLightweightEvent = (event: ChatViewEventSimple, fallbackEventId: number): ChatViewEventSimple => {
  const startTime = getStartTime(event)
  const endTime = getEndTime(event)
  const { requestId, timestamp } = event
  const size = getSize(event)
  return {
    duration: getDuration(event),
    ...(isTimeValue(endTime) ? { endTime } : {}),
    eventId: typeof event.eventId === 'number' ? event.eventId : fallbackEventId,
    ...(typeof requestId === 'string' ? { requestId } : {}),
    ...(typeof size === 'number' ? { size } : {}),
    ...(isTimeValue(startTime) ? { startTime } : {}),
    ...(isTimeValue(timestamp) ? { timestamp } : {}),
    type: event.type,
  }
}
