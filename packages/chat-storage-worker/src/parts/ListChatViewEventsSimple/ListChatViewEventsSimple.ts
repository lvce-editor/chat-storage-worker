import type { ListChatViewEventsResult } from '../ListChatViewEventsResult/ListChatViewEventsResult.ts'
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

export const listChatViewEventsSimple = async (
  {
    databaseName,
    databaseVersion,
    eventStoreName,
    indexedDbSupportOverride,
    sessionId,
    sessionIdIndexName,
  }: ListChatViewEventsSimpleOptions,
): Promise<ListChatViewEventsResult> => {
  if (!isIndexedDbSupported(indexedDbSupportOverride)) {
    return {
      type: 'not-supported',
    }
  }

  try {
    const database = await listChatViewEventsDependencies.openDatabase(databaseName, databaseVersion)
    try {
      if (!database.objectStoreNames.contains(eventStoreName)) {
        return {
          events: [],
          type: 'success',
        }
      }
      const transaction = database.transaction(eventStoreName, 'readonly')
      const store = transaction.objectStore(eventStoreName)
      if (!sessionId) {
        return {
          events: [],
          type: 'success',
        }
      }
      const events = await listChatViewEventsDependencies.getEventsBySessionId(store, sessionId, sessionIdIndexName)
      return {
        events,
        type: 'success',
      }
    } finally {
      database.close()
    }
  } catch (error) {
    return {
      error,
      type: 'error',
    }
  }
}
