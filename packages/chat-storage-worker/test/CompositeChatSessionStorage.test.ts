import { expect, jest, test } from '@jest/globals'
import type { ChatSession } from '../src/parts/ChatSession/ChatSession.ts'
import type { ChatSessionStorage } from '../src/parts/ChatSessionStorageTypes/ChatSessionStorageTypes.ts'
import type { DebugEvent } from '../src/parts/DebugEventStorageTypes/DebugEventStorageTypes.ts'
import type { DebugEventStorage } from '../src/parts/DebugEventStorageTypes/DebugEventStorageTypes.ts'
import { CompositeChatSessionStorage } from '../src/parts/CompositeChatSessionStorage/CompositeChatSessionStorage.ts'

const createSessionStorage = (): jest.Mocked<ChatSessionStorage> => {
  return {
    appendEvent: jest.fn(async () => {}),
    clear: jest.fn(async () => {}),
    deleteSession: jest.fn(async (_id: string) => {}),
    getEvents: jest.fn(async (_sessionId: string) => []),
    getSession: jest.fn(async (_id: string) => undefined),
    listSessions: jest.fn(async () => [] as readonly ChatSession[]),
    setSession: jest.fn(async (_session: ChatSession) => {}),
  }
}

const createDebugEventStorage = (): jest.Mocked<DebugEventStorage> => {
  return {
    appendEvent: jest.fn(async () => {}),
    clear: jest.fn(async () => {}),
    getEvents: jest.fn(async (_sessionId: string) => []),
  }
}

test('appendEvent stores required chat events in session storage', async () => {
  const sessionStorage = createSessionStorage()
  const debugEventStorage = createDebugEventStorage()
  const storage = new CompositeChatSessionStorage(sessionStorage, debugEventStorage)

  await storage.appendEvent({
    message: {
      id: 'message-1',
      role: 'user',
      text: 'hello',
      time: '2026-04-20T00:00:00.000Z',
    },
    sessionId: 'session-1',
    timestamp: '2026-04-20T00:00:00.000Z',
    type: 'chat-message-added',
  })

  expect(sessionStorage.appendEvent).toHaveBeenCalledTimes(1)
  expect(sessionStorage.appendEvent).toHaveBeenCalledWith({
    message: {
      id: 'message-1',
      role: 'user',
      text: 'hello',
      time: '2026-04-20T00:00:00.000Z',
    },
    sessionId: 'session-1',
    timestamp: '2026-04-20T00:00:00.000Z',
    type: 'chat-message-added',
  })
  expect(debugEventStorage.appendEvent).not.toHaveBeenCalled()
})

test('appendEvent stores debug chat events in debug storage', async () => {
  const sessionStorage = createSessionStorage()
  const debugEventStorage = createDebugEventStorage()
  const storage = new CompositeChatSessionStorage(sessionStorage, debugEventStorage)

  await storage.appendEvent({
    sessionId: 'session-1',
    timestamp: '2026-04-20T00:00:00.000Z',
    type: 'handle-input',
    value: 'hello',
  })

  expect(debugEventStorage.appendEvent).toHaveBeenCalledTimes(1)
  expect(debugEventStorage.appendEvent).toHaveBeenCalledWith({
    sessionId: 'session-1',
    timestamp: '2026-04-20T00:00:00.000Z',
    type: 'handle-input',
    value: 'hello',
  })
  expect(sessionStorage.appendEvent).not.toHaveBeenCalled()
})

test('appendDebugEvent writes directly to debug storage', async () => {
  const sessionStorage = createSessionStorage()
  const debugEventStorage = createDebugEventStorage()
  const storage = new CompositeChatSessionStorage(sessionStorage, debugEventStorage)
  const event: DebugEvent = {
    body: { foo: 'bar' },
    sessionId: 'session-1',
    timestamp: '2026-04-20T00:00:00.000Z',
    type: 'ai-request',
  }

  await storage.appendDebugEvent(event)

  expect(debugEventStorage.appendEvent).toHaveBeenCalledTimes(1)
  expect(debugEventStorage.appendEvent).toHaveBeenCalledWith(event)
  expect(sessionStorage.appendEvent).not.toHaveBeenCalled()
})

test('getEvents reads chat view events only from session storage', async () => {
  const sessionStorage = createSessionStorage()
  const debugEventStorage = createDebugEventStorage()
  const storage = new CompositeChatSessionStorage(sessionStorage, debugEventStorage)
  const events = [
    {
      message: {
        id: 'message-1',
        role: 'assistant' as const,
        text: 'hello',
        time: '2026-04-20T00:00:00.000Z',
      },
      sessionId: 'session-1',
      timestamp: '2026-04-20T00:00:00.000Z',
      type: 'chat-message-added' as const,
    },
  ]
  sessionStorage.getEvents.mockResolvedValue(events)

  const actual = await storage.getEvents('session-1')

  expect(actual).toEqual(events)
  expect(sessionStorage.getEvents).toHaveBeenCalledTimes(1)
  expect(sessionStorage.getEvents).toHaveBeenCalledWith('session-1')
  expect(debugEventStorage.getEvents).not.toHaveBeenCalled()
})

test('getDebugEvents reads debug events only from debug storage', async () => {
  const sessionStorage = createSessionStorage()
  const debugEventStorage = createDebugEventStorage()
  const storage = new CompositeChatSessionStorage(sessionStorage, debugEventStorage)
  const events: readonly DebugEvent[] = [
    {
      sessionId: 'session-1',
      timestamp: '2026-04-20T00:00:00.000Z',
      type: 'handle-input',
      value: 'hello',
    },
  ]
  debugEventStorage.getEvents.mockResolvedValue(events)

  const actual = await storage.getDebugEvents('session-1')

  expect(actual).toEqual(events)
  expect(debugEventStorage.getEvents).toHaveBeenCalledTimes(1)
  expect(debugEventStorage.getEvents).toHaveBeenCalledWith('session-1')
  expect(sessionStorage.getEvents).not.toHaveBeenCalled()
})

test('getDebugEvents falls back to legacy debug events from session storage', async () => {
  const sessionStorage = createSessionStorage()
  const debugEventStorage = createDebugEventStorage()
  const storage = new CompositeChatSessionStorage(sessionStorage, debugEventStorage)
  sessionStorage.getEvents.mockResolvedValue([
    {
      message: {
        id: 'message-1',
        role: 'assistant',
        text: 'stored',
        time: '2026-04-20T00:00:00.000Z',
      },
      sessionId: 'session-1',
      timestamp: '2026-04-20T00:00:00.000Z',
      type: 'chat-message-added',
    },
    {
      sessionId: 'session-1',
      timestamp: '2026-04-20T00:00:01.000Z',
      type: 'handle-input',
      value: 'hello',
    },
  ])

  const actual = await storage.getDebugEvents('session-1')

  expect(actual).toEqual([
    {
      sessionId: 'session-1',
      timestamp: '2026-04-20T00:00:01.000Z',
      type: 'handle-input',
      value: 'hello',
    },
  ])
  expect(debugEventStorage.getEvents).toHaveBeenCalledWith('session-1')
  expect(sessionStorage.getEvents).toHaveBeenCalledWith('session-1')
})
