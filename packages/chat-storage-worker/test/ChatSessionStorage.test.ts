import { beforeEach, expect, jest, test } from '@jest/globals'
import { RpcId } from '@lvce-editor/constants'
import * as RpcRegistry from '@lvce-editor/rpc-registry'
import type { ChatSession } from '../src/parts/ChatSession/ChatSession.ts'
import type { ChatViewEvent } from '../src/parts/ChatViewEvent/ChatViewEvent.ts'
import {
  appendChatViewEvent,
  clearChatSessions,
  deleteChatSession,
  getMessageReplayEvents,
  saveChatSession,
  subscribeSessionUpdates,
  unsubscribeSessionUpdates,
} from '../src/parts/ChatSessionStorage/ChatSessionStorage.ts'

const createSession = (id: string, title: string): ChatSession => {
  return {
    id,
    messages: [],
    title,
  }
}

beforeEach(async () => {
  const chatSessionStorage = await import('../src/parts/ChatSessionStorage/ChatSessionStorage.ts')
  chatSessionStorage.resetChatSessionStorage()
})

const createMockRpc = (): any => {
  const invocations: Array<readonly [string, number, string]> = []
  return {
    dispose: jest.fn(async () => {}),
    invocations,
    invoke: jest.fn(async (method: string, uid: number, sessionId: string) => {
      invocations.push([method, uid, sessionId])
    }),
    invokeAndTransfer: jest.fn(async () => {}),
    send: jest.fn(),
  }
}

test('subscribeSessionUpdates should send notifications for the subscribed session only', async () => {
  const mockRpc = createMockRpc()
  RpcRegistry.set(RpcId.RendererWorker, mockRpc)
  subscribeSessionUpdates({
    rpcId: RpcId.RendererWorker,
    sessionId: 'session-1',
    type: 'session',
    uid: 1,
  })

  await appendChatViewEvent({
    sessionId: 'session-2',
    timestamp: '2026-04-19T00:00:00.000Z',
    type: 'handle-input',
    value: 'other session',
  })

  expect(mockRpc.invocations).toEqual([])

  await appendChatViewEvent({
    sessionId: 'session-1',
    timestamp: '2026-04-19T00:00:01.000Z',
    type: 'handle-input',
    value: 'watched session',
  })

  expect(mockRpc.invocations).toEqual([['handleChatStorageUpdate', 1, 'session-1']])
})

test('subscribeSessionUpdates should replace an existing listener with the same rpcId and uid', async () => {
  const mockRpc = createMockRpc()
  RpcRegistry.set(RpcId.RendererWorker, mockRpc)

  subscribeSessionUpdates({
    rpcId: RpcId.RendererWorker,
    sessionId: 'session-1',
    type: 'session',
    uid: 2,
  })
  subscribeSessionUpdates({
    rpcId: RpcId.RendererWorker,
    sessionId: 'session-2',
    type: 'session',
    uid: 2,
  })

  await appendChatViewEvent({
    sessionId: 'session-1',
    timestamp: '2026-04-19T00:00:02.000Z',
    type: 'handle-input',
    value: 'ignored update',
  })

  await appendChatViewEvent({
    sessionId: 'session-2',
    timestamp: '2026-04-19T00:00:03.000Z',
    type: 'handle-input',
    value: 'trigger update',
  })

  expect(mockRpc.invocations).toEqual([['handleChatStorageUpdate', 2, 'session-2']])
})

test('getMessageReplayEvents filters out non-replay events', async () => {
  await appendChatViewEvent({
    sessionId: 'session-1',
    timestamp: '2026-04-19T00:00:00.000Z',
    type: 'handle-input',
    value: 'draft',
  })
  await appendChatViewEvent({
    sessionId: 'session-1',
    timestamp: '2026-04-19T00:00:01.000Z',
    type: 'handle-submit',
    value: 'final prompt',
  })
  await appendChatViewEvent({
    sessionId: 'session-1',
    timestamp: '2026-04-19T00:00:02.000Z',
    type: 'sse-response-completed',
    value: {
      output_text: 'done',
    },
  })
  await appendChatViewEvent({
    sessionId: 'session-1',
    timestamp: '2026-04-19T00:00:03.000Z',
    type: 'sse-response-part',
    value: {
      type: 'response.in_progress',
    },
  })

  await expect(getMessageReplayEvents('session-1')).resolves.toEqual([
    {
      sessionId: 'session-1',
      timestamp: '2026-04-19T00:00:01.000Z',
      type: 'handle-submit',
      value: 'final prompt',
    },
    {
      sessionId: 'session-1',
      timestamp: '2026-04-19T00:00:02.000Z',
      type: 'sse-response-completed',
      value: {
        output_text: 'done',
      },
    },
  ])
})

