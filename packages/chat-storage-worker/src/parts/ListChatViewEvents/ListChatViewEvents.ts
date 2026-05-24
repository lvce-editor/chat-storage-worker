import type { ListChatViewEventsResult } from '../ListChatViewEventsResult/ListChatViewEventsResult.ts'
import { getChatSessionStorage } from '../ChatSessionStorageState/ChatSessionStorageState.ts'
import { listChatViewEventSummaries } from '../ChatViewEventLookup/ChatViewEventLookup.ts'

export const listChatViewEvents = async (sessionId: string): Promise<ListChatViewEventsResult> => {
  try {
    const events = await getChatSessionStorage().getEvents(sessionId)
    const normalized = listChatViewEventSummaries(events)
    return {
      events: normalized,
      type: 'success',
    }
  } catch (error) {
    return {
      error,
      type: 'error',
    }
  }
}
