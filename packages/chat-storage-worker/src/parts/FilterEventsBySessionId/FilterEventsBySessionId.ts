import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'

export const filterEventsBySessionId = (events: readonly ChatViewEventSimple[], sessionId: string): readonly ChatViewEventSimple[] => {
  return events.filter((event) => event.sessionId === sessionId)
}
