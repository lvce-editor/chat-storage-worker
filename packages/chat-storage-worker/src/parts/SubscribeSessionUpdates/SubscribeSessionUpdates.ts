import type { SessionListener } from '../ChatSessionStorageTypes/ChatSessionStorageTypes.ts'
import { assertRpcAvailable } from '../AssertRpcAvailable/AssertRpcAvailable.ts'
import { getSessionListeners } from '../ChatSessionStorageState/ChatSessionStorageState.ts'
import { getSessionListenerKey } from '../GetSessionListenerKey/GetSessionListenerKey.ts'

export const subscribeSessionUpdates = (listener: SessionListener): void => {
  assertRpcAvailable(listener.rpcId)
  getSessionListeners().set(getSessionListenerKey(listener), listener)
}