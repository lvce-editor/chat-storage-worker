import { getChatSessionStorage } from '../ChatSessionStorageState/ChatSessionStorageState.ts'
import { loadSelectedChatViewEvent, type ChatViewEventInfo } from '../ChatViewEventLookup/ChatViewEventLookup.ts'

export const loadSelectedEventOld = async (sessionId: string, eventId: number, type: string): Promise<ChatViewEventInfo | null> => {
  const events = await getChatSessionStorage().getEvents(sessionId)
  return loadSelectedChatViewEvent(events, eventId, type)
}
