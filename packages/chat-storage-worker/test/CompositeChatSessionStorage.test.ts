import { expect, jest, test } from '@jest/globals'
import type { ChatSession } from '../src/parts/ChatSession/ChatSession.ts'
import type { ChatSessionStorage } from '../src/parts/ChatSessionStorageTypes/ChatSessionStorageTypes.ts'
import type { DebugEventStorage } from '../src/parts/DebugEventStorageTypes/DebugEventStorageTypes.ts'
import { CompositeChatSessionStorage } from '../src/parts/CompositeChatSessionStorage/CompositeChatSessionStorage.ts'

const createSessionStorage = (): ChatSessionStorage => {
  return {
    appendEvent: jest.fn(async () => {}),
    clear: jest.fn(async () => {}),
    deleteSession: jest.fn(async (_id: string) => {}),
    getEvents: jest.fn(async (_sessionId?: string) => []),
    getSession: jest.fn(async (_id: string) => undefined),
    listSessions: jest.fn(async () => [] as readonly ChatSession[]),
    setSession: jest.fn(async (_session: ChatSession) => {}),
  }
}

const createDebugEventStorage = (): DebugEventStorage => {
  return {
    appendEvent: jest.fn(async () => {}),
    clear: jest.fn(async () => {}),
    getEvents: jest.fn(async (_sessionId?: string) => []),
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
