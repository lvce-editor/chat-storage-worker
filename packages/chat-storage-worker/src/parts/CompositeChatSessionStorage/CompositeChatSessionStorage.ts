import type { ChatSession } from '../ChatSession/ChatSession.ts'
import type { ChatSessionStorage } from '../ChatSessionStorageTypes/ChatSessionStorageTypes.ts'
import type { ChatViewEvent } from '../ChatViewEvent/ChatViewEvent.ts'
import type { DebugEventStorage } from '../DebugEventStorageTypes/DebugEventStorageTypes.ts'
import { filterDebugChatViewEvents, isRequiredChatViewEvent } from '../IsRequiredChatViewEvent/IsRequiredChatViewEvent.ts'

export class CompositeChatSessionStorage implements ChatSessionStorage {
  constructor(
    private readonly sessionStorage: Readonly<ChatSessionStorage>,
    private readonly debugEventStorage: Readonly<DebugEventStorage>,
  ) {}

  async appendEvent(event: ChatViewEvent): Promise<void> {
    if (isRequiredChatViewEvent(event)) {
      await this.sessionStorage.appendEvent(event)
      return
    }
    await this.debugEventStorage.appendEvent(event)
  }

  async clear(): Promise<void> {
    await Promise.all([this.sessionStorage.clear(), this.debugEventStorage.clear()])
  }

  async deleteSession(id: string): Promise<void> {
    await this.sessionStorage.deleteSession(id)
  }

  async getEvents(sessionId?: string): Promise<readonly ChatViewEvent[]> {
    const debugEvents = await this.debugEventStorage.getEvents(sessionId)
    if (debugEvents.length > 0) {
      return debugEvents as readonly ChatViewEvent[]
    }
    const legacyEvents = await this.sessionStorage.getEvents(sessionId)
    return filterDebugChatViewEvents(legacyEvents)
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
