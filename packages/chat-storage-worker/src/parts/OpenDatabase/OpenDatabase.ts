/* eslint-disable @typescript-eslint/prefer-readonly-parameter-types */
import type { IDBPDatabase } from 'idb'
import * as Idb from 'idb'
import {
  chatSessionStorageDatabaseName,
  chatSessionStorageEventStoreName,
  chatSessionStorageSessionIdIndexName,
  chatSessionStorageStoreName,
} from '../ChatSessionStorageConfig/ChatSessionStorageConfig.ts'
import {
  debugEventStorageDatabaseName,
  debugEventStorageEventStoreName,
  debugEventStorageSessionIdIndexName,
} from '../DebugEventStorageConfig/DebugEventStorageConfig.ts'

const ensureChatSessionSchema = (database: any, transaction: any): void => {
  if (!database.objectStoreNames.contains(chatSessionStorageStoreName)) {
    database.createObjectStore(chatSessionStorageStoreName, {
      keyPath: 'id',
    })
  }
  if (database.objectStoreNames.contains(chatSessionStorageEventStoreName)) {
    const eventStore = transaction?.objectStore(chatSessionStorageEventStoreName)
    if (eventStore && !eventStore.indexNames.contains(chatSessionStorageSessionIdIndexName)) {
      eventStore.createIndex(chatSessionStorageSessionIdIndexName, 'sessionId', { unique: false })
    }
    return
  }
  const eventStore = database.createObjectStore(chatSessionStorageEventStoreName, {
    autoIncrement: true,
    keyPath: 'eventId',
  })
  eventStore.createIndex(chatSessionStorageSessionIdIndexName, 'sessionId', { unique: false })
}

const ensureDebugEventSchema = (database: any, transaction: any): void => {
  if (database.objectStoreNames.contains(debugEventStorageEventStoreName)) {
    const eventStore = transaction?.objectStore(debugEventStorageEventStoreName)
    if (eventStore && !eventStore.indexNames.contains(debugEventStorageSessionIdIndexName)) {
      eventStore.createIndex(debugEventStorageSessionIdIndexName, 'sessionId', { unique: false })
    }
    return
  }
  const eventStore = database.createObjectStore(debugEventStorageEventStoreName, {
    autoIncrement: true,
    keyPath: 'eventId',
  })
  eventStore.createIndex(debugEventStorageSessionIdIndexName, 'sessionId', { unique: false })
}

export const openDatabase = async (databaseName: string, dataBaseVersion: number): Promise<IDBPDatabase> => {
  return Idb.openDB(databaseName, dataBaseVersion, {
    upgrade(database, _oldVersion, _newVersion, transaction) {
      if (databaseName === chatSessionStorageDatabaseName) {
        ensureChatSessionSchema(database, transaction)
        return
      }
      if (databaseName === debugEventStorageDatabaseName) {
        ensureDebugEventSchema(database, transaction)
      }
    },
  })
}
