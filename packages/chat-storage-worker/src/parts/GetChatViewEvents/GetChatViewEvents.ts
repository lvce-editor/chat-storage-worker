import type { ChatViewEvent } from '../ChatViewEvent/ChatViewEvent.ts'
import { getChatSessionStorage } from '../ChatSessionStorageState/ChatSessionStorageState.ts'

const isMessageReplayEvent = (event: ChatViewEvent): boolean => {
  return (
    event.type === 'chat-session-messages-replaced' ||
    event.type === 'chat-message-added' ||
    event.type === 'chat-message-updated' ||
    event.type === 'handle-submit' ||
    event.type === 'sse-response-completed'
  )
}

export const getChatViewEvents = async (sessionId?: string): Promise<readonly ChatViewEvent[]> => {
  return getChatSessionStorage().getEvents(sessionId)
}

export const getMessageReplayEvents = async (sessionId: string): Promise<readonly ChatViewEvent[]> => {
  if (!sessionId) {
    return []
  }
  const events = await getChatSessionStorage().getEvents(sessionId)
  return events.filter(isMessageReplayEvent)
}
