import type { ChatMessage } from '../ChatMessage/ChatMessage.ts'
import { setPartialMessageValue } from '../ChatSessionStorageState/ChatSessionStorageState.ts'
import { notifySessionListeners } from '../NotifySessionListeners/NotifySessionListeners.ts'

export interface PartialMessagePayload {
  readonly message: ChatMessage
  readonly sessionId: string
}

export const setPartialMessage = async ({ message, sessionId }: PartialMessagePayload): Promise<void> => {
  setPartialMessageValue(sessionId, {
    ...message,
    partial: true,
  })
  await notifySessionListeners(sessionId)
}
