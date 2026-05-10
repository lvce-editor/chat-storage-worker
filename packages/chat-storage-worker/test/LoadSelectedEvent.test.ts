import { afterEach, expect, test } from '@jest/globals'
import { openDB } from 'idb'
import type { ChatViewEvent } from '../src/parts/ChatViewEvent/ChatViewEvent.ts'
import type { ChatViewEventSimple } from '../src/parts/ChatViewEventSimple/ChatViewEventSimple.ts'
import {
  chatSessionStorageDatabaseName,
  chatSessionStorageDatabaseVersion,
  chatSessionStorageEventStoreName,
} from '../src/parts/ChatSessionStorageConfig/ChatSessionStorageConfig.ts'
import {
  debugEventStorageDatabaseName,
  debugEventStorageDatabaseVersion,
  debugEventStorageEventStoreName,
  debugEventStorageSessionIdIndexName,
} from '../src/parts/DebugEventStorageConfig/DebugEventStorageConfig.ts'
import { IndexedDbChatSessionStorage } from '../src/parts/IndexedDbChatSessionStorage/IndexedDbChatSessionStorage.ts'
import { IndexedDbDebugEventStorage } from '../src/parts/IndexedDbDebugEventStorage/IndexedDbDebugEventStorage.ts'
import * as LoadSelectedEvent from '../src/parts/LoadSelectedEvent/LoadSelectedEvent.ts'

let databaseId = 0

afterEach(() => {
  return Promise.all([new IndexedDbDebugEventStorage().clear(), new IndexedDbChatSessionStorage().clear()])
})

const createDatabaseName = (prefix: string): string => {
  databaseId++
  return `chat-storage-worker-${prefix}-${databaseId}`
}

const createRawEvent = (event: Readonly<Record<string, unknown>>): ChatViewEvent => {
  return event as unknown as ChatViewEvent
}

test('loadSelectedEvent reads event details from the configured database using an options object', async () => {
  const databaseName = createDatabaseName('load-selected')
  const storage = new IndexedDbDebugEventStorage({
    databaseName,
    databaseVersion: 1,
    eventStoreName: 'events',
    sessionIdIndexName: 'sessionId',
  })
  const event: ChatViewEventSimple = {
    ended: 20,
    sessionId: 'session-1',
    started: 10,
    type: 'tool-execution',
  }
  await storage.clear()
  await storage.appendEvent(event)

  const result = await LoadSelectedEvent.loadSelectedEvent({
    databaseName,
    databaseVersion: 1,
    eventId: 1,
    eventStoreName: 'events',
    sessionId: 'session-1',
    sessionIdIndexName: 'sessionId',
    type: 'tool-execution',
  })

  expect(result).toEqual({
    ...event,
    eventId: 1,
  })
})

test('loadSelectedEvent returns null when the configured event store does not exist', async () => {
  const databaseName = createDatabaseName('missing-store')
  const database = await openDB(databaseName, 1)
  database.close()

  const result = await LoadSelectedEvent.loadSelectedEvent({
    databaseName,
    databaseVersion: 1,
    eventId: 1,
    eventStoreName: 'events',
    sessionId: 'session-1',
    sessionIdIndexName: 'sessionId',
    type: 'tool-execution',
  })

  expect(result).toBeNull()
})

test('loadSelectedEvent falls back to the legacy session event store when the debug database has no event', async () => {
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
  const event = createRawEvent({
    sessionId: 'session-1',
    timestamp: '2026-01-01T00:00:00.000Z',
    type: 'handle-input',
    value: 'hello',
  })
  await debugStorage.clear()
  await legacyStorage.clear()
  await legacyStorage.appendEvent(event)

  const result = await LoadSelectedEvent.loadSelectedEvent({
    databaseName: debugEventStorageDatabaseName,
    databaseVersion: debugEventStorageDatabaseVersion,
    eventId: 1,
    eventStoreName: debugEventStorageEventStoreName,
    sessionId: 'session-1',
    sessionIdIndexName: debugEventStorageSessionIdIndexName,
    type: 'handle-input',
  })

  expect(result).toEqual({
    ...event,
    eventId: 1,
  })
})
