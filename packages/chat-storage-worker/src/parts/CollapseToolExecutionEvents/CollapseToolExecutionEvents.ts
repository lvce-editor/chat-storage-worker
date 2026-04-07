import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'
import { isMatchingToolExecutionPair } from '../IsMatchingToolExecutionPair/IsMatchingToolExecutionPair.ts'
import { isToolExecutionFinishedEvent } from '../IsToolExecutionFinishedEvent/IsToolExecutionFinishedEvent.ts'
import { isToolExecutionStartedEvent } from '../IsToolExecutionStartedEvent/IsToolExecutionStartedEvent.ts'
import { mergeToolExecutionEvents } from '../MergeToolExecutionEvents/MergeToolExecutionEvents.ts'

export const collapseToolExecutionEvents = (events: readonly ChatViewEventSimple[]): readonly ChatViewEventSimple[] => {
  const collapsedEvents: ChatViewEventSimple[] = []
  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    if (isToolExecutionStartedEvent(event)) {
      const nextEvent = events[i + 1]
      if (nextEvent && isToolExecutionFinishedEvent(nextEvent) && isMatchingToolExecutionPair(event, nextEvent)) {
        collapsedEvents.push(mergeToolExecutionEvents(event, nextEvent))
        i++
        continue
      }
    }
    collapsedEvents.push(event)
  }
  return collapsedEvents
}

export { getStableEventId } from '../GetStableEventId/GetStableEventId.ts'
