export const setTodosInIndexedDb = async (todos: string): Promise<void> => {
  const todoDbName = 'chat-tool-worker'
  const todoStoreName = 'state'
  const todoKey = 'todoList'

  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const openRequest = indexedDB.open(todoDbName, 1)
    openRequest.onupgradeneeded = (): void => {
      const nextDb = openRequest.result
      if (!nextDb.objectStoreNames.contains(todoStoreName)) {
        nextDb.createObjectStore(todoStoreName)
      }
    }
    openRequest.onsuccess = (): void => {
      resolve(openRequest.result)
    }
    openRequest.onerror = (): void => {
      reject(openRequest.error ?? new Error('Failed to open IndexedDB'))
    }
  })

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(todoStoreName, 'readwrite')
    transaction.objectStore(todoStoreName).put(todos, todoKey)
    transaction.oncomplete = (): void => {
      db.close()
      resolve()
    }
    transaction.onerror = (): void => {
      db.close()
      reject(transaction.error ?? new Error('Failed to persist todo list'))
    }
    transaction.onabort = (): void => {
      db.close()
      reject(transaction.error ?? new Error('Failed to persist todo list'))
    }
  })
}

export const setTodosInCacheStorage = async (todos: string): Promise<void> => {
  const todoCacheName = 'chat-tool-worker-todo'
  const todoCacheRequest = new Request('https://chat-tool-worker.local/todo-list')
  const cache = await caches.open(todoCacheName)
  const payload = JSON.stringify({ todos })
  await cache.put(
    todoCacheRequest,
    new Response(payload, {
      headers: {
        'content-type': 'application/json',
      },
    }),
  )
}
