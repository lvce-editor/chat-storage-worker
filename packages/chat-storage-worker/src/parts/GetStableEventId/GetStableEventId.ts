import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'
import { getOrCreateStableEventId } from '../GetOrCreateStableEventId/GetOrCreateStableEventId.ts'

export const getStableEventId = (event: ChatViewEventSimple): string => {
  return getOrCreateStableEventId(event)
}
