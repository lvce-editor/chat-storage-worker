import type { ChatSession } from '../ChatSession/ChatSession.ts'
import { getChatSessionStorage } from '../ChatSessionStorageState/ChatSessionStorageState.ts'

export const getChatSession = async (id: string): Promise<ChatSession | undefined> => {
  const session = await getChatSessionStorage().getSession(id)
  if (!session) {
    return undefined
  }
  const resultBase: ChatSession = {
    id: session.id,
    messages: [...session.messages],
    title: session.title,
  }
  const result = session.projectId
    ? {
        ...resultBase,
        projectId: session.projectId,
      }
    : resultBase
  return result
}