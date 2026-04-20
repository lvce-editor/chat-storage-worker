import type { ChatSessionStorage } from '../ChatSessionStorageTypes/ChatSessionStorageTypes.ts'
import type { DebugEvent } from '../DebugEventStorageTypes/DebugEventStorageTypes.ts'
import { getChatSessionStorage } from '../ChatSessionStorageState/ChatSessionStorageState.ts'
import { filterDebugChatViewEvents } from '../IsRequiredChatViewEvent/IsRequiredChatViewEvent.ts'

interface DebugGetCapableStorage extends ChatSessionStorage {
  getDebugEvents(sessionId: string): Promise<readonly DebugEvent[]>
}

const isDebugGetCapableStorage = (storage: Readonly<ChatSessionStorage>): storage is DebugGetCapableStorage => {
  return 'getDebugEvents' in storage
}

export const getDebugEvents = async (sessionId: string): Promise<readonly DebugEvent[]> => {
  const storage = getChatSessionStorage()
  if (isDebugGetCapableStorage(storage)) {
    return storage.getDebugEvents(sessionId)
  }
  return filterDebugChatViewEvents(await storage.getEvents(sessionId)) as readonly DebugEvent[]
}
