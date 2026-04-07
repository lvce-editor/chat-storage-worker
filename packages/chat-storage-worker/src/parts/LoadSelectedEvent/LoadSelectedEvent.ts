import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'
import * as GetEventDetailsBySessionIdAndEventId from '../GetEventDetailsBySessionIdAndEventId/GetEventDetailsBySessionIdAndEventId.ts'
import * as OpenDatabase from '../OpenDatabase/OpenDatabase.ts'

export interface LoadSelectedEventOptions {
  readonly databaseName: string
  readonly databaseVersion: number
  readonly eventStoreName: string
  readonly eventId: number
  readonly sessionId: string
  readonly sessionIdIndexName: string
  readonly type: string
}

export const loadSelectedEventDependencies = {
  getEventDetailsBySessionIdAndEventId: GetEventDetailsBySessionIdAndEventId.getEventDetailsBySessionIdAndEventId,
  openDatabase: OpenDatabase.openDatabase,
}

export const loadSelectedEvent = async ({
  databaseName,
  databaseVersion,
  eventStoreName,
  eventId,
  sessionId,
  sessionIdIndexName,
  type,
}: LoadSelectedEventOptions): Promise<ChatViewEventSimple | null> => {
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
