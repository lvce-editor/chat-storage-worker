import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'
import { eventStableIds, eventStableIdState } from '../EventStableIdsState/EventStableIdsState.ts'

export const getOrCreateStableEventId = (event: ChatViewEventSimple): string => {
  const existingStableEventId = eventStableIds.get(event)
  if (existingStableEventId) {
    return existingStableEventId
  }
  const stableEventId = `event-${eventStableIdState.nextStableEventId++}`
  eventStableIds.set(event, stableEventId)
  return stableEventId
}
