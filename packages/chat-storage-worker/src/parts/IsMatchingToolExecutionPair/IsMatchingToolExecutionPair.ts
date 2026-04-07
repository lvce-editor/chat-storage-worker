import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'
import { hasMatchingToolName } from '../HasMatchingToolName/HasMatchingToolName.ts'

export const isMatchingToolExecutionPair = (startedEvent: ChatViewEventSimple, finishedEvent: ChatViewEventSimple): boolean => {
  return startedEvent.sessionId === finishedEvent.sessionId && hasMatchingToolName(startedEvent, finishedEvent)
}
