import type { ChatSession } from '../ChatSession/ChatSession.ts'
import type { ChatSessionStorage } from '../ChatSessionStorageTypes/ChatSessionStorageTypes.ts'
import type { ChatViewEvent } from '../ChatViewEvent/ChatViewEvent.ts'
import type { DebugEvent, DebugEventStorage } from '../DebugEventStorageTypes/DebugEventStorageTypes.ts'
import { filterDebugChatViewEvents, isRequiredChatViewEvent } from '../IsRequiredChatViewEvent/IsRequiredChatViewEvent.ts'

export class CompositeChatSessionStorage implements ChatSessionStorage {
  constructor(
    private readonly sessionStorage: Readonly<ChatSessionStorage>,
    private readonly debugEventStorage: Readonly<DebugEventStorage>,
  ) {}

  async appendDebugEvent(event: DebugEvent): Promise<void> {
    await this.debugEventStorage.appendEvent(event)
  }

  async appendEvent(event: ChatViewEvent): Promise<void> {
    await this.sessionStorage.appendEvent(event)
  }

  async clear(): Promise<void> {
    await Promise.all([this.sessionStorage.clear(), this.debugEventStorage.clear()])
  }

  async deleteSession(id: string): Promise<void> {
    await this.sessionStorage.deleteSession(id)
  }

  async getEvents(sessionId: string): Promise<readonly ChatViewEvent[]> {
    return this.sessionStorage.getEvents(sessionId)
  }

  async getDebugEvents(sessionId: string): Promise<readonly DebugEvent[]> {
    const debugEvents = await this.debugEventStorage.getEvents(sessionId)
    if (debugEvents.length > 0) {
      return debugEvents
    }
    const legacyEvents = await this.sessionStorage.getEvents(sessionId)
    return filterDebugChatViewEvents(legacyEvents) as readonly DebugEvent[]
  }

  async getSession(id: string): Promise<ChatSession | undefined> {
    return this.sessionStorage.getSession(id)
  }

  async listSessions(): Promise<readonly ChatSession[]> {
    return this.sessionStorage.listSessions()
  }

  async setSession(session: ChatSession): Promise<void> {
    await this.sessionStorage.setSession(session)
  }
}
