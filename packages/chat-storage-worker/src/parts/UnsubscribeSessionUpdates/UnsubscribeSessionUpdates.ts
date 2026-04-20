import type { SessionListenerIdentifier } from '../ChatSessionStorageTypes/ChatSessionStorageTypes.ts'
import { getSessionListeners } from '../ChatSessionStorageState/ChatSessionStorageState.ts'
import { getSessionListenerKey } from '../GetSessionListenerKey/GetSessionListenerKey.ts'

export const unsubscribeSessionUpdates = (listener: SessionListenerIdentifier): void => {
  getSessionListeners().delete(getSessionListenerKey(listener))
}