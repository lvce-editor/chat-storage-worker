import {
  appendChatViewEvent,
  clearChatSessions,
  deleteChatSession,
  getChatSession,
  getChatViewEvents,
  listChatSessions,
  listChatViewEvents,
  loadSelectedEventOld,
  setSession,
} from '../ChatSessionStorage/ChatSessionStorage.ts'
import { handleMessagePort } from '../HandleMessagePort/HandleMessagePort.ts'
import { listChatViewEventsSimple } from '../ListChatViewEventsSimple/ListChatViewEventsSimple.ts'
import { loadSelectedEvent } from '../LoadSelectedEvent/LoadSelectedEvent.ts'
import { setTodosInCacheStorage, setTodosInIndexedDb } from '../TodoStorage/TodoStorage.ts'

export const commandMap = {
  'ChatStorage.appendEvent': appendChatViewEvent,
  'ChatStorage.clear': clearChatSessions,
  'ChatStorage.deleteSession': deleteChatSession,
  'ChatStorage.getEvents': getChatViewEvents,
  'ChatStorage.getSession': getChatSession,
  'ChatStorage.listChatViewEvents': listChatViewEvents,
  'ChatStorage.listChatViewEventsSimple': listChatViewEventsSimple,
  'ChatStorage.listSessions': listChatSessions,
  'ChatStorage.loadSelectedEvent': loadSelectedEventOld,
  'ChatStorage.loadSelectedEventNew': loadSelectedEvent,
  'ChatStorage.setSession': setSession,
  'ChatStorage.setTodosInCacheStorage': setTodosInCacheStorage,
  'ChatStorage.setTodosInIndexedDb': setTodosInIndexedDb,
  'HandleMessagePort.handleMessagePort': handleMessagePort,
  initialize: (_: string, port: MessagePort): Promise<void> => handleMessagePort(port),
}
