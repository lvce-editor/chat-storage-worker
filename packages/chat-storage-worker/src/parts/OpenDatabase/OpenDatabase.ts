import type { IDBPDatabase } from 'idb'
import * as Idb from 'idb'

export const openDatabase = async (databaseName: string, dataBaseVersion: number): Promise<IDBPDatabase> => {
  return Idb.openDB(databaseName, dataBaseVersion)
}
