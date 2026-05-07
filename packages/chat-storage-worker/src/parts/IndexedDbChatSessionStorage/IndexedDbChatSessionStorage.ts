/* eslint-disable @typescript-eslint/prefer-readonly-parameter-types */
import type { IDBPDatabase } from 'idb'
import { openDB } from 'idb'
import type { ChatSession } from '../ChatSession/ChatSession.ts'
import type { ChatSessionStorage } from '../ChatSessionStorageTypes/ChatSessionStorageTypes.ts'
import type { ChatViewEvent } from '../ChatViewEvent/ChatViewEvent.ts'
import {
  chatSessionStorageDatabaseName,
  chatSessionStorageDatabaseVersion,
  chatSessionStorageEventStoreName,
  chatSessionStorageStoreName,
} from '../ChatSessionStorageConfig/ChatSessionStorageConfig.ts'

interface State {
  readonly databaseName: string
  databasePromise: Promise<IDBPDatabase> | undefined
  readonly databaseVersion: number
  readonly eventStoreName: string
  readonly storeName: string
}

interface IndexedDbChatSessionStorageOptions {
  readonly databaseName?: string
  readonly databaseVersion?: number
  readonly eventStoreName?: string
  readonly storeName?: string
}

interface SessionSummary {
  readonly id: string
  readonly messages?: readonly ChatSession['messages'][number][]
  readonly title: string
}

type StoredChatViewEvent = ChatViewEvent & {
  readonly eventId?: number
}

const toChatViewEvent = (event: StoredChatViewEvent): ChatViewEvent => {
  const { eventId: _eventId, ...chatViewEvent } = event
  return chatViewEvent
}

const now = (): string => {
  return new Date().toISOString()
}

const isSameMessage = (a: Readonly<ChatSession['messages'][number]>, b: Readonly<ChatSession['messages'][number]>): boolean => {
  return (
    a.id === b.id &&
    a.inProgress === b.inProgress &&
    a.role === b.role &&
    a.text === b.text &&
    a.time === b.time &&
    JSON.stringify(a.toolCalls || []) === JSON.stringify(b.toolCalls || [])
  )
}

const canAppendMessages = (
  previousMessages: readonly ChatSession['messages'][number][],
  nextMessages: readonly ChatSession['messages'][number][],
): boolean => {
  if (nextMessages.length < previousMessages.length) {
    return false
  }
  return previousMessages.every((message, index) => isSameMessage(message, nextMessages[index]))
}

const canUpdateMessages = (
  previousMessages: readonly ChatSession['messages'][number][],
  nextMessages: readonly ChatSession['messages'][number][],
): boolean => {
  if (previousMessages.length !== nextMessages.length) {
    return false
  }
  for (let i = 0; i < previousMessages.length; i += 1) {
    const previous = previousMessages[i]
    const next = nextMessages[i]
    if (previous.id !== next.id || previous.role !== next.role) {
      return false
    }
  }
  return true
}

const getMutationEvents = (previous: ChatSession | undefined, next: ChatSession): readonly ChatViewEvent[] => {
  const timestamp = now()
  const events: ChatViewEvent[] = []
  if (!previous) {
    events.push({
      sessionId: next.id,
      timestamp,
      title: next.title,
      type: 'chat-session-created',
    })
    for (const message of next.messages) {
      events.push({
        message,
        sessionId: next.id,
        timestamp,
        type: 'chat-message-added',
      })
    }
    return events
  }
  if (previous.title !== next.title) {
    events.push({
      sessionId: next.id,
      timestamp,
      title: next.title,
      type: 'chat-session-title-updated',
    })
  }
  if (canAppendMessages(previous.messages, next.messages)) {
    for (let i = previous.messages.length; i < next.messages.length; i += 1) {
      events.push({
        message: next.messages[i],
        sessionId: next.id,
        timestamp,
        type: 'chat-message-added',
      })
    }
    return events
  }
  if (canUpdateMessages(previous.messages, next.messages)) {
    for (let i = 0; i < previous.messages.length; i += 1) {
      const previousMessage = previous.messages[i]
      const nextMessage = next.messages[i]
      if (!isSameMessage(previousMessage, nextMessage)) {
        events.push({
          inProgress: nextMessage.inProgress,
          messageId: nextMessage.id,
          sessionId: next.id,
          text: nextMessage.text,
          time: nextMessage.time,
          timestamp,
          toolCalls: nextMessage.toolCalls,
          type: 'chat-message-updated',
        })
      }
    }
    return events
  }
  events.push({
    messages: [...next.messages],
    sessionId: next.id,
    timestamp,
    type: 'chat-session-messages-replaced',
  })
  return events
}

