import type { ChatSession } from '../ChatSession/ChatSession.ts'
import { setSession } from '../ChatSessionStorageSetSession/ChatSessionStorageSetSession.ts'

export const saveChatSession = async (session: ChatSession): Promise<void> => {
  const value: ChatSession = {
    id: session.id,
    messages: [...session.messages],
    title: session.title,
  }
  await setSession(
    session.projectId
      ? {
          ...value,
          projectId: session.projectId,
        }
      : value,
  )
}