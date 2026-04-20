import type { DebugEvent, DebugEventStorage } from '../DebugEventStorageTypes/DebugEventStorageTypes.ts'

export class InMemoryDebugEventStorage implements DebugEventStorage {
  private readonly events: DebugEvent[] = []

  async appendEvent(event: DebugEvent): Promise<void> {
    this.events.push(event)
  }

  async clear(): Promise<void> {
    this.events.length = 0
  }

  async getEvents(sessionId?: string): Promise<readonly DebugEvent[]> {
    if (!sessionId) {
      return [...this.events]
    }
    return this.events.filter((event) => event.sessionId === sessionId)
  }
}