interface ReplayState {
  readonly deleted: boolean
  readonly messages: readonly ChatSession['messages'][number][]
  readonly title: string
}

const getUpdatedMessage = (
  message: Readonly<ChatSession['messages'][number]>,
  event: Extract<ChatViewEvent, { type: 'chat-message-updated' }>,
): ChatSession['messages'][number] => {
  if (message.id !== event.messageId) {
    return message
  }
  return {
    ...message,
    ...(event.inProgress === undefined
      ? {}
      : {
          inProgress: event.inProgress,
        }),
    text: event.text,
    time: event.time,
    ...(event.toolCalls === undefined
      ? {}
      : {
          toolCalls: event.toolCalls,
        }),
  }
}

const applyReplayEvent = (state: ReplayState, event: ChatViewEvent): ReplayState => {
  switch (event.type) {
    case 'chat-message-added':
      return {
        ...state,
        messages: [...state.messages, event.message],
      }
    case 'chat-message-updated':
      return {
        ...state,
        messages: state.messages.map((message) => getUpdatedMessage(message, event)),
      }
    case 'chat-session-created':
      return {
        ...state,
        deleted: false,
        title: event.title,
      }
    case 'chat-session-deleted':
      return {
        ...state,
        deleted: true,
      }
    case 'chat-session-messages-replaced':
      return {
        ...state,
        messages: [...event.messages],
      }
    case 'chat-session-title-updated':
      return {
        ...state,
        title: event.title,
      }
  }
  return state
}

const replaySession = (id: string, summary: SessionSummary | undefined, events: readonly ChatViewEvent[]): ChatSession | undefined => {
  let state: ReplayState = {
    deleted: false,
    messages: summary?.messages ? [...summary.messages] : [],
    title: summary?.title || '',
  }
  for (const event of events) {
    if (event.sessionId !== id) {
      continue
    }
    state = applyReplayEvent(state, event)
  }
  if (state.deleted || !state.title) {
    return undefined
  }
  return {
    id,
    messages: state.messages,
    title: state.title,
  }
}

export class IndexedDbChatSessionStorage implements ChatSessionStorage {
  private state: State

  constructor(options: IndexedDbChatSessionStorageOptions = {}) {
    this.state = {
      databaseName: options.databaseName || chatSessionStorageDatabaseName,
      databasePromise: undefined,
      databaseVersion: options.databaseVersion || chatSessionStorageDatabaseVersion,
      eventStoreName: options.eventStoreName || chatSessionStorageEventStoreName,
      storeName: options.storeName || chatSessionStorageStoreName,
    }
  }

  private openDatabase = async (): Promise<IDBPDatabase> => {
    if (this.state.databasePromise) {
      return this.state.databasePromise
    }
    const databasePromise = openDB(this.state.databaseName, this.state.databaseVersion, {
      upgrade: (database, _oldVersion, _newVersion, transaction) => {
        if (!database.objectStoreNames.contains(this.state.storeName)) {
          database.createObjectStore(this.state.storeName, {
            keyPath: 'id',
          })
        }
        if (database.objectStoreNames.contains(this.state.eventStoreName)) {
          const eventStore = transaction.objectStore(this.state.eventStoreName)
          if (!eventStore.indexNames.contains('sessionId')) {
            eventStore.createIndex('sessionId', 'sessionId', { unique: false })
          }
        } else {
          const eventStore = database.createObjectStore(this.state.eventStoreName, {
            autoIncrement: true,
            keyPath: 'eventId',
          })
          eventStore.createIndex('sessionId', 'sessionId', { unique: false })
        }
      },
    })
    this.state.databasePromise = databasePromise
    return databasePromise
  }

