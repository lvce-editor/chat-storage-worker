import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'

export const eventStableIds = new WeakMap<ChatViewEventSimple, string>()

export const eventStableIdState = {
  nextStableEventId: 1,
}
