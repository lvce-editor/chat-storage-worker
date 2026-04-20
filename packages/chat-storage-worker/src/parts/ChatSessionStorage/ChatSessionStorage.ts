import * as RpcRegistry from '@lvce-editor/rpc-registry'
import type { ChatSession } from '../ChatSession/ChatSession.ts'
import type {
  ChatSessionStorage,
  ChatSessionUpdateEvent,
  SessionListener,
  SessionListenerIdentifier,
} from '../ChatSessionStorageTypes/ChatSessionStorageTypes.ts'
import type { ChatViewEvent } from '../ChatViewEvent/ChatViewEvent.ts'
import type { ListChatViewEventsResult } from '../ListChatViewEventsResult/ListChatViewEventsResult.ts'
import { listChatViewEventSummaries, loadSelectedChatViewEvent, type ChatViewEventInfo } from '../ChatViewEventLookup/ChatViewEventLookup.ts'
import { IndexedDbChatSessionStorage } from '../IndexedDbChatSessionStorage/IndexedDbChatSessionStorage.ts'
import { InMemoryChatSessionStorage } from '../InMemoryChatSessionStorage/InMemoryChatSessionStorage.ts'

const createDefaultStorage = (): Readonly<ChatSessionStorage> => {
  if (typeof indexedDB === 'undefined') {
    return new InMemoryChatSessionStorage()
  }
  return new IndexedDbChatSessionStorage()
}

let chatSessionStorage: Readonly<ChatSessionStorage> = createDefaultStorage()
const sessionListeners = new Map<string, SessionListener>()

const getSessionListenerKey = ({ rpcId, uid }: SessionListenerIdentifier): string => {
  return `${rpcId}:${uid}`
}

const assertRpcAvailable = (rpcId: number): void => {
  const rpc = RpcRegistry.get(rpcId)
  if (!rpc) {
    throw new Error(`No rpc with id ${rpcId} was found`)
  }
}

const notifySessionListener = (listener: SessionListener): void => {
  const rpc = RpcRegistry.get(listener.rpcId)
  if (!rpc) {
    return
  }
  rpc.send('handleChatStorageUpdate', listener.uid, listener.sessionId)
}

const notifySessionListeners = (sessionId: string): void => {
  const value = sessionListeners.values()
  const matching = [...value].filter((listener) => listener.sessionId === sessionId)
  for (const listener of matching) {
    notifySessionListener(listener)
  }
}

const notifyAllSessionListeners = (): void => {
  for (const listener of sessionListeners.values()) {
    notifySessionListener(listener)
  }
}

export const setChatSessionStorage = (storage: Readonly<ChatSessionStorage>): void => {
  chatSessionStorage = storage
}

export const setSession = async (session: ChatSession): Promise<void> => {
  await chatSessionStorage.setSession(session)
  notifySessionListeners(session.id)
}

export const resetChatSessionStorage = (): void => {
  chatSessionStorage = new InMemoryChatSessionStorage()
  sessionListeners.clear()
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
  notifySessionListeners(id)
}

export const clearChatSessions = async (): Promise<void> => {
  await chatSessionStorage.clear()
  notifyAllSessionListeners()
}

export const appendChatViewEvent = async (event: ChatViewEvent): Promise<void> => {
  await chatSessionStorage.appendEvent(event)
  notifySessionListeners(event.sessionId)
}

export const getChatViewEvents = async (sessionId?: string): Promise<readonly ChatViewEvent[]> => {
  return chatSessionStorage.getEvents(sessionId)
}

export const subscribeSessionUpdates = (listener: SessionListener): void => {
  assertRpcAvailable(listener.rpcId)
  sessionListeners.set(getSessionListenerKey(listener), listener)
}

export const unsubscribeSessionUpdates = (listener: SessionListenerIdentifier): void => {
  sessionListeners.delete(getSessionListenerKey(listener))
}

export const consumeSessionUpdates = (): readonly ChatSessionUpdateEvent[] => {
  return []
}

export const waitForSessionUpdates = async (): Promise<readonly ChatSessionUpdateEvent[]> => {
  return []
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
