import type { ChatSessionStorage } from '../ChatSessionStorageTypes/ChatSessionStorageTypes.ts'
import type { ChatViewEvent } from '../ChatViewEvent/ChatViewEvent.ts'
import type { DebugEvent } from '../DebugEventStorageTypes/DebugEventStorageTypes.ts'
import { getChatSessionStorage } from '../ChatSessionStorageState/ChatSessionStorageState.ts'
import { notifySessionListeners } from '../NotifySessionListeners/NotifySessionListeners.ts'

interface DebugAppendCapableStorage extends ChatSessionStorage {
  appendDebugEvent(event: DebugEvent): Promise<void>
}

const isDebugAppendCapableStorage = (storage: Readonly<ChatSessionStorage>): storage is DebugAppendCapableStorage => {
  return 'appendDebugEvent' in storage
}

export const appendChatDebugEvent = async (event: DebugEvent): Promise<void> => {
  const storage = getChatSessionStorage()
  if (isDebugAppendCapableStorage(storage)) {
    await storage.appendDebugEvent(event)
  } else {
    await storage.appendEvent(event as ChatViewEvent)
  }
  if (event.sessionId) {
    notifySessionListeners(event.sessionId)
  }
}