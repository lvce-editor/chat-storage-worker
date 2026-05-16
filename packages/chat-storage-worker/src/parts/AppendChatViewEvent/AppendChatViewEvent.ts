import type { ChatViewEvent } from '../ChatViewEvent/ChatViewEvent.ts'
import { clearPartialMessageValue } from '../ChatSessionStorageState/ChatSessionStorageState.ts'
import { getChatSessionStorage } from '../ChatSessionStorageState/ChatSessionStorageState.ts'
import { notifySessionListeners } from '../NotifySessionListeners/NotifySessionListeners.ts'

export const appendChatViewEvent = async (event: ChatViewEvent): Promise<void> => {
  await getChatSessionStorage().appendEvent(event)
  if (event.type === 'chat-message-added' || event.type === 'chat-session-deleted' || event.type === 'chat-session-messages-replaced') {
    clearPartialMessageValue(event.sessionId)
  }
  await notifySessionListeners(event.sessionId)
}
