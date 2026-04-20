const requiredChatViewEventTypes = new Set<string>([
  'chat-session-created',
  'chat-session-deleted',
  'chat-session-title-updated',
  'chat-message-added',
  'chat-message-updated',
  'chat-session-messages-replaced',
])

interface ChatViewEventLike {
  readonly type: string
}

export const isRequiredChatViewEvent = (event: ChatViewEventLike): boolean => {
  return requiredChatViewEventTypes.has(event.type)
}

export const isDebugChatViewEvent = (event: ChatViewEventLike): boolean => {
  return !isRequiredChatViewEvent(event)
}

export const filterDebugChatViewEvents = <T extends ChatViewEventLike>(events: readonly T[]): readonly T[] => {
  return events.filter(isDebugChatViewEvent)
}