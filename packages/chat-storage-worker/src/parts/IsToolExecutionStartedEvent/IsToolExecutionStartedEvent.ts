import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'
import { startedEventType } from '../EventTypes/EventTypes.ts'

export const isToolExecutionStartedEvent = (event: ChatViewEventSimple): boolean => {
  return event.type === startedEventType
}
