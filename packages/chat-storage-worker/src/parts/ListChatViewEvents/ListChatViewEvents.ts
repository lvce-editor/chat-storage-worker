import type { ListChatViewEventsResult } from '../ListChatViewEventsResult/ListChatViewEventsResult.ts'
import { getChatSessionStorage } from '../ChatSessionStorageState/ChatSessionStorageState.ts'
import { listChatViewEventSummaries } from '../ChatViewEventLookup/ChatViewEventLookup.ts'

export const listChatViewEvents = async (sessionId: string): Promise<ListChatViewEventsResult> => {
  try {
    const events = await getChatSessionStorage().getEvents(sessionId)
    return {
      events: listChatViewEventSummaries(events),
      type: 'success',
    }
  } catch (error) {
    return {
      error,
      type: 'error',
    }
  }
}
