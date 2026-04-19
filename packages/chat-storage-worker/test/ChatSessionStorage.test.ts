import { beforeEach, expect, jest, test } from '@jest/globals'
import type { ChatSession } from '../src/parts/ChatSession/ChatSession.ts'
import type { ChatViewEvent } from '../src/parts/ChatViewEvent/ChatViewEvent.ts'
import {
  appendChatViewEvent,
  consumeSessionUpdates,
  deleteChatSession,
  saveChatSession,
  subscribeSessionUpdates,
  waitForSessionUpdates,
} from '../src/parts/ChatSessionStorage/ChatSessionStorage.ts'

const createSession = (id: string, title: string): ChatSession => {
  return {
    id,
    messages: [],
    title,
  }
}

const createRawEvent = (event: Readonly<Record<string, unknown>>): ChatViewEvent => {
  return event as unknown as ChatViewEvent
}

beforeEach(async () => {
  const chatSessionStorage = await import('../src/parts/ChatSessionStorage/ChatSessionStorage.ts')
  chatSessionStorage.resetChatSessionStorage()
})

test('subscribeSessionUpdates should buffer notifications for one session only', async () => {
  subscribeSessionUpdates('session-1', 'listener-1')

  await appendChatViewEvent({
    sessionId: 'session-2',
    timestamp: '2026-04-19T00:00:00.000Z',
    type: 'handle-input',
    value: 'other session',
  })

  expect(consumeSessionUpdates('listener-1')).toEqual([])

  await appendChatViewEvent({
    sessionId: 'session-1',
    timestamp: '2026-04-19T00:00:01.000Z',
    type: 'handle-input',
    value: 'watched session',
  })

  expect(consumeSessionUpdates('listener-1')).toEqual([
    {
      revision: 1,
      sessionId: 'session-1',
      type: 'session-updated',
    },
  ])
})

test('waitForSessionUpdates should resolve when subscribed session changes', async () => {
  subscribeSessionUpdates('session-1', 'listener-2')

  const waitPromise = waitForSessionUpdates('listener-2', 500)

  await appendChatViewEvent({
    sessionId: 'session-1',
    timestamp: '2026-04-19T00:00:02.000Z',
    type: 'handle-input',
    value: 'trigger update',
  })

  await expect(waitPromise).resolves.toEqual([
    {
      revision: 1,
      sessionId: 'session-1',
      type: 'session-updated',
    },
  ])
})

test('deleteChatSession should notify subscribed listeners', async () => {
  subscribeSessionUpdates('session-1', 'listener-3')

  await saveChatSession(createSession('session-1', 'Session 1'))
  expect(consumeSessionUpdates('listener-3')).toEqual([
    {
      revision: 1,
      sessionId: 'session-1',
      type: 'session-updated',
    },
  ])

  await deleteChatSession('session-1')
  expect(consumeSessionUpdates('listener-3')).toEqual([
    {
      revision: 2,
      sessionId: 'session-1',
      type: 'session-deleted',
    },
  ])
})

test('falls back to in-memory storage if indexedDB is unavailable', async () => {
  const originalIndexedDb = globalThis.indexedDB
  try {
    Reflect.deleteProperty(globalThis, 'indexedDB')
    jest.resetModules()
    const chatSessionStorage = await import('../src/parts/ChatSessionStorage/ChatSessionStorage.ts')
    await chatSessionStorage.saveChatSession(createSession('fallback-1', 'Fallback'))
    const sessions = await chatSessionStorage.listChatSessions()
    expect(sessions).toEqual([{ id: 'fallback-1', messages: [], title: 'Fallback' }])
  } finally {
    if (originalIndexedDb) {
      globalThis.indexedDB = originalIndexedDb
    }
  }
})

