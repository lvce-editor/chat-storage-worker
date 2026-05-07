import type { ChatViewEvent } from '../ChatViewEvent/ChatViewEvent.ts'
import { getChatSessionStorage } from '../ChatSessionStorageState/ChatSessionStorageState.ts'

export const getChatViewEvents = async (sessionId: string): Promise<readonly ChatViewEvent[]> => {
  return getChatSessionStorage().getEvents(sessionId)
}
