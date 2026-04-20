import type { ChatViewEvent } from '../ChatViewEvent/ChatViewEvent.ts'
import { getChatSessionStorage } from '../ChatSessionStorageState/ChatSessionStorageState.ts'

const isMessageReplayEvent = (event: ChatViewEvent): boolean => {
  const type = Reflect.get(event, 'type')
  return (
    type === 'chat-session-messages-replaced' ||
    type === 'chat-message-added' ||
    type === 'chat-message-updated' ||
    type === 'handle-submit' ||
    type === 'ai-response-success'
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
