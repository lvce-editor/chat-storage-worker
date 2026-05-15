import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'

export type DebugEvent = ChatViewEventSimple

export interface DebugEventStorage {
  appendEvent(event: DebugEvent): Promise<void>
  clear(): Promise<void>
  deleteSession(sessionId: string): Promise<void>
  getEvents(sessionId?: string): Promise<readonly DebugEvent[]>
}
