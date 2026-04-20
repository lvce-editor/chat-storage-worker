import type { ChatSessionStorage } from '../ChatSessionStorageTypes/ChatSessionStorageTypes.ts'
import { CompositeChatSessionStorage } from '../CompositeChatSessionStorage/CompositeChatSessionStorage.ts'
import { IndexedDbChatSessionStorage } from '../IndexedDbChatSessionStorage/IndexedDbChatSessionStorage.ts'
import { IndexedDbDebugEventStorage } from '../IndexedDbDebugEventStorage/IndexedDbDebugEventStorage.ts'
import { InMemoryChatSessionStorage } from '../InMemoryChatSessionStorage/InMemoryChatSessionStorage.ts'
import { InMemoryDebugEventStorage } from '../InMemoryDebugEventStorage/InMemoryDebugEventStorage.ts'

export const createDefaultStorage = (): Readonly<ChatSessionStorage> => {
  if (typeof indexedDB === 'undefined') {
    return new CompositeChatSessionStorage(new InMemoryChatSessionStorage(), new InMemoryDebugEventStorage())
  }
  return new CompositeChatSessionStorage(new IndexedDbChatSessionStorage(), new IndexedDbDebugEventStorage())
}

export const createInMemoryStorage = (): Readonly<ChatSessionStorage> => {
  return new CompositeChatSessionStorage(new InMemoryChatSessionStorage(), new InMemoryDebugEventStorage())
}
