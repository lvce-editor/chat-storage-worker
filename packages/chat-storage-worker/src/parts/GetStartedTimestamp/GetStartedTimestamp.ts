import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'
import { getTimestamp } from '../GetTimestamp/GetTimestamp.ts'

export const getStartedTimestamp = (event: ChatViewEventSimple): string | number | undefined => {
  return getTimestamp(event.started) ?? getTimestamp(event.startTime) ?? getTimestamp(event.startTimestamp) ?? getTimestamp(event.timestamp)
}
