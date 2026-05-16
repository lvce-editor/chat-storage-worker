import { clearPartialMessageValue, getChatSessionStorage } from '../ChatSessionStorageState/ChatSessionStorageState.ts'
import { notifySessionListeners } from '../NotifySessionListeners/NotifySessionListeners.ts'

export const deleteChatSession = async (id: string): Promise<void> => {
  await getChatSessionStorage().deleteSession(id)
  clearPartialMessageValue(id)
  await notifySessionListeners(id)
}
