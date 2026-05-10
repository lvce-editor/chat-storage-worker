import { getSessionListeners } from '../ChatSessionStorageState/ChatSessionStorageState.ts'
import { notifySessionListener } from '../NotifySessionListener/NotifySessionListener.ts'

export const notifyAllSessionListeners = async (): Promise<void> => {
  for (const listener of getSessionListeners().values()) {
    await notifySessionListener(listener)
  }
}
