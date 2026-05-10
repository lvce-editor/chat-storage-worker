import { getSessionListeners } from '../ChatSessionStorageState/ChatSessionStorageState.ts'
import { notifySessionListener } from '../NotifySessionListener/NotifySessionListener.ts'

export const notifySessionListeners = async (sessionId: string): Promise<void> => {
  const matching = [...getSessionListeners().values()].filter((listener) => listener.sessionId === sessionId)
  for (const listener of matching) {
    await notifySessionListener(listener)
  }
}
