import type { ChatSession } from '../ChatSession/ChatSession.ts'
import type { ChatViewEvent } from '../ChatViewEvent/ChatViewEvent.ts'
import type { ListChatViewEventsResult } from '../ListChatViewEventsResult/ListChatViewEventsResult.ts'
import { listChatViewEventSummaries, loadSelectedChatViewEvent, type ChatViewEventInfo } from '../ChatViewEventLookup/ChatViewEventLookup.ts'
import { IndexedDbChatSessionStorage } from '../IndexedDbChatSessionStorage/IndexedDbChatSessionStorage.ts'
import { InMemoryChatSessionStorage } from '../InMemoryChatSessionStorage/InMemoryChatSessionStorage.ts'

export interface ChatSessionStorage {
  appendEvent(event: ChatViewEvent): Promise<void>
  clear(): Promise<void>
  deleteSession(id: string): Promise<void>
  getEvents(sessionId?: string): Promise<readonly ChatViewEvent[]>
  getSession(id: string): Promise<ChatSession | undefined>
  listSessions(): Promise<readonly ChatSession[]>
  setSession(session: ChatSession): Promise<void>
}

interface UpdateListener {
  readonly rpcId: string
  readonly sessionId: string
  readonly uid: number
}

interface UpdateRpc {
  readonly invoke: (method: string, ...params: readonly unknown[]) => Promise<unknown>
}

const createDefaultStorage = (): Readonly<ChatSessionStorage> => {
  if (typeof indexedDB === 'undefined') {
    return new InMemoryChatSessionStorage()
  }
  return new IndexedDbChatSessionStorage()
}

let chatSessionStorage: Readonly<ChatSessionStorage> = createDefaultStorage()
const updateListeners = new Map<string, UpdateListener>()
let updateRpc: UpdateRpc | undefined

export const setChatSessionStorage = (storage: Readonly<ChatSessionStorage>): void => {
  chatSessionStorage = storage
}

export const setSession = async (session: ChatSession): Promise<void> => {
  await chatSessionStorage.setSession(session)
}

export const resetChatSessionStorage = (): void => {
  chatSessionStorage = new InMemoryChatSessionStorage()
  updateListeners.clear()
  updateRpc = undefined
}

export const setUpdateRpc = (rpc: UpdateRpc): void => {
  updateRpc = rpc
}

export const registerUpdateListener = async (sessionId: string, rpcId: string, uid: number): Promise<void> => {
  updateListeners.set(`${rpcId}:${uid}`, {
    rpcId,
    sessionId,
    uid,
  })
}

const notifyUpdateListeners = async (sessionId: string): Promise<void> => {
  if (!updateRpc) {
    return
  }
  for (const listener of updateListeners.values()) {
    if (listener.sessionId !== sessionId) {
      continue
    }
    await updateRpc.invoke(listener.rpcId, listener.uid)
  }
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
  await chatSessionStorage.setSession(
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
}

export const clearChatSessions = async (): Promise<void> => {
  await chatSessionStorage.clear()
}

export const appendChatViewEvent = async (event: ChatViewEvent): Promise<void> => {
  await chatSessionStorage.appendEvent(event)
  await notifyUpdateListeners(event.sessionId)
}

export const getChatViewEvents = async (sessionId?: string): Promise<readonly ChatViewEvent[]> => {
  return chatSessionStorage.getEvents(sessionId)
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
