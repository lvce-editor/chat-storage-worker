import type { ChatSessionStorage, SessionListener } from '../ChatSessionStorageTypes/ChatSessionStorageTypes.ts'
import { createDefaultStorage } from '../CreateDefaultStorage/CreateDefaultStorage.ts'
import { InMemoryChatSessionStorage } from '../InMemoryChatSessionStorage/InMemoryChatSessionStorage.ts'

let chatSessionStorage: Readonly<ChatSessionStorage> = createDefaultStorage()
const sessionListeners = new Map<string, SessionListener>()

export const getChatSessionStorage = (): Readonly<ChatSessionStorage> => {
  return chatSessionStorage
}

export const setChatSessionStorageValue = (storage: Readonly<ChatSessionStorage>): void => {
  chatSessionStorage = storage
}

export const getSessionListeners = (): Map<string, SessionListener> => {
  return sessionListeners
}

export const resetChatSessionStorageState = (): void => {
  chatSessionStorage = new InMemoryChatSessionStorage()
  sessionListeners.clear()
}
