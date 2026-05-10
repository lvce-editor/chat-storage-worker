import { afterEach, expect, jest, test } from '@jest/globals'
import type { ChatViewEventSimple } from '../src/parts/ChatViewEventSimple/ChatViewEventSimple.ts'
import * as GetEventDetailsBySessionIdAndEventId from '../src/parts/GetEventDetailsBySessionIdAndEventId/GetEventDetailsBySessionIdAndEventId.ts'
import * as LoadSelectedEvent from '../src/parts/LoadSelectedEvent/LoadSelectedEvent.ts'
import * as OpenDatabase from '../src/parts/OpenDatabase/OpenDatabase.ts'

type Database = Awaited<ReturnType<typeof OpenDatabase.openDatabase>>
type Store = Parameters<typeof GetEventDetailsBySessionIdAndEventId.getEventDetailsBySessionIdAndEventId>[0]
type TestDatabase = {
  readonly close: Database['close']
  readonly objectStoreNames: Database['objectStoreNames']
  readonly store: Store
  readonly transaction: Database['transaction']
}

afterEach(() => {
  jest.restoreAllMocks()
})

const createStore = (): Store => {
  return {
    get: jest.fn() as unknown as Store['get'],
    getAll: jest.fn() as unknown as Store['getAll'],
    index: jest.fn() as unknown as Store['index'],
    indexNames: {
      contains: jest.fn(),
    } as unknown as Store['indexNames'],
  }
}

const createDatabase = (containsEventStore: boolean): TestDatabase => {
  const store = createStore()
  return {
    close: jest.fn(),
    objectStoreNames: {
      contains: jest.fn().mockReturnValue(containsEventStore),
    } as unknown as Database['objectStoreNames'],
    store,
    transaction: jest.fn().mockReturnValue({
      objectStore: jest.fn().mockReturnValue(store),
    }) as unknown as Database['transaction'],
  }
}

test('loadSelectedEvent reads event details from the configured database using an options object', async () => {
  const database = createDatabase(true)
  const event: ChatViewEventSimple = {
    eventId: 1,
    sessionId: 'session-1',
    type: 'tool-execution',
  }
  const openDatabaseSpy = jest.spyOn(OpenDatabase, 'openDatabase').mockResolvedValue(database as unknown as Database)
  const getEventDetailsBySessionIdAndEventIdSpy = jest
    .spyOn(GetEventDetailsBySessionIdAndEventId, 'getEventDetailsBySessionIdAndEventId')
    .mockResolvedValue(event)

  const result = await LoadSelectedEvent.loadSelectedEvent({
    databaseName: 'chat-storage-worker',
    databaseVersion: 3,
    eventId: 1,
    eventStoreName: 'events',
    sessionId: 'session-1',
    sessionIdIndexName: 'sessionId',
    type: 'tool-execution',
  })

  expect(openDatabaseSpy).toHaveBeenCalledWith('chat-storage-worker', 3)
  expect(getEventDetailsBySessionIdAndEventIdSpy.mock.calls[0][0]).toBe(database.store)
  expect(getEventDetailsBySessionIdAndEventIdSpy.mock.calls[0][1]).toBe('session-1')
  expect(getEventDetailsBySessionIdAndEventIdSpy.mock.calls[0][2]).toBe('sessionId')
  expect(getEventDetailsBySessionIdAndEventIdSpy.mock.calls[0][3]).toBe(1)
  expect(getEventDetailsBySessionIdAndEventIdSpy.mock.calls[0][4]).toBe('tool-execution')
  expect(result).toEqual(event)
  expect(database.close).toHaveBeenCalledTimes(1)
})

test('loadSelectedEvent returns null when the configured event store does not exist', async () => {
  const database = createDatabase(false)
  const openDatabaseSpy = jest.spyOn(OpenDatabase, 'openDatabase').mockResolvedValue(database as unknown as Database)
  const getEventDetailsBySessionIdAndEventIdSpy = jest
    .spyOn(GetEventDetailsBySessionIdAndEventId, 'getEventDetailsBySessionIdAndEventId')
    .mockResolvedValue(undefined)

  const result = await LoadSelectedEvent.loadSelectedEvent({
    databaseName: 'chat-storage-worker',
    databaseVersion: 3,
    eventId: 1,
    eventStoreName: 'events',
    sessionId: 'session-1',
    sessionIdIndexName: 'sessionId',
    type: 'tool-execution',
  })

  expect(result).toBeNull()
  expect(openDatabaseSpy).toHaveBeenCalledWith('chat-storage-worker', 3)
  expect(getEventDetailsBySessionIdAndEventIdSpy).not.toHaveBeenCalled()
  expect(database.close).toHaveBeenCalledTimes(1)
})

test('loadSelectedEvent falls back to the legacy session event store when the debug database has no event', async () => {
  const debugDatabase = createDatabase(true)
  const legacyDatabase = createDatabase(true)
  const event: ChatViewEventSimple = {
    eventId: 1,
    sessionId: 'session-1',
    type: 'tool-execution',
  }
  const openDatabaseSpy = jest.spyOn(OpenDatabase, 'openDatabase').mockImplementation(async (databaseName: string) => {
    if (databaseName === 'lvce-chat-debug-events') {
      return debugDatabase as unknown as Database
    }
    return legacyDatabase as unknown as Database
  })
  const getEventDetailsBySessionIdAndEventIdSpy = jest
    .spyOn(GetEventDetailsBySessionIdAndEventId, 'getEventDetailsBySessionIdAndEventId')
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(event)

  const result = await LoadSelectedEvent.loadSelectedEvent({
    databaseName: 'lvce-chat-debug-events',
    databaseVersion: 1,
    eventId: 1,
    eventStoreName: 'chat-debug-events',
    sessionId: 'session-1',
    sessionIdIndexName: 'sessionId',
    type: 'tool-execution',
  })

  expect(openDatabaseSpy.mock.calls).toEqual([
    ['lvce-chat-debug-events', 1],
    ['lvce-chat-view-sessions', 2],
  ])
  expect(getEventDetailsBySessionIdAndEventIdSpy.mock.calls[0][0]).toBe(debugDatabase.store)
  expect(getEventDetailsBySessionIdAndEventIdSpy.mock.calls[1][0]).toBe(legacyDatabase.store)
  expect(result).toEqual(event)
  expect(debugDatabase.close).toHaveBeenCalledTimes(1)
  expect(legacyDatabase.close).toHaveBeenCalledTimes(1)
})
