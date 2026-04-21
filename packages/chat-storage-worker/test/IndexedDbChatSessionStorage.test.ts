import { expect, test } from '@jest/globals'
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

test('setSession emits update events for message edit and title change', async () => {
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
  await storage.deleteSession('session-1')
  const session = await storage.getSession('session-1')
  const sessions = await storage.listSessions()
  expect(session).toBeUndefined()
  expect(sessions).toEqual([])
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
  const events = await storage.getEvents('session-1')
  expect(sessions).toEqual([])
  expect(events).toEqual([])
})
