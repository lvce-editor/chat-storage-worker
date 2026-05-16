import { clearPartialMessageValue } from '../ChatSessionStorageState/ChatSessionStorageState.ts'
import { notifySessionListeners } from '../NotifySessionListeners/NotifySessionListeners.ts'

export const clearPartialMessage = async (sessionId: string): Promise<void> => {
  const removed = clearPartialMessageValue(sessionId)
  if (!removed) {
    return
  }
  await notifySessionListeners(sessionId)
}
