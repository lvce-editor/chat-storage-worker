import type { SessionListenerIdentifier } from '../ChatSessionStorageTypes/ChatSessionStorageTypes.ts'

export const getSessionListenerKey = ({ rpcId, uid }: SessionListenerIdentifier): string => {
  return `${rpcId}:${uid}`
}
