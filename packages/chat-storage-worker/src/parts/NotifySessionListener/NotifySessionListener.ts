import * as RpcRegistry from '@lvce-editor/rpc-registry'
import type { SessionListener } from '../ChatSessionStorageTypes/ChatSessionStorageTypes.ts'

export const notifySessionListener = (listener: SessionListener): void => {
  const rpc = RpcRegistry.get(listener.rpcId)
  if (!rpc) {
    return
  }
  void rpc.invoke('handleChatStorageUpdate', listener.uid, listener.sessionId)
}