import type { ChatViewEvent } from '../ChatViewEvent/ChatViewEvent.ts'
import { getChatSessionStorage } from '../ChatSessionStorageState/ChatSessionStorageState.ts'

export const getMessages = async (sessionId: string): Promise<readonly ChatViewEvent[]> => {
  if (!sessionId) {
    throw new Error(`session id is required`)
  }
  // TODO get events relevant for rendering chat messages in the ui
  return getChatSessionStorage().getEvents(sessionId)
}
