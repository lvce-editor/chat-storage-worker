import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'
import { eventStableIds } from '../EventStableIdsState/EventStableIdsState.ts'

export const setStableEventId = (event: ChatViewEventSimple, stableEventId: string): void => {
  eventStableIds.set(event, stableEventId)
}
