import { beforeEach, expect, jest, test } from '@jest/globals'
import type { ChatSession } from '../src/parts/ChatSession/ChatSession.ts'

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
