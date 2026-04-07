import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'

export const getStartTime = (event: ChatViewEventSimple): number | string | undefined => {
  return event.started ?? event.startTime ?? event.timestamp
}
