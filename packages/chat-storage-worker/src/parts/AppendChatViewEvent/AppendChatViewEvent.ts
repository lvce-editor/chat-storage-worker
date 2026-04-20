import type { ChatViewEvent } from '../ChatViewEvent/ChatViewEvent.ts'
import { getChatSessionStorage } from '../ChatSessionStorageState/ChatSessionStorageState.ts'
import { notifySessionListeners } from '../NotifySessionListeners/NotifySessionListeners.ts'

export const appendChatViewEvent = async (event: ChatViewEvent): Promise<void> => {
  await getChatSessionStorage().appendEvent(event)
  notifySessionListeners(event.sessionId)
}