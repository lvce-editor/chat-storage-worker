import { getSessionListeners } from '../ChatSessionStorageState/ChatSessionStorageState.ts'
import { notifySessionListener } from '../NotifySessionListener/NotifySessionListener.ts'

export const notifyAllSessionListeners = (): void => {
  for (const listener of getSessionListeners().values()) {
    notifySessionListener(listener)
  }
}
