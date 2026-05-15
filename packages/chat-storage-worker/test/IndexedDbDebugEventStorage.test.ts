import { expect, jest, test } from '@jest/globals'
import { IndexedDbDebugEventStorage } from '../src/parts/IndexedDbDebugEventStorage/IndexedDbDebugEventStorage.ts'

const createStorage = (suffix: string): IndexedDbDebugEventStorage => {
  return new IndexedDbDebugEventStorage({
    databaseName: `chat-debug-storage-worker-test-${suffix}`,
    databaseVersion: 1,
  })
}

const createDonePromise = (): Promise<void> => {
  return new Promise((resolve) => {
    resolve()
  })
}

test('deleteSession only removes debug events for the targeted session', async () => {
  const storage = createStorage('delete-targeted')
  await storage.clear()
  await storage.appendEvent({
    requestId: 'request-1',
    sessionId: 'session-1',
    timestamp: 1,
    type: 'handle-input',
    value: 'first',
  })
  await storage.appendEvent({
    requestId: 'request-2',
    sessionId: 'session-1',
    timestamp: 2,
    type: 'handle-input',
    value: 'second',
  })
  await storage.appendEvent({
    requestId: 'request-3',
    sessionId: 'session-2',
    timestamp: 3,
    type: 'handle-input',
    value: 'third',
  })

  await storage.deleteSession('session-1')

  await expect(storage.getEvents('session-1')).resolves.toEqual([])
  await expect(storage.getEvents('session-2')).resolves.toEqual([
    {
      requestId: 'request-3',
      sessionId: 'session-2',
      timestamp: 3,
      type: 'handle-input',
      value: 'third',
    },
  ])
})

test('deleteSession uses separate readonly and readwrite transactions', async () => {
  const storage = createStorage('delete-transactions')
  const getAllKeys = jest.fn(async () => [1, 2])
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
      objectStore: (): any => ({
        delete: eventDelete,
      }),
    }))
  ;(storage as any).openDatabase = async (): Promise<any> => ({
    transaction,
  })

  await storage.deleteSession('session-1')

  expect(transaction).toHaveBeenNthCalledWith(1, 'chat-debug-events', 'readonly')
  expect(transaction).toHaveBeenNthCalledWith(2, 'chat-debug-events', 'readwrite')
  expect(getAllKeys).toHaveBeenCalledTimes(1)
  expect(eventDelete).toHaveBeenNthCalledWith(1, 1)
  expect(eventDelete).toHaveBeenNthCalledWith(2, 2)
})
