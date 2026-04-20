import {
  appendChatDebugEvent,
  appendChatViewEvent,
  clearChatSessions,
  consumeSessionUpdates,
  deleteChatSession,
  getDebugEvents,
  getChatSession,
  getChatViewEvents,
  listChatSessions,
  listChatViewEvents,
  loadSelectedEventOld,
  subscribeSessionUpdates,
  setSession,
  waitForSessionUpdates,
  unsubscribeSessionUpdates,
} from '../ChatSessionStorage/ChatSessionStorage.ts'
import { handleMessagePort } from '../HandleMessagePort/HandleMessagePort.ts'
import { listChatViewEventsSimple } from '../ListChatViewEventsSimple/ListChatViewEventsSimple.ts'
import { loadSelectedEvent } from '../LoadSelectedEvent/LoadSelectedEvent.ts'
import { setTodosInCacheStorage, setTodosInIndexedDb } from '../TodoStorage/TodoStorage.ts'

export const commandMap = {
  'ChatStorage.appendDebugEvent': appendChatDebugEvent,
  'ChatStorage.appendEvent': appendChatViewEvent,
  'ChatStorage.clear': clearChatSessions,
  'ChatStorage.consumeSessionUpdates': consumeSessionUpdates,
  'ChatStorage.deleteSession': deleteChatSession,
  'ChatStorage.getDebugEvents': getDebugEvents,
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
  'ChatStorage.subscribeSessionUpdates': subscribeSessionUpdates,
  'ChatStorage.unsubscribeSessionUpdates': unsubscribeSessionUpdates,
  'ChatStorage.waitForSessionUpdates': waitForSessionUpdates,
  'HandleMessagePort.handleMessagePort': handleMessagePort,
  initialize: (_: string, port: MessagePort): Promise<void> => handleMessagePort(port),
}
