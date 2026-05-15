import type { ChatViewEvent } from '../ChatViewEvent/ChatViewEvent.ts'
import {
  chatSessionStorageDatabaseName,
  chatSessionStorageDatabaseVersion,
  chatSessionStorageEventStoreName,
  chatSessionStorageSessionIdIndexName,
} from '../ChatSessionStorageConfig/ChatSessionStorageConfig.ts'
import { openDatabase } from '../OpenDatabase/OpenDatabase.ts'

const isMessageEvent = (event: any): boolean => {
  return event.type === 'chat-message-added'
}

const toMessage = (event: any): any => {
  if (event.type === 'chat-message-added') {
    return {
      message: event.message,
      timestamp: event.timestamp,
      type: event.type,
    }
  }
}

export const getMessages = async (sessionId: string): Promise<readonly ChatViewEvent[]> => {
  if (!sessionId) {
    throw new Error(`session id is required`)
  }
  const database = await openDatabase(chatSessionStorageDatabaseName, chatSessionStorageDatabaseVersion)
  const t = database.transaction(chatSessionStorageEventStoreName, 'readonly')
  const store = t.objectStore(chatSessionStorageEventStoreName)
  const index = store.index(chatSessionStorageSessionIdIndexName)
  const events = await index.getAll(sessionId)
  const messageEvents = events.filter(isMessageEvent)
  const messages = messageEvents.map(toMessage)
  return messages
}
