import type { IDBPDatabase } from 'idb'
import * as Idb from 'idb'

export const openDatabaseDependencies = {
  openDB: Idb.openDB,
}

export const openDatabase = async (databaseName: string, dataBaseVersion: number): Promise<IDBPDatabase> => {
  return openDatabaseDependencies.openDB(databaseName, dataBaseVersion)
}
