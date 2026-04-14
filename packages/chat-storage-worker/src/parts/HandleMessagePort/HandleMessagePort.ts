import { PlainMessagePortRpc } from '@lvce-editor/rpc'
import { set } from '@lvce-editor/rpc-registry'
import { commandMap } from '../CommandMap/CommandMap.ts'

export const handleMessagePort = async (port: MessagePort, rpcId: number): Promise<void> => {
  const rpc = await PlainMessagePortRpc.create({
    commandMap: commandMap,
    isMessagePortOpen: true,
    messagePort: port,
  })
  if (rpcId) {
    set(rpcId, rpc)
  }
}
