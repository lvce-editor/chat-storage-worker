import { afterEach, expect, jest, test } from '@jest/globals'
import type { ChatViewEventSimple } from '../src/parts/ChatViewEventSimple/ChatViewEventSimple.ts'
import * as GetEventsBySessionId from '../src/parts/GetEventsBySessionId/GetEventsBySessionId.ts'
import * as ListChatViewEventsSimple from '../src/parts/ListChatViewEventsSimple/ListChatViewEventsSimple.ts'
import * as OpenDatabase from '../src/parts/OpenDatabase/OpenDatabase.ts'

type Database = Awaited<ReturnType<typeof OpenDatabase.openDatabase>>
type Store = Parameters<typeof GetEventsBySessionId.getSimpleEventsBySessionId>[0]
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

test('listChatViewEventsSimple reads from the configured database using an options object', async () => {
  const database = createDatabase(true)
  const events: readonly ChatViewEventSimple[] = [
    {
      eventId: 1,
      id: 'message-1',
      sessionId: 'session-1',
      text: 'hello',
      time: '2026-01-01T00:00:00.000Z',
      type: 'chat-message-user',
    },
  ]
  const openDatabaseSpy = jest.spyOn(OpenDatabase, 'openDatabase').mockResolvedValue(database as unknown as Database)
  const getEventsBySessionIdSpy = jest.spyOn(GetEventsBySessionId, 'getSimpleEventsBySessionId').mockResolvedValue(events)

  const result = await ListChatViewEventsSimple.listChatViewEventsSimple({
    databaseName: 'chat-storage-worker',
    databaseVersion: 3,
    eventStoreName: 'events',
    sessionId: 'session-1',
    sessionIdIndexName: 'sessionId',
  })

  expect(openDatabaseSpy).toHaveBeenCalledWith('chat-storage-worker', 3)
  expect(getEventsBySessionIdSpy.mock.calls[0][0]).toBe(database.store)
  expect(getEventsBySessionIdSpy.mock.calls[0][1]).toBe('session-1')
  expect(getEventsBySessionIdSpy.mock.calls[0][2]).toBe('sessionId')
  expect(result).toEqual({
    events,
    type: 'success',
  })
  expect(database.close).toHaveBeenCalledTimes(1)
})

test('listChatViewEventsSimple returns an empty result when sessionId is missing from the options object', async () => {
  const database = createDatabase(true)
  const openDatabaseSpy = jest.spyOn(OpenDatabase, 'openDatabase').mockResolvedValue(database as unknown as Database)
  const getEventsBySessionIdSpy = jest.spyOn(GetEventsBySessionId, 'getSimpleEventsBySessionId').mockResolvedValue([])

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
  expect(openDatabaseSpy).not.toHaveBeenCalled()
  expect(getEventsBySessionIdSpy).not.toHaveBeenCalled()
  expect(database.close).not.toHaveBeenCalled()
})

test('listChatViewEventsSimple falls back to the legacy session event store when the debug database has no events', async () => {
  const debugDatabase = createDatabase(true)
  const legacyDatabase = createDatabase(true)
  const events: readonly ChatViewEventSimple[] = [
    {
      eventId: 1,
      sessionId: 'session-1',
      timestamp: 25,
      type: 'handle-input',
      value: 'hello',
    },
  ]
  const openDatabaseSpy = jest.spyOn(OpenDatabase, 'openDatabase').mockImplementation(async (databaseName: string) => {
    if (databaseName === 'lvce-chat-debug-events') {
      return debugDatabase as unknown as Database
    }
    return legacyDatabase as unknown as Database
  })
  const getEventsBySessionIdSpy = jest
    .spyOn(GetEventsBySessionId, 'getSimpleEventsBySessionId')
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce(events)

  const result = await ListChatViewEventsSimple.listChatViewEventsSimple({
    databaseName: 'lvce-chat-debug-events',
    databaseVersion: 1,
    eventStoreName: 'chat-debug-events',
    sessionId: 'session-1',
    sessionIdIndexName: 'sessionId',
  })

  expect(openDatabaseSpy.mock.calls).toEqual([
    ['lvce-chat-debug-events', 1],
    ['lvce-chat-view-sessions', 2],
  ])
  expect(getEventsBySessionIdSpy.mock.calls[0][0]).toBe(debugDatabase.store)
  expect(getEventsBySessionIdSpy.mock.calls[1][0]).toBe(legacyDatabase.store)
  expect(result).toEqual({
    events,
    type: 'success',
  })
  expect(debugDatabase.close).toHaveBeenCalledTimes(1)
  expect(legacyDatabase.close).toHaveBeenCalledTimes(1)
})
