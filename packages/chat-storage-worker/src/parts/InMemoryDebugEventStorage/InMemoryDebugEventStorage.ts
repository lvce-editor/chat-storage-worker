import type { DebugEvent, DebugEventStorage } from '../DebugEventStorageTypes/DebugEventStorageTypes.ts'

export class InMemoryDebugEventStorage implements DebugEventStorage {
  private readonly events: DebugEvent[] = []

  async appendEvent(event: DebugEvent): Promise<void> {
    this.events.push(event)
  }

  async clear(): Promise<void> {
    this.events.length = 0
  }

  async deleteSession(sessionId: string): Promise<void> {
    for (let index = this.events.length - 1; index >= 0; index -= 1) {
      if (this.events[index].sessionId === sessionId) {
        this.events.splice(index, 1)
      }
    }
  }

  async getEvents(sessionId?: string): Promise<readonly DebugEvent[]> {
    if (!sessionId) {
      return [...this.events]
    }
    return this.events.filter((event) => event.sessionId === sessionId)
  }
}
