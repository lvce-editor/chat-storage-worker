import { wrap } from 'idb'
import type { GetDatabasePromise, SetDatabasePromise } from '../GetDatabase/GetDatabase.ts'
import { getDatabase } from '../GetDatabase/GetDatabase.ts'

export const deleteSession = async (
  getDatabasePromise: GetDatabasePromise,
  setDatabasePromise: SetDatabasePromise,
  databaseName: string,
  databaseVersion: number,
  storeName: string,
  id: string,
): Promise<void> => {
  const database = wrap(await getDatabase(getDatabasePromise, setDatabasePromise, databaseName, databaseVersion, storeName))
  const transaction = database.transaction(storeName, 'readwrite')
  const store = transaction.objectStore(storeName)
  await store.delete(id)
  await transaction.done
}
