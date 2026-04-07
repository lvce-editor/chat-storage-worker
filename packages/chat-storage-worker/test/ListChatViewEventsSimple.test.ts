import { expect, test } from '@jest/globals'
import type { ChatViewEventSimple } from '../src/parts/ChatViewEventSimple/ChatViewEventSimple.ts'
import * as ListChatViewEventsSimple from '../src/parts/ListChatViewEventsSimple/ListChatViewEventsSimple.ts'

const createDatabase = (containsEventStore: boolean) => {
  return {
    close: jest.fn(),
    objectStoreNames: {
      contains: jest.fn().mockReturnValue(containsEventStore),
    },
    transaction: jest.fn().mockReturnValue({
      objectStore: jest.fn().mockReturnValue({}),
    }),
  }
}

test('listChatViewEventsSimple reads from the configured database using an options object', async () => {
  const originalOpenDatabase = ListChatViewEventsSimple.listChatViewEventsDependencies.openDatabase
  const originalGetEventsBySessionId = ListChatViewEventsSimple.listChatViewEventsDependencies.getEventsBySessionId
  const database = createDatabase(true)
  const events: readonly ChatViewEventSimple[] = [
    {
      eventId: 1,
      sessionId: 'session-1',
      type: 'chat-message-user',
      text: 'hello',
      id: 'message-1',
      time: '2026-01-01T00:00:00.000Z',
    },
  ]
  ListChatViewEventsSimple.listChatViewEventsDependencies.openDatabase = jest.fn().mockResolvedValue(database)
  ListChatViewEventsSimple.listChatViewEventsDependencies.getEventsBySessionId = jest.fn().mockResolvedValue(events)

  try {
    const result = await ListChatViewEventsSimple.listChatViewEventsSimple({
      sessionId: 'session-1',
      databaseName: 'chat-storage-worker',
      databaseVersion: 3,
      eventStoreName: 'events',
      sessionIdIndexName: 'sessionId',
    })

    expect(ListChatViewEventsSimple.listChatViewEventsDependencies.openDatabase).toHaveBeenCalledWith('chat-storage-worker', 3)
    expect(ListChatViewEventsSimple.listChatViewEventsDependencies.getEventsBySessionId).toHaveBeenCalledWith({}, 'session-1', 'sessionId')
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
  ListChatViewEventsSimple.listChatViewEventsDependencies.openDatabase = jest.fn().mockResolvedValue(database)
  ListChatViewEventsSimple.listChatViewEventsDependencies.getEventsBySessionId = jest.fn()

  try {
    const result = await ListChatViewEventsSimple.listChatViewEventsSimple({
      sessionId: '',
      databaseName: 'chat-storage-worker',
      databaseVersion: 3,
      eventStoreName: 'events',
      sessionIdIndexName: 'sessionId',
    })

    expect(result).toEqual({
      events: [],
      type: 'success',
    })
    expect(ListChatViewEventsSimple.listChatViewEventsDependencies.getEventsBySessionId).not.toHaveBeenCalled()
    expect(database.close).toHaveBeenCalledTimes(1)
  } finally {
    ListChatViewEventsSimple.listChatViewEventsDependencies.openDatabase = originalOpenDatabase
    ListChatViewEventsSimple.listChatViewEventsDependencies.getEventsBySessionId = originalGetEventsBySessionId
  }
})