import { MessagePortRpcClient } from '@lvce-editor/rpc'
import { commandMap } from '../CommandMap/CommandMap.ts'

export const handleMessagePort = async (port: MessagePort): Promise<void> => {
  await MessagePortRpcClient.create({
    commandMap: commandMap,
    messagePort: port,
  })
}
