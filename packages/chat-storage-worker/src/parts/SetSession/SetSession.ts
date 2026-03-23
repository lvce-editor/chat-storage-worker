import { wrap } from 'idb'
import type { ChatSession } from '../ChatSession/ChatSession.ts'
import type { GetDatabasePromise, SetDatabasePromise } from '../GetDatabase/GetDatabase.ts'
import { getDatabase } from '../GetDatabase/GetDatabase.ts'

export const setSession = async (
  getDatabasePromise: GetDatabasePromise,
  setDatabasePromise: SetDatabasePromise,
  databaseName: string,
  databaseVersion: number,
  storeName: string,
  session: ChatSession,
): Promise<void> => {
  const database = wrap(await getDatabase(getDatabasePromise, setDatabasePromise, databaseName, databaseVersion, storeName))
  const transaction = database.transaction(storeName, 'readwrite')
  const store = transaction.objectStore(storeName)
  await store.put(session)
  await transaction.done
}
