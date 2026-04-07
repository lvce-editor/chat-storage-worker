// cspell:ignore IDBP
import type { IDBPObjectStore } from 'idb'
import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
export const getAllEvents = async (store: Pick<IDBPObjectStore, 'getAll'>): Promise<readonly ChatViewEventSimple[]> => {
  const all = await store.getAll()
  return all as readonly ChatViewEventSimple[]
}
