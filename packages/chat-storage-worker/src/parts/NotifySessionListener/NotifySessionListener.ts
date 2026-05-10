import * as RpcRegistry from '@lvce-editor/rpc-registry'
import type { SessionListener } from '../ChatSessionStorageTypes/ChatSessionStorageTypes.ts'

export const notifySessionListener = async (listener: SessionListener): Promise<void> => {
  const rpc = RpcRegistry.get(listener.rpcId)
  if (!rpc) {
    return
  }
  await rpc.invoke('handleChatStorageUpdate', listener.uid, listener.sessionId)
}
