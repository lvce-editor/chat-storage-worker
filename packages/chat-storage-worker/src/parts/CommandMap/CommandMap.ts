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

export const commandMap = {
  'ChatStorage.appendEvent': appendChatViewEvent,
  'ChatStorage.clear': clearChatSessions,
  'ChatStorage.deleteSession': deleteChatSession,
  'ChatStorage.getEvents': getChatViewEvents,
  'ChatStorage.getSession': getChatSession,
  'ChatStorage.listSessions': listChatSessions,
  'ChatStorage.setSession': setSession,
  'HandleMessagePort.handleMessagePort': handleMessagePort,
}
