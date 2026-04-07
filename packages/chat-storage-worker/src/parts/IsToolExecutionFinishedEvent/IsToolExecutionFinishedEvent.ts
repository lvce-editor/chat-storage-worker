import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'
import { finishedEventType } from '../EventTypes/EventTypes.ts'

export const isToolExecutionFinishedEvent = (event: ChatViewEventSimple): boolean => {
  return event.type === finishedEventType
}
