import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'

export const getEndTime = (event: ChatViewEventSimple): number | string | undefined => {
  return event.ended ?? event.endTime ?? event.timestamp
}
