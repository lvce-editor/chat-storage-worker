import type { ChatSession } from '../ChatSession/ChatSession.ts'
import type { ChatViewEvent } from '../ChatViewEvent/ChatViewEvent.ts'

export interface ChatSessionUpdateEvent {
  readonly revision: number
  readonly sessionId: string
  readonly type: 'session-deleted' | 'session-updated' | 'storage-cleared'
}

export interface SessionListener {
  readonly rpcId: number
  readonly sessionId: string
  readonly type: 'session'
  readonly uid: number
}

export interface SessionListenerIdentifier {
  readonly rpcId: number
  readonly uid: number
}

export interface ChatSessionStorage {
  appendEvent(event: ChatViewEvent): Promise<void>
  clear(): Promise<void>
  deleteSession(id: string): Promise<void>
  getEvents(sessionId: string): Promise<readonly ChatViewEvent[]>
  getSession(id: string): Promise<ChatSession | undefined>
  listSessions(): Promise<readonly ChatSession[]>
  setSession(session: ChatSession): Promise<void>
}
