import type { ListChatViewEventsResult } from '../ListChatViewEventsResult/ListChatViewEventsResult.ts'
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
import * as GetEventsBySessionId from '../GetEventsBySessionId/GetEventsBySessionId.ts'
import { isIndexedDbSupported } from '../IsIndexedDbSupported/IsIndexedDbSupported.ts'
import * as OpenDatabase from '../OpenDatabase/OpenDatabase.ts'

export interface ListChatViewEventsSimpleOptions {
  readonly databaseName: string
  readonly databaseVersion: number
  readonly eventStoreName: string
  readonly indexedDbSupportOverride?: boolean
  readonly sessionId: string
  readonly sessionIdIndexName: string
}

export const listChatViewEventsDependencies = {
  getEventsBySessionId: GetEventsBySessionId.getSimpleEventsBySessionId,
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

const getEventsFromStore = async (
  databaseName: string,
  databaseVersion: number,
  eventStoreName: string,
  sessionId: string,
  sessionIdIndexName: string,
): Promise<readonly import('../ChatViewEventSimple/ChatViewEventSimple.ts').ChatViewEventSimple[]> => {
  const database = await listChatViewEventsDependencies.openDatabase(databaseName, databaseVersion)
  try {
    if (!database.objectStoreNames.contains(eventStoreName)) {
      return []
    }
    const transaction = database.transaction(eventStoreName, 'readonly')
    const store = transaction.objectStore(eventStoreName)
    return listChatViewEventsDependencies.getEventsBySessionId(store, sessionId, sessionIdIndexName)
  } finally {
    database.close()
  }
}

export const listChatViewEventsSimple = async ({
  databaseName,
  databaseVersion,
  eventStoreName,
  indexedDbSupportOverride,
  sessionId,
  sessionIdIndexName,
}: ListChatViewEventsSimpleOptions): Promise<ListChatViewEventsResult> => {
  if (!isIndexedDbSupported(indexedDbSupportOverride)) {
    return {
      type: 'not-supported',
    }
  }
  if (!sessionId) {
    return {
      events: [],
      type: 'success',
    }
  }

  try {
    const events = await getEventsFromStore(databaseName, databaseVersion, eventStoreName, sessionId, sessionIdIndexName)
    if (events.length > 0 || !shouldUseLegacyFallback(databaseName, databaseVersion, eventStoreName, sessionIdIndexName)) {
      return {
        events,
        type: 'success',
      }
    }
    const legacyEvents = await getEventsFromStore(
      chatSessionStorageDatabaseName,
      chatSessionStorageDatabaseVersion,
      chatSessionStorageEventStoreName,
      sessionId,
      chatSessionStorageSessionIdIndexName,
    )
    return {
      events: legacyEvents,
      type: 'success',
    }
  } catch (error) {
    return {
      error,
      type: 'error',
    }
  }
}
