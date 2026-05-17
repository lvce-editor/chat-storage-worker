import { afterEach, expect, jest, test } from '@jest/globals'
import { openDB } from 'idb'
import type { ChatMessage } from '../src/parts/ChatMessage/ChatMessage.ts'
import { resetChatSessionStorage, setPartialMessage } from '../src/parts/ChatSessionStorage/ChatSessionStorage.ts'
import {
  chatSessionStorageDatabaseName,
  chatSessionStorageDatabaseVersion,
  chatSessionStorageEventStoreName,
  chatSessionStorageSessionIdIndexName,
  chatSessionStorageStoreName,
} from '../src/parts/ChatSessionStorageConfig/ChatSessionStorageConfig.ts'
import { getMessages } from '../src/parts/GetMessages/GetMessages.ts'

const upgradeDatabase = (nextDatabase: any): void => {
  if (!nextDatabase.objectStoreNames.contains(chatSessionStorageStoreName)) {
    nextDatabase.createObjectStore(chatSessionStorageStoreName, {
      keyPath: 'id',
    })
  }
  if (!nextDatabase.objectStoreNames.contains(chatSessionStorageEventStoreName)) {
    const eventStore = nextDatabase.createObjectStore(chatSessionStorageEventStoreName, {
      autoIncrement: true,
    })
    eventStore.createIndex(chatSessionStorageSessionIdIndexName, 'sessionId')
  }
}

const createMessage = (id: string, text: string): ChatMessage => {
  return {
    id,
    role: 'user',
    text,
    time: '2026-01-01T00:00:00.000Z',
  }
}

const deleteDatabase = async (databaseName: string): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(databaseName)
    request.onerror = (): void => {
      reject(request.error)
    }
    request.onblocked = (): void => {
      reject(new Error(`delete database blocked`))
    }
    request.onsuccess = (): void => {
      resolve()
    }
  })
}

afterEach(() => {
  jest.restoreAllMocks()
  resetChatSessionStorage()
})

test('getMessages uses sessionId index and returns only matching message events', async () => {
  await deleteDatabase(chatSessionStorageDatabaseName)
  const database = await openDB(chatSessionStorageDatabaseName, chatSessionStorageDatabaseVersion, {
    upgrade: upgradeDatabase,
  })
  const sessionId = 'session-2'
  try {
    await database.add(chatSessionStorageEventStoreName, {
      message: createMessage('m0', 'other session'),
      sessionId: 'session-1',
      timestamp: '2026-01-01T00:00:00.000Z',
      type: 'chat-message-added',
    })
    await database.add(chatSessionStorageEventStoreName, {
      message: createMessage('m1', 'first'),
      sessionId,
      timestamp: '2026-01-01T00:00:01.000Z',
      type: 'chat-message-added',
    })
    await database.add(chatSessionStorageEventStoreName, {
      sessionId,
      timestamp: '2026-01-01T00:00:02.000Z',
      type: 'handle-input',
      value: 'ignored',
    })
    await database.add(chatSessionStorageEventStoreName, {
      message: createMessage('m2', 'second'),
      sessionId,
      timestamp: '2026-01-01T00:00:03.000Z',
      type: 'chat-message-added',
    })

    const indexGetAllSpy = jest.spyOn(IDBIndex.prototype, 'getAll')
    const storeGetAllSpy = jest.spyOn(IDBObjectStore.prototype, 'getAll')

    const result = await getMessages(sessionId)

    expect(indexGetAllSpy.mock.calls).toEqual([[sessionId]])
    expect(storeGetAllSpy.mock.calls).toEqual([])
    expect(result).toEqual([
      {
        message: createMessage('m1', 'first'),
        timestamp: '2026-01-01T00:00:01.000Z',
        type: 'chat-message-added',
      },
      {
        message: createMessage('m2', 'second'),
        timestamp: '2026-01-01T00:00:03.000Z',
        type: 'chat-message-added',
      },
    ])
  } finally {
    database.close()
  }
})

test('getMessages returns the active partial assistant message for the session', async () => {
  await deleteDatabase(chatSessionStorageDatabaseName)
  const database = await openDB(chatSessionStorageDatabaseName, chatSessionStorageDatabaseVersion, {
    upgrade: upgradeDatabase,
  })
  const sessionId = 'session-stream'
  try {
    await database.add(chatSessionStorageEventStoreName, {
      message: createMessage('m1', 'stored'),
      sessionId,
      timestamp: '2026-01-01T00:00:01.000Z',
      type: 'chat-message-added',
    })
    await setPartialMessage({
      message: {
        id: 'm2',
        partial: true,
        role: 'assistant',
        text: 'partial answer',
        time: '2026-01-01T00:00:02.000Z',
      },
      sessionId,
    })
    await setPartialMessage({
      message: {
        id: 'm3',
        partial: true,
        role: 'assistant',
        text: 'other session',
        time: '2026-01-01T00:00:03.000Z',
      },
      sessionId: 'session-other',
    })

    const result = await getMessages(sessionId)

    expect(result).toEqual([
      {
        message: createMessage('m1', 'stored'),
        timestamp: '2026-01-01T00:00:01.000Z',
        type: 'chat-message-added',
      },
      {
        message: {
          id: 'm2',
          partial: true,
          role: 'assistant',
          text: 'partial answer',
          time: '2026-01-01T00:00:02.000Z',
        },
        timestamp: '2026-01-01T00:00:02.000Z',
        type: 'chat-message-added',
      },
    ])
  } finally {
    database.close()
  }
})

test('getMessages replays tool call updates onto the stored message', async () => {
  await deleteDatabase(chatSessionStorageDatabaseName)
  const database = await openDB(chatSessionStorageDatabaseName, chatSessionStorageDatabaseVersion, {
    upgrade: upgradeDatabase,
  })
  const sessionId = 'session-tools'
  try {
    await database.add(chatSessionStorageEventStoreName, {
      message: {
        id: 'm1',
        role: 'assistant',
        text: 'Let me check.',
        time: '2026-01-01T00:00:01.000Z',
        toolCalls: [
          {
            arguments: '{"uri":"file:///workspace/notes.txt"}',
            id: 'call_1',
            name: 'read_file',
          },
        ],
      },
      sessionId,
      timestamp: '2026-01-01T00:00:01.000Z',
      type: 'chat-message-added',
    })
    await database.add(chatSessionStorageEventStoreName, {
      inProgress: false,
      messageId: 'm1',
      sessionId,
      text: 'Let me check.',
      time: '2026-01-01T00:00:01.000Z',
      timestamp: '2026-01-01T00:00:02.000Z',
      toolCalls: [
        {
          arguments: '{"uri":"file:///workspace/notes.txt"}',
          id: 'call_1',
          name: 'read_file',
          result: '{"content":"alpha"}',
          status: 'success',
        },
      ],
      type: 'chat-message-updated',
    })

    const result = await getMessages(sessionId)

    expect(result).toEqual([
      {
        message: {
          id: 'm1',
          inProgress: false,
          role: 'assistant',
          text: 'Let me check.',
          time: '2026-01-01T00:00:01.000Z',
          toolCalls: [
            {
              arguments: '{"uri":"file:///workspace/notes.txt"}',
              id: 'call_1',
              name: 'read_file',
              result: '{"content":"alpha"}',
              status: 'success',
            },
          ],
        },
        timestamp: '2026-01-01T00:00:02.000Z',
        type: 'chat-message-added',
      },
    ])
  } finally {
    database.close()
  }
})
