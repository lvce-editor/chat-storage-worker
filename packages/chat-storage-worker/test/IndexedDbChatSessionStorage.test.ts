import { expect, jest, test } from '@jest/globals'
import type { ChatMessage } from '../src/parts/ChatMessage/ChatMessage.ts'
import type { ChatSession } from '../src/parts/ChatSession/ChatSession.ts'
import { IndexedDbChatSessionStorage } from '../src/parts/IndexedDbChatSessionStorage/IndexedDbChatSessionStorage.ts'

const createMessage = (id: string, text: string): ChatMessage => {
  return {
    id,
    role: 'user',
    text,
    time: '2026-01-01T00:00:00.000Z',
  }
}

const createStorage = (suffix: string): IndexedDbChatSessionStorage => {
  return new IndexedDbChatSessionStorage({
    databaseName: `chat-storage-worker-test-${suffix}`,
    databaseVersion: 2,
  })
}

const createDonePromise = (): Promise<void> => {
  return new Promise((resolve) => {
    resolve()
  })
}

test('setSession/getSession persists session and messages', async () => {
  const storage = createStorage('persist')
  const session: ChatSession = {
    id: 'session-1',
    messages: [createMessage('m1', 'hello')],
    title: 'First Session',
  }
  await storage.setSession(session)
  const actual = await storage.getSession('session-1')
  expect(actual).toEqual(session)
})

test.skip('setSession emits update events for message edit and title change', async () => {
  const storage = createStorage('updates')
  await storage.setSession({
    id: 'session-1',
    messages: [createMessage('m1', 'hello')],
    title: 'Original',
  })
  await storage.setSession({
    id: 'session-1',
    messages: [
      {
        ...createMessage('m1', 'hello world'),
        inProgress: false,
      },
    ],
    title: 'Updated',
  })
  const events = await storage.getEvents('session-1')
  expect(events.map((event) => event.type)).toEqual([
    'chat-session-created',
    'chat-message-added',
    'chat-session-title-updated',
    'chat-message-updated',
  ])
})

test('deleteSession removes session from list and lookup', async () => {
  const storage = createStorage('delete')
  await storage.setSession({
    id: 'session-1',
    messages: [],
    title: 'To be deleted',
  })
  await storage.appendEvent({
    sessionId: 'session-1',
    timestamp: '2026-01-01T00:00:01.000Z',
    type: 'handle-input',
    value: 'temporary',
  })
  await storage.deleteSession('session-1')
  const session = await storage.getSession('session-1')
  const sessions = await storage.listSessions()
  const events = await storage.getEvents('session-1')
  expect(session).toBeUndefined()
  expect(sessions).toEqual([])
  expect(events).toEqual([])
})

test('deleteSession only removes data for the targeted session', async () => {
  const storage = createStorage('delete-targeted')
  await storage.setSession({
    id: 'session-1',
    messages: [createMessage('m1', 'first')],
    title: 'First',
  })
  await storage.setSession({
    id: 'session-2',
    messages: [createMessage('m2', 'second')],
    title: 'Second',
  })
  await storage.appendEvent({
    sessionId: 'session-1',
    timestamp: '2026-01-01T00:00:01.000Z',
    type: 'handle-input',
    value: 'temporary-1',
  })
  await storage.appendEvent({
    sessionId: 'session-2',
    timestamp: '2026-01-01T00:00:02.000Z',
    type: 'handle-input',
    value: 'temporary-2',
  })

  await storage.deleteSession('session-1')

  await expect(storage.getSession('session-1')).resolves.toBeUndefined()
  await expect(storage.getEvents('session-1')).resolves.toEqual([])
  await expect(storage.getSession('session-2')).resolves.toEqual({
    id: 'session-2',
    messages: [createMessage('m2', 'second')],
    title: 'Second',
  })
  await expect(storage.getEvents('session-2')).resolves.toEqual([
    {
      sessionId: 'session-2',
      timestamp: expect.any(String),
      title: 'Second',
      type: 'chat-session-created',
    },
    {
      message: createMessage('m2', 'second'),
      sessionId: 'session-2',
      timestamp: expect.any(String),
      type: 'chat-message-added',
    },
    {
      sessionId: 'session-2',
      timestamp: '2026-01-01T00:00:02.000Z',
      type: 'handle-input',
      value: 'temporary-2',
    },
  ])
})

test('deleteSession uses separate readonly and readwrite transactions', async () => {
  const storage = createStorage('delete-transactions')
  const getAllKeys = jest.fn(async () => [1, 2])
  const summaryDelete = jest.fn(async (_id: string): Promise<void> => {})
  const eventDelete = jest.fn(async (_key: unknown): Promise<void> => {})
  const transaction = jest
    .fn()
    .mockImplementationOnce(() => ({
      done: createDonePromise(),
      objectStore: (): any => ({
        index: () => ({
          getAllKeys,
        }),
      }),
    }))
    .mockImplementationOnce(() => ({
      done: createDonePromise(),
      objectStore: (name: string): any => {
        if (name === 'chat-sessions') {
          return {
            delete: summaryDelete,
          }
        }
        if (name === 'chat-view-events') {
          return {
            delete: eventDelete,
          }
        }
        throw new Error(`unexpected store ${name}`)
      },
    }))
  ;(storage as any).openDatabase = async (): Promise<any> => ({
    transaction,
  })

  await storage.deleteSession('session-1')

  expect(transaction).toHaveBeenNthCalledWith(1, 'chat-view-events', 'readonly')
  expect(transaction).toHaveBeenNthCalledWith(2, ['chat-sessions', 'chat-view-events'], 'readwrite')
  expect(getAllKeys).toHaveBeenCalledTimes(1)
  expect(summaryDelete).toHaveBeenCalledWith('session-1')
  expect(eventDelete).toHaveBeenNthCalledWith(1, 1)
  expect(eventDelete).toHaveBeenNthCalledWith(2, 2)
})

test('clear removes sessions and events', async () => {
  const storage = createStorage('clear')
  await storage.setSession({
    id: 'session-1',
    messages: [createMessage('m1', 'hello')],
    title: 'Session',
  })
  await storage.clear()
  const sessions = await storage.listSessions()
  const events = await storage.getEvents()
  expect(sessions).toEqual([])
  expect(events).toEqual([])
})
