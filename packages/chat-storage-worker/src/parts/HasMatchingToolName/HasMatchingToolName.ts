import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'

export const hasMatchingToolName = (startedEvent: ChatViewEventSimple, finishedEvent: ChatViewEventSimple): boolean => {
  if (typeof startedEvent.toolName === 'string' && typeof finishedEvent.toolName === 'string') {
    return startedEvent.toolName === finishedEvent.toolName
  }
  return true
}
