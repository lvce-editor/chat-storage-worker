import type { ChatSession } from '../ChatSession/ChatSession.ts'
import { getChatSessionStorage } from '../ChatSessionStorageState/ChatSessionStorageState.ts'

export const listChatSessions = async (): Promise<readonly ChatSession[]> => {
  const sessions = await getChatSessionStorage().listSessions()
  return sessions.map((session) => {
    const summary: ChatSession = {
      id: session.id,
      messages: [],
      title: session.title,
    }
    if (!session.projectId) {
      return summary
    }
    return {
      ...summary,
      projectId: session.projectId,
    }
  })
}