import {
  appendChatViewEvent,
  clearChatSessions,
  deleteChatSession,
  getChatSession,
  getChatViewEvents,
  listChatSessions,
  setSession,
} from '../ChatSessionStorage/ChatSessionStorage.ts'
import { handleMessagePort } from '../HandleMessagePort/HandleMessagePort.ts'
import { setTodosInIndexedDb, setTodosInCacheStorage } from '../TodoStorage/TodoStorage.ts'

export const commandMap = {
  'ChatStorage.appendEvent': appendChatViewEvent,
  'ChatStorage.clear': clearChatSessions,
  'ChatStorage.deleteSession': deleteChatSession,
  'ChatStorage.getEvents': getChatViewEvents,
  'ChatStorage.getSession': getChatSession,
  'ChatStorage.listSessions': listChatSessions,
  'ChatStorage.setSession': setSession,
  'ChatStorage.setTodosInCacheStorage': setTodosInCacheStorage,
  'ChatStorage.setTodosInIndexedDb': setTodosInIndexedDb,
  'HandleMessagePort.handleMessagePort': handleMessagePort,
  initialize: (_: string, port: MessagePort): Promise<void> => handleMessagePort(port),
}
