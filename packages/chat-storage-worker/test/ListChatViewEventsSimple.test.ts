import { afterEach, expect, test } from '@jest/globals'
import type { ChatViewEventSimple } from '../src/parts/ChatViewEventSimple/ChatViewEventSimple.ts'
import {
  chatSessionStorageDatabaseName,
  chatSessionStorageDatabaseVersion,
  chatSessionStorageEventStoreName,
  chatSessionStorageSessionIdIndexName,
} from '../src/parts/ChatSessionStorageConfig/ChatSessionStorageConfig.ts'
import {
  debugEventStorageDatabaseName,
  debugEventStorageDatabaseVersion,
  debugEventStorageEventStoreName,
  debugEventStorageSessionIdIndexName,
} from '../src/parts/DebugEventStorageConfig/DebugEventStorageConfig.ts'
import { IndexedDbChatSessionStorage } from '../src/parts/IndexedDbChatSessionStorage/IndexedDbChatSessionStorage.ts'
import { IndexedDbDebugEventStorage } from '../src/parts/IndexedDbDebugEventStorage/IndexedDbDebugEventStorage.ts'
import * as ListChatViewEventsSimple from '../src/parts/ListChatViewEventsSimple/ListChatViewEventsSimple.ts'

let databaseId = 0

afterEach(() => {
  return Promise.all([new IndexedDbDebugEventStorage().clear(), new IndexedDbChatSessionStorage().clear()])
})

const createDatabaseName = (prefix: string): string => {
  databaseId++
  return `chat-storage-worker-${prefix}-${databaseId}`
}

test('listChatViewEventsSimple reads from the configured database using an options object', async () => {
  const databaseName = createDatabaseName('list-events')
  const storage = new IndexedDbDebugEventStorage({
    databaseName,
    databaseVersion: 1,
    eventStoreName: 'events',
    sessionIdIndexName: 'sessionId',
  })
  await storage.clear()
  await storage.appendEvent({
    requestId: 'request-1',
    sessionId: 'session-1',
    timestamp: 25,
    type: 'handle-input',
    value: 'hello',
  })
  await storage.appendEvent({
    sessionId: 'session-2',
    timestamp: 50,
    type: 'handle-input',
    value: 'ignore me',
  })

  const result = await ListChatViewEventsSimple.listChatViewEventsSimple({
    databaseName,
    databaseVersion: 1,
    eventStoreName: 'events',
    sessionId: 'session-1',
    sessionIdIndexName: 'sessionId',
  })

  expect(result).toEqual({
    events: [
      {
        eventId: 1,
        requestId: 'request-1',
        timestamp: 25,
        type: 'handle-input',
      },
    ],
    type: 'success',
  })
})

test('listChatViewEventsSimple returns an empty result when sessionId is missing from the options object', async () => {
  const result = await ListChatViewEventsSimple.listChatViewEventsSimple({
    databaseName: 'chat-storage-worker',
    databaseVersion: 3,
    eventStoreName: 'events',
    sessionId: '',
    sessionIdIndexName: 'sessionId',
  })

  expect(result).toEqual({
    events: [],
    type: 'success',
  })
})

test('listChatViewEventsSimple falls back to the legacy session event store when the debug database has no events', async () => {
  const debugStorage = new IndexedDbDebugEventStorage({
    databaseName: debugEventStorageDatabaseName,
    databaseVersion: debugEventStorageDatabaseVersion,
    eventStoreName: debugEventStorageEventStoreName,
    sessionIdIndexName: debugEventStorageSessionIdIndexName,
  })
  const legacyStorage = new IndexedDbChatSessionStorage({
    databaseName: chatSessionStorageDatabaseName,
    databaseVersion: chatSessionStorageDatabaseVersion,
    eventStoreName: chatSessionStorageEventStoreName,
  })
  await debugStorage.clear()
  await legacyStorage.clear()
  await legacyStorage.appendEvent({
      sessionId: 'session-1',
      timestamp: 25,
      type: 'handle-input',
      value: 'hello',
  })

  const result = await ListChatViewEventsSimple.listChatViewEventsSimple({
    databaseName: debugEventStorageDatabaseName,
    databaseVersion: debugEventStorageDatabaseVersion,
    eventStoreName: debugEventStorageEventStoreName,
    sessionId: 'session-1',
    sessionIdIndexName: debugEventStorageSessionIdIndexName,
  })

  expect(result).toEqual({
    events: [
      {
        eventId: 1,
        timestamp: 25,
        type: 'handle-input',
      },
    ],
    type: 'success',
  })
})
