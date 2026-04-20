import type { ChatSessionStorage } from '../ChatSessionStorageTypes/ChatSessionStorageTypes.ts'
import { setChatSessionStorageValue } from '../ChatSessionStorageState/ChatSessionStorageState.ts'

export const setChatSessionStorage = (storage: Readonly<ChatSessionStorage>): void => {
  setChatSessionStorageValue(storage)
}
