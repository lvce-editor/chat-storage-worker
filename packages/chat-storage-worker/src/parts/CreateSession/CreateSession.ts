import { getChatSessionStorage } from '../ChatSessionStorageState/ChatSessionStorageState.ts'

export interface CreateSessionOptions {
  readonly sessionId: string
  readonly timestamp: string
  readonly title: string
}

export const createSession = async (session: CreateSessionOptions): Promise<void> => {
  // TODO
  // 1. in chat-session table, insert the new entry

  await getChatSessionStorage().setSession({
    id: session.sessionId,
    messages: [],
    timestamp: session.timestamp || '',
    title: session.title || '',
  })
}
