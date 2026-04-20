import { getChatSessionStorage } from '../ChatSessionStorageState/ChatSessionStorageState.ts'
import { notifyAllSessionListeners } from '../NotifyAllSessionListeners/NotifyAllSessionListeners.ts'

export const clearChatSessions = async (): Promise<void> => {
  await getChatSessionStorage().clear()
  notifyAllSessionListeners()
}
