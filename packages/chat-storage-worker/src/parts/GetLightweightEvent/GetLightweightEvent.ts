import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'
import { getDuration } from '../GetDuration/GetDuration.ts'
import { getEndTime } from '../GetEndTime/GetEndTime.ts'
import { getStartTime } from '../GetStartTime/GetStartTime.ts'
import { isTimeValue } from '../IsTimeValue/IsTimeValue.ts'

const getTextSize = (value: unknown): number => {
  try {
    return JSON.stringify(value).length
  } catch {
    return 0
  }
}

export const getSize = (event: ChatViewEventSimple): number | undefined => {
  if (typeof event.size === 'number' && event.size > 0) {
    return event.size
  }
  // TODO maybe flatten tool call event so that
  // its just event.value, similar to how
  // it is for network events
  if (
    event &&
    'toolCallResult' in event &&
    typeof event.toolCallResult === 'object' &&
    event.toolCallResult &&
    'value' in event.toolCallResult &&
    event.toolCallResult.value
  ) {
    return getTextSize(event.toolCallResult.value)
  }
  if (!('value' in event)) {
    return undefined
  }
  return getTextSize(event.value)
}

export const getLightweightEvent = (event: ChatViewEventSimple, fallbackEventId: number): ChatViewEventSimple => {
  const startTime = getStartTime(event)
  const endTime = getEndTime(event)
  const { requestId, timestamp } = event
  const size = getSize(event)
  return {
    duration: getDuration(event),
    ...(isTimeValue(endTime) && { endTime }),
    eventId: typeof event.eventId === 'number' ? event.eventId : fallbackEventId,
    ...(typeof requestId === 'string' && { requestId }),
    ...(typeof size === 'number' && { size }),
    ...(isTimeValue(startTime) && { startTime }),
    ...(isTimeValue(timestamp) && { timestamp }),
    type: event.type,
  }
}
