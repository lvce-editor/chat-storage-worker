import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'
import { getTimestamp } from '../GetTimestamp/GetTimestamp.ts'

export const getEndedTimestamp = (event: ChatViewEventSimple): string | number | undefined => {
  return getTimestamp(event.ended) ?? getTimestamp(event.endTime) ?? getTimestamp(event.endTimestamp) ?? getTimestamp(event.timestamp)
}
