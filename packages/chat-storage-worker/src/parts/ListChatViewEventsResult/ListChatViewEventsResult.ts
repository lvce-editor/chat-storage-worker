export type ListChatViewEventsSuccess = {
  readonly type: 'success'
  readonly events: readonly any[]
}

export type ListChatViewEventsError = {
  readonly type: 'error'
  readonly error: unknown
}

export type ListChatViewEventsNotSupported = {
  readonly type: 'not-supported'
}

export type ListChatViewEventsResult = ListChatViewEventsSuccess | ListChatViewEventsError | ListChatViewEventsNotSupported
