import type { ChatSession } from '../ChatSession/ChatSession.ts'
import type { ChatViewEvent } from '../ChatViewEvent/ChatViewEvent.ts'
import type { ListChatViewEventsResult } from '../ListChatViewEventsResult/ListChatViewEventsResult.ts'
import { listChatViewEventSummaries, loadSelectedChatViewEvent, type ChatViewEventInfo } from '../ChatViewEventLookup/ChatViewEventLookup.ts'
import { IndexedDbChatSessionStorage } from '../IndexedDbChatSessionStorage/IndexedDbChatSessionStorage.ts'
import { InMemoryChatSessionStorage } from '../InMemoryChatSessionStorage/InMemoryChatSessionStorage.ts'

export interface ChatSessionUpdateEvent {
  readonly revision: number
  readonly sessionId: string
  readonly type: 'session-deleted' | 'session-updated' | 'storage-cleared'
}

interface SessionListener {
  readonly queue: ChatSessionUpdateEvent[]
  readonly sessionId: string
  readonly waiters: Array<() => void>
}

export interface ChatSessionStorage {
  appendEvent(event: ChatViewEvent): Promise<void>
  clear(): Promise<void>
  deleteSession(id: string): Promise<void>
  getEvents(sessionId?: string): Promise<readonly ChatViewEvent[]>
  getSession(id: string): Promise<ChatSession | undefined>
  listSessions(): Promise<readonly ChatSession[]>
  setSession(session: ChatSession): Promise<void>
}

const createDefaultStorage = (): Readonly<ChatSessionStorage> => {
  if (typeof indexedDB === 'undefined') {
    return new InMemoryChatSessionStorage()
  }
  return new IndexedDbChatSessionStorage()
}

let chatSessionStorage: Readonly<ChatSessionStorage> = createDefaultStorage()
const sessionListeners = new Map<string, SessionListener>()
const sessionRevisions = new Map<string, number>()

const createSessionListener = (sessionId: string): SessionListener => {
  return {
    queue: [],
    sessionId,
    waiters: [],
  }
}

const getSessionListener = (subscriberId: string): SessionListener | undefined => {
  return sessionListeners.get(subscriberId)
}

const getNextRevision = (sessionId: string): number => {
  const nextRevision = (sessionRevisions.get(sessionId) || 0) + 1
  sessionRevisions.set(sessionId, nextRevision)
  return nextRevision
}

const notifySessionListeners = (sessionId: string, type: ChatSessionUpdateEvent['type']): void => {
  const revision = getNextRevision(sessionId)
  for (const listener of sessionListeners.values()) {
    if (listener.sessionId !== sessionId) {
      continue
    }
    listener.queue.push({
      revision,
      sessionId,
      type,
    })
    const waiters = [...listener.waiters]
    listener.waiters.length = 0
    for (const waiter of waiters) {
      waiter()
    }
  }
}

const notifyAllSessionListeners = (type: ChatSessionUpdateEvent['type']): void => {
  for (const listener of sessionListeners.values()) {
    const revision = getNextRevision(listener.sessionId)
    listener.queue.push({
      revision,
      sessionId: listener.sessionId,
      type,
    })
    const waiters = [...listener.waiters]
    listener.waiters.length = 0
    for (const waiter of waiters) {
      waiter()
    }
  }
}

export const setChatSessionStorage = (storage: Readonly<ChatSessionStorage>): void => {
  chatSessionStorage = storage
}

export const setSession = async (session: ChatSession): Promise<void> => {
  await chatSessionStorage.setSession(session)
  notifySessionListeners(session.id, 'session-updated')
}

export const resetChatSessionStorage = (): void => {
  chatSessionStorage = new InMemoryChatSessionStorage()
  sessionListeners.clear()
  sessionRevisions.clear()
}

