import { expect, jest, test } from '@jest/globals'
import type { ChatViewEventSimple } from '../src/parts/ChatViewEventSimple/ChatViewEventSimple.ts'
import * as LoadSelectedEvent from '../src/parts/LoadSelectedEvent/LoadSelectedEvent.ts'

type OpenDatabase = typeof LoadSelectedEvent.loadSelectedEventDependencies.openDatabase
type Database = Awaited<ReturnType<OpenDatabase>>
type GetEventDetailsBySessionIdAndEventId = typeof LoadSelectedEvent.loadSelectedEventDependencies.getEventDetailsBySessionIdAndEventId
type Store = Parameters<GetEventDetailsBySessionIdAndEventId>[0]

const createStore = (): Store => {
  return {
    get: jest.fn(),
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

test('loadSelectedEvent reads event details from the configured database using an options object', async () => {
  const originalOpenDatabase = LoadSelectedEvent.loadSelectedEventDependencies.openDatabase
  const originalGetEventDetailsBySessionIdAndEventId = LoadSelectedEvent.loadSelectedEventDependencies.getEventDetailsBySessionIdAndEventId
  const database = createDatabase(true)
  const event: ChatViewEventSimple = {
    eventId: 1,
    sessionId: 'session-1',
    type: 'tool-execution',
  }
  const openDatabaseMock = jest.fn<OpenDatabase>(async () => database)
  const getEventDetailsBySessionIdAndEventIdMock = jest.fn<GetEventDetailsBySessionIdAndEventId>(async () => event)
  LoadSelectedEvent.loadSelectedEventDependencies.openDatabase = openDatabaseMock as OpenDatabase
  LoadSelectedEvent.loadSelectedEventDependencies.getEventDetailsBySessionIdAndEventId =
    getEventDetailsBySessionIdAndEventIdMock as GetEventDetailsBySessionIdAndEventId

  try {
    const result = await LoadSelectedEvent.loadSelectedEvent({
      databaseName: 'chat-storage-worker',
      databaseVersion: 3,
      eventId: 1,
      eventStoreName: 'events',
      sessionId: 'session-1',
      sessionIdIndexName: 'sessionId',
      type: 'tool-execution',
    })

    expect(openDatabaseMock).toHaveBeenCalledWith('chat-storage-worker', 3)
    expect(getEventDetailsBySessionIdAndEventIdMock.mock.calls[0][0]).toBe(database.store)
    expect(getEventDetailsBySessionIdAndEventIdMock.mock.calls[0][1]).toBe('session-1')
    expect(getEventDetailsBySessionIdAndEventIdMock.mock.calls[0][2]).toBe('sessionId')
    expect(getEventDetailsBySessionIdAndEventIdMock.mock.calls[0][3]).toBe(1)
    expect(getEventDetailsBySessionIdAndEventIdMock.mock.calls[0][4]).toBe('tool-execution')
    expect(result).toEqual(event)
    expect(database.close).toHaveBeenCalledTimes(1)
  } finally {
    LoadSelectedEvent.loadSelectedEventDependencies.openDatabase = originalOpenDatabase
    LoadSelectedEvent.loadSelectedEventDependencies.getEventDetailsBySessionIdAndEventId = originalGetEventDetailsBySessionIdAndEventId
  }
})

test('loadSelectedEvent returns null when the configured event store does not exist', async () => {
  const originalOpenDatabase = LoadSelectedEvent.loadSelectedEventDependencies.openDatabase
  const originalGetEventDetailsBySessionIdAndEventId = LoadSelectedEvent.loadSelectedEventDependencies.getEventDetailsBySessionIdAndEventId
  const database = createDatabase(false)
  const openDatabaseMock = jest.fn<OpenDatabase>(async () => database)
  const getEventDetailsBySessionIdAndEventIdMock = jest.fn<GetEventDetailsBySessionIdAndEventId>(async () => undefined)
  LoadSelectedEvent.loadSelectedEventDependencies.openDatabase = openDatabaseMock as OpenDatabase
  LoadSelectedEvent.loadSelectedEventDependencies.getEventDetailsBySessionIdAndEventId =
    getEventDetailsBySessionIdAndEventIdMock as GetEventDetailsBySessionIdAndEventId

  try {
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
    expect(getEventDetailsBySessionIdAndEventIdMock).not.toHaveBeenCalled()
    expect(database.close).toHaveBeenCalledTimes(1)
  } finally {
    LoadSelectedEvent.loadSelectedEventDependencies.openDatabase = originalOpenDatabase
    LoadSelectedEvent.loadSelectedEventDependencies.getEventDetailsBySessionIdAndEventId = originalGetEventDetailsBySessionIdAndEventId
  }
})

test('loadSelectedEvent falls back to the legacy session event store when the debug database has no event', async () => {
  const originalOpenDatabase = LoadSelectedEvent.loadSelectedEventDependencies.openDatabase
  const originalGetEventDetailsBySessionIdAndEventId = LoadSelectedEvent.loadSelectedEventDependencies.getEventDetailsBySessionIdAndEventId
  const debugDatabase = createDatabase(true)
  const legacyDatabase = createDatabase(true)
  const event: ChatViewEventSimple = {
    eventId: 1,
    sessionId: 'session-1',
    type: 'tool-execution',
  }
  const openDatabaseMock = jest.fn<OpenDatabase>(async (databaseName: string) => {
    if (databaseName === 'lvce-chat-debug-events') {
      return debugDatabase
    }
    return legacyDatabase
  })
  const getEventDetailsBySessionIdAndEventIdMock = jest
    .fn<GetEventDetailsBySessionIdAndEventId>()
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(event)
  LoadSelectedEvent.loadSelectedEventDependencies.openDatabase = openDatabaseMock as OpenDatabase
  LoadSelectedEvent.loadSelectedEventDependencies.getEventDetailsBySessionIdAndEventId =
    getEventDetailsBySessionIdAndEventIdMock as GetEventDetailsBySessionIdAndEventId

  try {
    const result = await LoadSelectedEvent.loadSelectedEvent({
      databaseName: 'lvce-chat-debug-events',
      databaseVersion: 1,
      eventId: 1,
      eventStoreName: 'chat-debug-events',
      sessionId: 'session-1',
      sessionIdIndexName: 'sessionId',
      type: 'tool-execution',
    })

    expect(openDatabaseMock.mock.calls).toEqual([
      ['lvce-chat-debug-events', 1],
      ['lvce-chat-view-sessions', 2],
    ])
    expect(getEventDetailsBySessionIdAndEventIdMock.mock.calls[0][0]).toBe(debugDatabase.store)
    expect(getEventDetailsBySessionIdAndEventIdMock.mock.calls[1][0]).toBe(legacyDatabase.store)
    expect(result).toEqual(event)
    expect(debugDatabase.close).toHaveBeenCalledTimes(1)
    expect(legacyDatabase.close).toHaveBeenCalledTimes(1)
  } finally {
    LoadSelectedEvent.loadSelectedEventDependencies.openDatabase = originalOpenDatabase
    LoadSelectedEvent.loadSelectedEventDependencies.getEventDetailsBySessionIdAndEventId = originalGetEventDetailsBySessionIdAndEventId
  }
})
