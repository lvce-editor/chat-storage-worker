import { expect, jest, test } from '@jest/globals'
import type { ChatViewEventSimple } from '../src/parts/ChatViewEventSimple/ChatViewEventSimple.ts'
import * as ListChatViewEventsSimple from '../src/parts/ListChatViewEventsSimple/ListChatViewEventsSimple.ts'

type OpenDatabase = typeof ListChatViewEventsSimple.listChatViewEventsDependencies.openDatabase
type Database = Awaited<ReturnType<OpenDatabase>>
type GetEventsBySessionId = typeof ListChatViewEventsSimple.listChatViewEventsDependencies.getEventsBySessionId
type Store = Parameters<GetEventsBySessionId>[0]

const createStore = (): Store => {
  return {
    getAll: jest.fn(),
    index: jest.fn(),
    indexNames: {
      contains: jest.fn(),
    } as unknown as Store['indexNames'],
  } as unknown as Store
}

const createDatabase = (containsEventStore: boolean): Database & { readonly store: Store } => {
  const store = createStore()
  return {
    close: jest.fn(),
    objectStoreNames: {
      contains: jest.fn().mockReturnValue(containsEventStore),
    } as unknown as Database['objectStoreNames'],
    store,
    transaction: jest.fn().mockReturnValue({
      objectStore: jest.fn().mockReturnValue(store),
    }),
  } as unknown as Database & { readonly store: Store }
}

test('listChatViewEventsSimple reads from the configured database using an options object', async () => {
  const originalOpenDatabase = ListChatViewEventsSimple.listChatViewEventsDependencies.openDatabase
  const originalGetEventsBySessionId = ListChatViewEventsSimple.listChatViewEventsDependencies.getEventsBySessionId
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
  const openDatabaseMock = jest.fn<OpenDatabase>(async () => database)
  const getEventsBySessionIdMock = jest.fn<GetEventsBySessionId>(async () => events)
  ListChatViewEventsSimple.listChatViewEventsDependencies.openDatabase = openDatabaseMock as OpenDatabase
  ListChatViewEventsSimple.listChatViewEventsDependencies.getEventsBySessionId = getEventsBySessionIdMock as GetEventsBySessionId

  try {
    const result = await ListChatViewEventsSimple.listChatViewEventsSimple({
      databaseName: 'chat-storage-worker',
      databaseVersion: 3,
      eventStoreName: 'events',
      sessionId: 'session-1',
      sessionIdIndexName: 'sessionId',
    })

    expect(openDatabaseMock).toHaveBeenCalledWith('chat-storage-worker', 3)
    expect(getEventsBySessionIdMock.mock.calls[0][0]).toBe(database.store)
    expect(getEventsBySessionIdMock.mock.calls[0][1]).toBe('session-1')
    expect(getEventsBySessionIdMock.mock.calls[0][2]).toBe('sessionId')
    expect(result).toEqual({
      events,
      type: 'success',
    })
    expect(database.close).toHaveBeenCalledTimes(1)
  } finally {
    ListChatViewEventsSimple.listChatViewEventsDependencies.openDatabase = originalOpenDatabase
    ListChatViewEventsSimple.listChatViewEventsDependencies.getEventsBySessionId = originalGetEventsBySessionId
  }
})

test('listChatViewEventsSimple returns an empty result when sessionId is missing from the options object', async () => {
  const originalOpenDatabase = ListChatViewEventsSimple.listChatViewEventsDependencies.openDatabase
  const originalGetEventsBySessionId = ListChatViewEventsSimple.listChatViewEventsDependencies.getEventsBySessionId
  const database = createDatabase(true)
  const openDatabaseMock = jest.fn<OpenDatabase>(async () => database)
  const getEventsBySessionIdMock = jest.fn<GetEventsBySessionId>(async () => [])
  ListChatViewEventsSimple.listChatViewEventsDependencies.openDatabase = openDatabaseMock as OpenDatabase
  ListChatViewEventsSimple.listChatViewEventsDependencies.getEventsBySessionId = getEventsBySessionIdMock as GetEventsBySessionId

  try {
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
    expect(openDatabaseMock).not.toHaveBeenCalled()
    expect(getEventsBySessionIdMock).not.toHaveBeenCalled()
    expect(database.close).not.toHaveBeenCalled()
  } finally {
    ListChatViewEventsSimple.listChatViewEventsDependencies.openDatabase = originalOpenDatabase
    ListChatViewEventsSimple.listChatViewEventsDependencies.getEventsBySessionId = originalGetEventsBySessionId
  }
})

test('listChatViewEventsSimple falls back to the legacy session event store when the debug database has no events', async () => {
  const originalOpenDatabase = ListChatViewEventsSimple.listChatViewEventsDependencies.openDatabase
  const originalGetEventsBySessionId = ListChatViewEventsSimple.listChatViewEventsDependencies.getEventsBySessionId
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
  const openDatabaseMock = jest.fn<OpenDatabase>(async (databaseName: string) => {
    if (databaseName === 'lvce-chat-debug-events') {
      return debugDatabase
    }
    return legacyDatabase
  })
  const getEventsBySessionIdMock = jest
    .fn<GetEventsBySessionId>()
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce(events)
  ListChatViewEventsSimple.listChatViewEventsDependencies.openDatabase = openDatabaseMock as OpenDatabase
  ListChatViewEventsSimple.listChatViewEventsDependencies.getEventsBySessionId = getEventsBySessionIdMock as GetEventsBySessionId

  try {
    const result = await ListChatViewEventsSimple.listChatViewEventsSimple({
      databaseName: 'lvce-chat-debug-events',
      databaseVersion: 1,
      eventStoreName: 'chat-debug-events',
      sessionId: 'session-1',
      sessionIdIndexName: 'sessionId',
    })

    expect(openDatabaseMock.mock.calls).toEqual([
      ['lvce-chat-debug-events', 1],
      ['lvce-chat-view-sessions', 2],
    ])
    expect(getEventsBySessionIdMock.mock.calls[0][0]).toBe(debugDatabase.store)
    expect(getEventsBySessionIdMock.mock.calls[1][0]).toBe(legacyDatabase.store)
    expect(result).toEqual({
      events,
      type: 'success',
    })
    expect(debugDatabase.close).toHaveBeenCalledTimes(1)
    expect(legacyDatabase.close).toHaveBeenCalledTimes(1)
  } finally {
    ListChatViewEventsSimple.listChatViewEventsDependencies.openDatabase = originalOpenDatabase
    ListChatViewEventsSimple.listChatViewEventsDependencies.getEventsBySessionId = originalGetEventsBySessionId
  }
})