  private listSummaries = async (): Promise<readonly SessionSummary[]> => {
    const database = await this.openDatabase()
    const summaries = await database.getAll(this.state.storeName)
    return summaries as readonly SessionSummary[]
  }

  private getSummary = async (id: string): Promise<SessionSummary | undefined> => {
    const database = await this.openDatabase()
    const summary = await database.get(this.state.storeName, id)
    return summary as SessionSummary | undefined
  }

  private getEventsBySessionId = async (sessionId: string): Promise<readonly ChatViewEvent[]> => {
    const database = await this.openDatabase()
    const events = await database.getAllFromIndex(this.state.eventStoreName, 'sessionId', IDBKeyRange.only(sessionId))
    return (events as readonly StoredChatViewEvent[]).map(toChatViewEvent)
  }

  private appendEvents = async (events: readonly ChatViewEvent[]): Promise<void> => {
    if (events.length === 0) {
      return
    }
    const database = await this.openDatabase()
    const transaction = database.transaction([this.state.storeName, this.state.eventStoreName], 'readwrite')
    const summaryStore = transaction.objectStore(this.state.storeName)
    const eventStore = transaction.objectStore(this.state.eventStoreName)
    for (const event of events) {
      await eventStore.add(event)
      if (event.type === 'chat-session-created' || event.type === 'chat-session-title-updated') {
        await summaryStore.put({
          id: event.sessionId,
          title: event.title,
        })
      }
      if (event.type === 'chat-session-deleted') {
        await summaryStore.delete(event.sessionId)
      }
    }
    await transaction.done
  }

  async appendEvent(event: ChatViewEvent): Promise<void> {
    await this.appendEvents([event])
  }

  async clear(): Promise<void> {
    const database = await this.openDatabase()
    const transaction = database.transaction([this.state.storeName, this.state.eventStoreName], 'readwrite')
    await Promise.all([transaction.objectStore(this.state.storeName).clear(), transaction.objectStore(this.state.eventStoreName).clear()])
    await transaction.done
  }

  async deleteSession(id: string): Promise<void> {
    await this.appendEvent({
      sessionId: id,
      timestamp: now(),
      type: 'chat-session-deleted',
    })
  }

  async getEvents(sessionId: string): Promise<readonly ChatViewEvent[]> {
    return this.getEventsBySessionId(sessionId)
  }

  async getSession(id: string): Promise<ChatSession | undefined> {
    const [summary, events] = await Promise.all([this.getSummary(id), this.getEventsBySessionId(id)])
    return replaySession(id, summary, events)
  }

  async listSessions(): Promise<readonly ChatSession[]> {
    const summaries = await this.listSummaries()
    const sessions: ChatSession[] = []
    for (const summary of summaries) {
      const events = await this.getEventsBySessionId(summary.id)
      const session = replaySession(summary.id, summary, events)
      if (!session) {
        continue
      }
      sessions.push(session)
    }
    return sessions
  }

  async setSession(session: ChatSession): Promise<void> {
    const previous = await this.getSession(session.id)
    const events = getMutationEvents(previous, session)
    await this.appendEvents(events)
    if (events.length === 0) {
      const database = await this.openDatabase()
      const transaction = database.transaction(this.state.storeName, 'readwrite')
      const summaryStore = transaction.objectStore(this.state.storeName)
      await summaryStore.put({
        id: session.id,
        title: session.title,
      })
      await transaction.done
    }
  }
}