export const listChatSessions = async (): Promise<readonly ChatSession[]> => {
  const sessions = await chatSessionStorage.listSessions()
  return sessions.map((session) => {
    const summary: ChatSession = {
      id: session.id,
      messages: [],
      title: session.title,
    }
    if (!session.projectId) {
      return summary
    }
    return {
      ...summary,
      projectId: session.projectId,
    }
  })
}

export const getChatSession = async (id: string): Promise<ChatSession | undefined> => {
  const session = await chatSessionStorage.getSession(id)
  if (!session) {
    return undefined
  }
  const resultBase: ChatSession = {
    id: session.id,
    messages: [...session.messages],
    title: session.title,
  }
  const result = session.projectId
    ? {
        ...resultBase,
        projectId: session.projectId,
      }
    : resultBase
  return result
}

export const saveChatSession = async (session: ChatSession): Promise<void> => {
  const value: ChatSession = {
    id: session.id,
    messages: [...session.messages],
    title: session.title,
  }
  await setSession(
    session.projectId
      ? {
          ...value,
          projectId: session.projectId,
        }
      : value,
  )
}

export const deleteChatSession = async (id: string): Promise<void> => {
  await chatSessionStorage.deleteSession(id)
  notifySessionListeners(id, 'session-deleted')
}

export const clearChatSessions = async (): Promise<void> => {
  await chatSessionStorage.clear()
  notifyAllSessionListeners('storage-cleared')
}

export const appendChatViewEvent = async (event: ChatViewEvent): Promise<void> => {
  await chatSessionStorage.appendEvent(event)
  notifySessionListeners(event.sessionId, 'session-updated')
}

export const getChatViewEvents = async (sessionId?: string): Promise<readonly ChatViewEvent[]> => {
  return chatSessionStorage.getEvents(sessionId)
}

export const subscribeSessionUpdates = (sessionId: string, subscriberId: string): void => {
  const existingListener = getSessionListener(subscriberId)
  if (existingListener) {
    const waiters = [...existingListener.waiters]
    existingListener.waiters.length = 0
    for (const waiter of waiters) {
      waiter()
    }
  }
  sessionListeners.set(subscriberId, createSessionListener(sessionId))
}

export const unsubscribeSessionUpdates = (subscriberId: string): void => {
  const listener = getSessionListener(subscriberId)
  if (!listener) {
    return
  }
  const waiters = [...listener.waiters]
  listener.waiters.length = 0
  sessionListeners.delete(subscriberId)
  for (const waiter of waiters) {
    waiter()
  }
}

export const consumeSessionUpdates = (subscriberId: string): readonly ChatSessionUpdateEvent[] => {
  const listener = getSessionListener(subscriberId)
  if (!listener) {
    return []
  }
  const events = [...listener.queue]
  listener.queue.length = 0
  return events
}

export const waitForSessionUpdates = async (subscriberId: string, timeout: number = 1000): Promise<readonly ChatSessionUpdateEvent[]> => {
  const listener = getSessionListener(subscriberId)
  if (!listener) {
    return []
  }
  if (listener.queue.length > 0) {
    return consumeSessionUpdates(subscriberId)
  }
  await new Promise<void>((resolve) => {
    function finish(): void {
      clearTimeout(timeoutId)
      resolve()
    }
    const timeoutId = setTimeout(finish, timeout)
    listener.waiters.push(finish)
  })
  return consumeSessionUpdates(subscriberId)
}

export const listChatViewEvents = async (sessionId: string): Promise<ListChatViewEventsResult> => {
  try {
    const events = await chatSessionStorage.getEvents(sessionId)
    return {
      events: listChatViewEventSummaries(events),
      type: 'success',
    }
  } catch (error) {
    return {
      error,
      type: 'error',
    }
  }
}

export const loadSelectedEventOld = async (sessionId: string, eventId: number, type: string): Promise<ChatViewEventInfo | null> => {
  const events = await chatSessionStorage.getEvents(sessionId)
  return loadSelectedChatViewEvent(events, eventId, type)
}
