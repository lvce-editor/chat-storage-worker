import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'
import {
  chatSessionStorageDatabaseName,
  chatSessionStorageDatabaseVersion,
  chatSessionStorageEventStoreName,
  chatSessionStorageSessionIdIndexName,
} from '../ChatSessionStorageConfig/ChatSessionStorageConfig.ts'
import {
  debugEventStorageDatabaseName,
  debugEventStorageDatabaseVersion,
  debugEventStorageEventStoreName,
  debugEventStorageSessionIdIndexName,
} from '../DebugEventStorageConfig/DebugEventStorageConfig.ts'
import * as GetEventDetailsBySessionIdAndEventId from '../GetEventDetailsBySessionIdAndEventId/GetEventDetailsBySessionIdAndEventId.ts'
import * as OpenDatabase from '../OpenDatabase/OpenDatabase.ts'

export interface LoadSelectedEventOptions {
  readonly databaseName: string
  readonly databaseVersion: number
  readonly eventId: number
  readonly eventStoreName: string
  readonly sessionId: string
  readonly sessionIdIndexName: string
  readonly type: string
}

export const loadSelectedEventDependencies = {
  getEventDetailsBySessionIdAndEventId: GetEventDetailsBySessionIdAndEventId.getEventDetailsBySessionIdAndEventId,
  openDatabase: OpenDatabase.openDatabase,
}

const shouldUseLegacyFallback = (databaseName: string, databaseVersion: number, eventStoreName: string, sessionIdIndexName: string): boolean => {
  return (
    databaseName === debugEventStorageDatabaseName &&
    databaseVersion === debugEventStorageDatabaseVersion &&
    eventStoreName === debugEventStorageEventStoreName &&
    sessionIdIndexName === debugEventStorageSessionIdIndexName
  )
}

const loadFromStore = async (
  databaseName: string,
  databaseVersion: number,
  eventId: number,
  eventStoreName: string,
  sessionId: string,
  sessionIdIndexName: string,
  type: string,
): Promise<ChatViewEventSimple | null> => {
  const database = await loadSelectedEventDependencies.openDatabase(databaseName, databaseVersion)
  try {
    if (!database.objectStoreNames.contains(eventStoreName)) {
      return null
    }
    const transaction = database.transaction(eventStoreName, 'readonly')
    const store = transaction.objectStore(eventStoreName)
    const event = await loadSelectedEventDependencies.getEventDetailsBySessionIdAndEventId(store, sessionId, sessionIdIndexName, eventId, type)
    return event ?? null
  } finally {
    database.close()
  }
}

export const loadSelectedEvent = async ({
  databaseName,
  databaseVersion,
  eventId,
  eventStoreName,
  sessionId,
  sessionIdIndexName,
  type,
}: LoadSelectedEventOptions): Promise<ChatViewEventSimple | null> => {
  const event = await loadFromStore(databaseName, databaseVersion, eventId, eventStoreName, sessionId, sessionIdIndexName, type)
  if (event || !shouldUseLegacyFallback(databaseName, databaseVersion, eventStoreName, sessionIdIndexName)) {
    return event
  }
  return loadFromStore(
    chatSessionStorageDatabaseName,
    chatSessionStorageDatabaseVersion,
    eventId,
    chatSessionStorageEventStoreName,
    sessionId,
    chatSessionStorageSessionIdIndexName,
    type,
  )
}
