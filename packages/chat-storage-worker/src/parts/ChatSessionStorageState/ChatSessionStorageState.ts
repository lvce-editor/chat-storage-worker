import type { ChatMessage } from '../ChatMessage/ChatMessage.ts'
import type { ChatSessionStorage, SessionListener } from '../ChatSessionStorageTypes/ChatSessionStorageTypes.ts'
import { createDefaultStorage, createInMemoryStorage } from '../CreateDefaultStorage/CreateDefaultStorage.ts'

let chatSessionStorage: Readonly<ChatSessionStorage> = createDefaultStorage()

// TODO should store it as an array of listeners per sessionId
const sessionListeners = new Map<string, SessionListener>()
const partialMessages = new Map<string, ChatMessage>()

export const getChatSessionStorage = (): Readonly<ChatSessionStorage> => {
  return chatSessionStorage
}

export const setChatSessionStorageValue = (storage: Readonly<ChatSessionStorage>): void => {
  chatSessionStorage = storage
}

export const getSessionListeners = (): Map<string, SessionListener> => {
  return sessionListeners
}

export const getPartialMessage = (sessionId: string): ChatMessage | undefined => {
  return partialMessages.get(sessionId)
}

export const hasPartialMessage = (sessionId: string): boolean => {
  return partialMessages.has(sessionId)
}

export const setPartialMessageValue = (sessionId: string, message: ChatMessage): void => {
  partialMessages.set(sessionId, message)
}

export const clearPartialMessageValue = (sessionId: string): boolean => {
  return partialMessages.delete(sessionId)
}

export const clearAllPartialMessages = (): void => {
  partialMessages.clear()
}

export const resetChatSessionStorageState = (): void => {
  chatSessionStorage = createInMemoryStorage()
  partialMessages.clear()
  sessionListeners.clear()
}
