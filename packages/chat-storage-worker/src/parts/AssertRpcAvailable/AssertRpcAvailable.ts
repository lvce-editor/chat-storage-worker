import * as RpcRegistry from '@lvce-editor/rpc-registry'

export const assertRpcAvailable = (rpcId: number): void => {
  const rpc = RpcRegistry.get(rpcId)
  if (!rpc) {
    throw new Error(`No rpc with id ${rpcId} was found`)
  }
}