import { loadSelectedChatViewEvent, type ChatViewEventInfo } from '../ChatViewEventLookup/ChatViewEventLookup.ts'
import { getChatSessionStorage } from '../ChatSessionStorageState/ChatSessionStorageState.ts'

export const loadSelectedEventOld = async (sessionId: string, eventId: number, type: string): Promise<ChatViewEventInfo | null> => {
  const events = await getChatSessionStorage().getEvents(sessionId)
  return loadSelectedChatViewEvent(events, eventId, type)
}