test('subscribeSessionUpdates should throw when rpc is not registered', () => {
  expect(() => {
    subscribeSessionUpdates({
      rpcId: 999_999,
      sessionId: 'session-1',
      type: 'session',
      uid: 5,
    })
  }).toThrow(new Error('No rpc with id 999999 was found'))
})

test('deleteChatSession should notify subscribed listeners', async () => {
  const mockRpc = createMockRpc()
  RpcRegistry.set(RpcId.RendererWorker, mockRpc)
  subscribeSessionUpdates({
    rpcId: RpcId.RendererWorker,
    sessionId: 'session-1',
    type: 'session',
    uid: 3,
  })

  await saveChatSession(createSession('session-1', 'Session 1'))

  await deleteChatSession('session-1')
  expect(mockRpc.invocations).toEqual([
    ['handleChatStorageUpdate', 3, 'session-1'],
    ['handleChatStorageUpdate', 3, 'session-1'],
  ])
})

test('unsubscribeSessionUpdates should stop notifications for the listener', async () => {
  const mockRpc = createMockRpc()
  RpcRegistry.set(RpcId.RendererWorker, mockRpc)
  subscribeSessionUpdates({
    rpcId: RpcId.RendererWorker,
    sessionId: 'session-1',
    type: 'session',
    uid: 4,
  })

  unsubscribeSessionUpdates({
    rpcId: RpcId.RendererWorker,
    uid: 4,
  })

  await appendChatViewEvent({
    sessionId: 'session-1',
    timestamp: '2026-04-19T00:00:04.000Z',
    type: 'handle-input',
    value: 'ignored update',
  })

  expect(mockRpc.invocations).toEqual([])
})

test('listChatSessions returns summaries without messages and keeps projectId', async () => {
  jest.resetModules()
  const chatSessionStorage = await import('../src/parts/ChatSessionStorage/ChatSessionStorage.ts')
  const storedSessions: readonly ChatSession[] = [
    {
      id: 'session-summary-1',
      messages: [{ id: 'm1', role: 'assistant', text: 'stored', time: '2026-01-01T00:00:00.000Z' }],
      projectId: 'project-1',
      title: 'Summary Session',
    },
  ]

  chatSessionStorage.setChatSessionStorage({
    appendEvent: jest.fn(async () => {}),
    clear: jest.fn(async () => {}),
    deleteSession: jest.fn(async () => {}),
    getEvents: jest.fn(async () => []),
    getSession: jest.fn(async () => undefined),
    listSessions: jest.fn(async () => storedSessions),
    setSession: jest.fn(async () => {}),
  })

  const result = await chatSessionStorage.listChatSessions()

  expect(result).toEqual([
    {
      id: 'session-summary-1',
      messages: [],
      projectId: 'project-1',
      title: 'Summary Session',
    },
  ])
})

test('getChatSession returns a cloned session value', async () => {
  jest.resetModules()
  const chatSessionStorage = await import('../src/parts/ChatSessionStorage/ChatSessionStorage.ts')

  await chatSessionStorage.saveChatSession({
    id: 'session-clone-1',
    messages: [{ id: 'm1', role: 'assistant', text: 'stored', time: '2026-01-01T00:00:00.000Z' }],
    title: 'Clone Session',
  })

  const result = await chatSessionStorage.getChatSession('session-clone-1')

  expect(result).toEqual({
    id: 'session-clone-1',
    messages: [{ id: 'm1', role: 'assistant', text: 'stored', time: '2026-01-01T00:00:00.000Z' }],
    title: 'Clone Session',
  })

  if (!result) {
    throw new Error('expected session to exist')
  }

  const reread = await chatSessionStorage.getChatSession('session-clone-1')

  expect(reread?.messages).not.toBe(result.messages)

  expect(reread).toEqual({
    id: 'session-clone-1',
    messages: [{ id: 'm1', role: 'assistant', text: 'stored', time: '2026-01-01T00:00:00.000Z' }],
    title: 'Clone Session',
  })
})

test('clearChatSessions notifies all subscribed listeners', async () => {
  const mockRpc = createMockRpc()
  RpcRegistry.set(RpcId.RendererWorker, mockRpc)

  subscribeSessionUpdates({
    rpcId: RpcId.RendererWorker,
    sessionId: 'session-1',
    type: 'session',
    uid: 10,
  })
  subscribeSessionUpdates({
    rpcId: RpcId.RendererWorker,
    sessionId: 'session-2',
    type: 'session',
    uid: 11,
  })

  await clearChatSessions()

  expect(mockRpc.invocations).toEqual([
    ['handleChatStorageUpdate', 10, 'session-1'],
    ['handleChatStorageUpdate', 11, 'session-2'],
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
      requestId: 'request-1',
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
        timestamp: 25,
        type: 'handle-input',
      },
      {
        duration: 50,
        endTime: 150,
        eventId: 2,
        requestId: 'request-1',
        startTime: 100,
        timestamp: 150,
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
