export interface ChatViewEventSimple {
  readonly duration?: number
  readonly durationMs?: number
  readonly ended?: number | string
  readonly endTime?: number | string
  readonly eventId?: number
  readonly [key: string]: unknown
  readonly sessionId?: string
  readonly started?: number | string
  readonly startTime?: number | string
  readonly timestamp?: number | string
  readonly type: string
}
