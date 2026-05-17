import type { ChatViewEvent } from '../ChatViewEvent/ChatViewEvent.ts'
import {
  chatSessionStorageDatabaseName,
  chatSessionStorageDatabaseVersion,
  chatSessionStorageEventStoreName,
  chatSessionStorageSessionIdIndexName,
} from '../ChatSessionStorageConfig/ChatSessionStorageConfig.ts'
import { getPartialMessage } from '../ChatSessionStorageState/ChatSessionStorageState.ts'
import { openDatabase } from '../OpenDatabase/OpenDatabase.ts'

const isMessageEvent = (event: any): boolean => {
  return event.type === 'chat-message-added' || event.type === 'chat-message-updated' || event.type === 'chat-session-messages-replaced'
}

const toMessages = (events: readonly any[]): readonly ChatViewEvent[] => {
  const messages: any[] = []
  for (const event of events) {
    if (event.type === 'chat-message-added') {
      messages.push({
        message: event.message,
        timestamp: event.timestamp,
        type: 'chat-message-added',
      })
      continue
    }
    if (event.type === 'chat-message-updated') {
      const existingIndex = messages.findIndex((messageEvent) => messageEvent.message?.id === event.messageId)
      if (existingIndex === -1) {
        continue
      }
      messages[existingIndex] = {
        message: {
          ...messages[existingIndex].message,
          ...(event.inProgress === undefined
            ? {}
            : {
                inProgress: event.inProgress,
              }),
          text: event.text,
          time: event.time,
          ...(event.toolCalls === undefined
            ? {}
            : {
                toolCalls: event.toolCalls,
              }),
        },
        timestamp: event.timestamp,
        type: 'chat-message-added',
      }
      continue
    }
    if (event.type === 'chat-session-messages-replaced') {
      messages.length = 0
      messages.push(
        ...event.messages.map((message: any) => ({
          message,
          timestamp: event.timestamp,
          type: 'chat-message-added',
        })),
      )
    }
  }
  return messages as readonly ChatViewEvent[]
}

const mergePartialMessage = (messages: readonly any[], sessionId: string): readonly ChatViewEvent[] => {
  const partialMessage = getPartialMessage(sessionId)
  if (!partialMessage) {
    return messages
  }
  const partialEvent = {
    message: partialMessage,
    timestamp: partialMessage.time,
    type: 'chat-message-added',
  }
  const existingIndex = messages.findIndex((event) => event.message?.id === partialMessage.id)
  if (existingIndex === -1) {
    return [...messages, partialEvent] as readonly ChatViewEvent[]
  }
  return messages.map((event, index) => {
    if (index !== existingIndex) {
      return event
    }
    return partialEvent
  }) as readonly ChatViewEvent[]
}

const isMissingStoreError = (error: unknown): boolean => {
  return typeof error === 'object' && error !== null && 'name' in error && error.name === 'NotFoundError'
}

const getPersistedMessages = async (sessionId: string): Promise<readonly ChatViewEvent[]> => {
  const database = await openDatabase(chatSessionStorageDatabaseName, chatSessionStorageDatabaseVersion)
  try {
    const t = database.transaction(chatSessionStorageEventStoreName, 'readonly')
    const store = t.objectStore(chatSessionStorageEventStoreName)
    const index = store.index(chatSessionStorageSessionIdIndexName)
    const events = await index.getAll(sessionId)
    const messageEvents = events.filter(isMessageEvent)
    return toMessages(messageEvents)
  } catch (error) {
    if (isMissingStoreError(error)) {
      return []
    }
    throw error
  } finally {
    database.close()
  }
}

export const getMessages = async (sessionId: string): Promise<readonly ChatViewEvent[]> => {
  if (!sessionId) {
    throw new Error(`session id is required`)
  }
  const messages = await getPersistedMessages(sessionId)
  return mergePartialMessage(messages, sessionId)
}
