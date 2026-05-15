import { afterEach, expect, jest, test } from '@jest/globals'
import { openDB } from 'idb'
import type { ChatMessage } from '../src/parts/ChatMessage/ChatMessage.ts'
import {
  chatSessionStorageDatabaseName,
  chatSessionStorageDatabaseVersion,
  chatSessionStorageEventStoreName,
  chatSessionStorageSessionIdIndexName,
} from '../src/parts/ChatSessionStorageConfig/ChatSessionStorageConfig.ts'
import { getMessages } from '../src/parts/GetMessages/GetMessages.ts'

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
})

test('getMessages uses sessionId index and returns only matching message events', async () => {
  await deleteDatabase(chatSessionStorageDatabaseName)
  const database = await openDB(chatSessionStorageDatabaseName, chatSessionStorageDatabaseVersion, {
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
    upgrade(nextDatabase) {
      const eventStore = nextDatabase.createObjectStore(chatSessionStorageEventStoreName, {
        autoIncrement: true,
      })
      eventStore.createIndex(chatSessionStorageSessionIdIndexName, 'sessionId')
    },
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
