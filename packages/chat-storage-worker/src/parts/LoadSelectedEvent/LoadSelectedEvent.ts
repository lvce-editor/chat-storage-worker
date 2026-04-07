import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'
import * as GetEventDetailsBySessionIdAndEventId from '../GetEventDetailsBySessionIdAndEventId/GetEventDetailsBySessionIdAndEventId.ts'
import * as OpenDatabase from '../OpenDatabase/OpenDatabase.ts'

export const loadSelectedEventDependencies = {
  getEventDetailsBySessionIdAndEventId: GetEventDetailsBySessionIdAndEventId.getEventDetailsBySessionIdAndEventId,
  openDatabase: OpenDatabase.openDatabase,
}

export const loadSelectedEvent = async (
  databaseName: string,
  dataBaseVersion: number,
  eventStoreName: string,
  sessionId: string,
  sessionIdIndexName: string,
  eventId: number,
  type: string,
): Promise<ChatViewEventSimple | null> => {
  const database = await loadSelectedEventDependencies.openDatabase(databaseName, dataBaseVersion)
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
