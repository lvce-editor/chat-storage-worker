import { expect, jest, test } from '@jest/globals'
import type { ChatViewEventSimple } from '../src/parts/ChatViewEventSimple/ChatViewEventSimple.ts'
import * as LoadSelectedEvent from '../src/parts/LoadSelectedEvent/LoadSelectedEvent.ts'

const createDatabase = (containsEventStore: boolean) => {
  const store = {
    index: jest.fn(),
  }
  return {
    close: jest.fn(),
    objectStoreNames: {
      contains: jest.fn().mockReturnValue(containsEventStore),
    },
    transaction: jest.fn().mockReturnValue({
      objectStore: jest.fn().mockReturnValue(store),
    }),
    store,
  }
}

test('loadSelectedEvent reads event details from the configured database using an options object', async () => {
  const originalOpenDatabase = LoadSelectedEvent.loadSelectedEventDependencies.openDatabase
  const originalGetEventDetailsBySessionIdAndEventId =
    LoadSelectedEvent.loadSelectedEventDependencies.getEventDetailsBySessionIdAndEventId
  const database = createDatabase(true)
  const event: ChatViewEventSimple = {
    eventId: 1,
    sessionId: 'session-1',
    type: 'tool-execution',
  }
  LoadSelectedEvent.loadSelectedEventDependencies.openDatabase = jest.fn().mockResolvedValue(database)
  LoadSelectedEvent.loadSelectedEventDependencies.getEventDetailsBySessionIdAndEventId = jest.fn().mockResolvedValue(event)

  try {
    const result = await LoadSelectedEvent.loadSelectedEvent({
      databaseName: 'chat-storage-worker',
      databaseVersion: 3,
      eventStoreName: 'events',
      eventId: 1,
      sessionId: 'session-1',
      sessionIdIndexName: 'sessionId',
      type: 'tool-execution',
    })

    expect(LoadSelectedEvent.loadSelectedEventDependencies.openDatabase).toHaveBeenCalledWith('chat-storage-worker', 3)
    expect(LoadSelectedEvent.loadSelectedEventDependencies.getEventDetailsBySessionIdAndEventId).toHaveBeenCalledWith(
      database.store,
      'session-1',
      'sessionId',
      1,
      'tool-execution',
    )
    expect(result).toEqual(event)
    expect(database.close).toHaveBeenCalledTimes(1)
  } finally {
    LoadSelectedEvent.loadSelectedEventDependencies.openDatabase = originalOpenDatabase
    LoadSelectedEvent.loadSelectedEventDependencies.getEventDetailsBySessionIdAndEventId = originalGetEventDetailsBySessionIdAndEventId
  }
})

test('loadSelectedEvent returns null when the configured event store does not exist', async () => {
  const originalOpenDatabase = LoadSelectedEvent.loadSelectedEventDependencies.openDatabase
  const originalGetEventDetailsBySessionIdAndEventId =
    LoadSelectedEvent.loadSelectedEventDependencies.getEventDetailsBySessionIdAndEventId
  const database = createDatabase(false)
  LoadSelectedEvent.loadSelectedEventDependencies.openDatabase = jest.fn().mockResolvedValue(database)
  LoadSelectedEvent.loadSelectedEventDependencies.getEventDetailsBySessionIdAndEventId = jest.fn()

  try {
    const result = await LoadSelectedEvent.loadSelectedEvent({
      databaseName: 'chat-storage-worker',
      databaseVersion: 3,
      eventStoreName: 'events',
      eventId: 1,
      sessionId: 'session-1',
      sessionIdIndexName: 'sessionId',
      type: 'tool-execution',
    })

    expect(result).toBeNull()
    expect(LoadSelectedEvent.loadSelectedEventDependencies.getEventDetailsBySessionIdAndEventId).not.toHaveBeenCalled()
    expect(database.close).toHaveBeenCalledTimes(1)
  } finally {
    LoadSelectedEvent.loadSelectedEventDependencies.openDatabase = originalOpenDatabase
    LoadSelectedEvent.loadSelectedEventDependencies.getEventDetailsBySessionIdAndEventId = originalGetEventDetailsBySessionIdAndEventId
  }
})