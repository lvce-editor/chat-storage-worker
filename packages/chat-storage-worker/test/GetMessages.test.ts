import { afterEach, expect, jest, test } from '@jest/globals'
import type { ChatMessage } from '../src/parts/ChatMessage/ChatMessage.ts'
import { getMessages } from '../src/parts/GetMessages/GetMessages.ts'
import * as OpenDatabase from '../src/parts/OpenDatabase/OpenDatabase.ts'

const createMessage = (id: string, text: string): ChatMessage => {
  return {
    id,
    role: 'user',
    text,
    time: '2026-01-01T00:00:00.000Z',
  }
}

afterEach(() => {
  jest.restoreAllMocks()
})

test('getMessages uses sessionId index and returns only matching message events', async () => {
  const sessionId = 'session-2'
  const getAll = jest.fn(async (key?: string) => {
    return [
      {
        message: createMessage('m1', 'first'),
        sessionId,
        timestamp: '2026-01-01T00:00:01.000Z',
        type: 'chat-message-added',
      },
      {
        sessionId,
        timestamp: '2026-01-01T00:00:02.000Z',
        type: 'handle-input',
        value: 'ignored',
      },
      {
        message: createMessage('m2', 'second'),
        sessionId,
        timestamp: '2026-01-01T00:00:03.000Z',
        type: 'chat-message-added',
      },
    ]
  })
  const index = jest.fn(() => ({ getAll }))
  const storeGetAll = jest.fn(async () => [])
  const objectStore = jest.fn(() => ({
    getAll: storeGetAll,
    index,
  }))
  const transaction = jest.fn(() => ({
    objectStore,
  }))
  jest.spyOn(OpenDatabase, 'openDatabase').mockResolvedValue({
    transaction,
  } as any)

  const result = await getMessages(sessionId)

  expect(getAll).toHaveBeenCalledWith(sessionId)
  expect(index).toHaveBeenCalledWith('sessionId')
  expect(storeGetAll).not.toHaveBeenCalled()
  expect(result).toEqual([
    {
      message: createMessage('m1', 'first'),
      timestamp: '2026-01-01T00:00:01.000Z',
      type: 'chat-message-added',
    },
    {
      message: createMessage('m2', 'second'),
      timestamp: '2026-01-01T00:00:03.000Z',
      type: 'chat-message-added',
    },
  ])
})
