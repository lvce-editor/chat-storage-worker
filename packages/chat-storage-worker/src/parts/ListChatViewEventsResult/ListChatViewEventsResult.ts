import type { ChatViewEventSummary } from '../ChatViewEventLookup/ChatViewEventLookup.ts'

export type ListChatViewEventsSuccess = {
  readonly type: 'success'
  readonly events: readonly ChatViewEventSummary[]
}

export type ListChatViewEventsError = {
  readonly type: 'error'
  readonly error: unknown
}

export type ListChatViewEventsResult = ListChatViewEventsSuccess | ListChatViewEventsError
