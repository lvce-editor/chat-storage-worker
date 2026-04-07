import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'
import { getEndTime } from '../GetEndTime/GetEndTime.ts'
import { getStartTime } from '../GetStartTime/GetStartTime.ts'
import { toTimeNumber } from '../ToTimeNumber/ToTimeNumber.ts'

export const getDuration = (event: ChatViewEventSimple): number => {
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
