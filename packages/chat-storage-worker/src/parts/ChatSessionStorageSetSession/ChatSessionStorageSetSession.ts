import type { ChatSession } from '../ChatSession/ChatSession.ts'
import { getChatSessionStorage } from '../ChatSessionStorageState/ChatSessionStorageState.ts'
import { notifySessionListeners } from '../NotifySessionListeners/NotifySessionListeners.ts'

export const setSession = async (session: ChatSession): Promise<void> => {
  await getChatSessionStorage().setSession(session)
  notifySessionListeners(session.id)
}