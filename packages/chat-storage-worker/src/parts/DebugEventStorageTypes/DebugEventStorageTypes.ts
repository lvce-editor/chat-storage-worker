import type { ChatViewEvent } from '../ChatViewEvent/ChatViewEvent.ts'
import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'

export type DebugEvent = ChatViewEvent | ChatViewEventSimple

export interface DebugEventStorage {
  appendEvent(event: DebugEvent): Promise<void>
  clear(): Promise<void>
  getEvents(sessionId?: string): Promise<readonly DebugEvent[]>
}