test('uses configured storage implementation and returns session summary from list', async () => {
  jest.resetModules()
  const chatSessionStorage = await import('../src/parts/ChatSessionStorage/ChatSessionStorage.ts')
  const { IndexedDbChatSessionStorage } = await import('../src/parts/IndexedDbChatSessionStorage/IndexedDbChatSessionStorage.ts')
  chatSessionStorage.setChatSessionStorage(
    new IndexedDbChatSessionStorage({
      databaseName: 'chat-storage-worker-test-global-storage',
      databaseVersion: 2,
    }),
  )
  await chatSessionStorage.saveChatSession({
    id: 'indexeddb-1',
    messages: [{ id: 'm1', role: 'assistant', text: 'stored', time: '2026-01-01T00:00:00.000Z' }],
    title: 'IndexedDB Session',
  })
  const sessions = await chatSessionStorage.listChatSessions()
  expect(sessions).toEqual([{ id: 'indexeddb-1', messages: [], title: 'IndexedDB Session' }])
})

test('listChatViewEvents returns lightweight events with stable raw event ids', async () => {
  jest.resetModules()
  const chatSessionStorage = await import('../src/parts/ChatSessionStorage/ChatSessionStorage.ts')
  const { IndexedDbChatSessionStorage } = await import('../src/parts/IndexedDbChatSessionStorage/IndexedDbChatSessionStorage.ts')
  chatSessionStorage.setChatSessionStorage(
    new IndexedDbChatSessionStorage({
      databaseName: 'chat-storage-worker-test-list-chat-view-events',
      databaseVersion: 2,
    }),
  )

  await chatSessionStorage.appendChatViewEvent(
    createRawEvent({
      sessionId: 'session-1',
      timestamp: 25,
      type: 'handle-input',
      value: 'hello',
    }),
  )
  await chatSessionStorage.appendChatViewEvent(
    createRawEvent({
      sessionId: 'session-1',
      started: 100,
      timestamp: 100,
      toolName: 'search',
      type: 'tool-execution-started',
    }),
  )
  await chatSessionStorage.appendChatViewEvent(
    createRawEvent({
      ended: 150,
      sessionId: 'session-1',
      timestamp: 150,
      toolName: 'search',
      type: 'tool-execution-finished',
    }),
  )
  await chatSessionStorage.appendChatViewEvent(
    createRawEvent({
      sessionId: 'session-2',
      timestamp: 200,
      type: 'handle-input',
      value: 'other',
    }),
  )

  const result = await chatSessionStorage.listChatViewEvents('session-1')
  expect(result).toEqual({
    events: [
      {
        duration: 0,
        endTime: 25,
        eventId: 1,
        startTime: 25,
        type: 'handle-input',
      },
      {
        duration: 50,
        endTime: 150,
        eventId: 2,
        startTime: 100,
        type: 'tool-execution',
      },
    ],
    type: 'success',
  })
})

test('loadSelectedEvent merges matching tool execution pair', async () => {
  jest.resetModules()
  const chatSessionStorage = await import('../src/parts/ChatSessionStorage/ChatSessionStorage.ts')
  const { IndexedDbChatSessionStorage } = await import('../src/parts/IndexedDbChatSessionStorage/IndexedDbChatSessionStorage.ts')
  chatSessionStorage.setChatSessionStorage(
    new IndexedDbChatSessionStorage({
      databaseName: 'chat-storage-worker-test-load-selected-event',
      databaseVersion: 2,
    }),
  )

  await chatSessionStorage.appendChatViewEvent(
    createRawEvent({
      sessionId: 'session-1',
      started: 100,
      timestamp: 100,
      toolName: 'search',
      type: 'tool-execution-started',
      value: 'start',
    }),
  )
  await chatSessionStorage.appendChatViewEvent(
    createRawEvent({
      ended: 150,
      result: 'done',
      sessionId: 'session-1',
      timestamp: 150,
      toolName: 'search',
      type: 'tool-execution-finished',
    }),
  )

  const result = await chatSessionStorage.loadSelectedEventOld('session-1', 1, 'tool-execution')
  expect(result).toEqual({
    ended: 150,
    eventId: 1,
    result: 'done',
    sessionId: 'session-1',
    started: 100,
    timestamp: 150,
    toolName: 'search',
    type: 'tool-execution',
    value: 'start',
  })
})
