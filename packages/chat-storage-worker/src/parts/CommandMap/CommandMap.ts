import {
  appendChatDebugEvent,
  appendChatViewEvent,
  clearPartialMessage,
  clearChatSessions,
  consumeSessionUpdates,
  deleteChatSession,
  getChatSession,
  getChatViewEvents,
  getMessages,
  listChatSessions,
  listChatViewEvents,
  loadSelectedEventOld,
  setPartialMessage,
  setSession,
  subscribeSessionUpdates,
  unsubscribeSessionUpdates,
  waitForSessionUpdates,
} from '../ChatSessionStorage/ChatSessionStorage.ts'
import { createSession } from '../CreateSession/CreateSession.ts'
import { handleMessagePort } from '../HandleMessagePort/HandleMessagePort.ts'
import { listChatViewEventsSimple } from '../ListChatViewEventsSimple/ListChatViewEventsSimple.ts'
import { loadSelectedEvent } from '../LoadSelectedEvent/LoadSelectedEvent.ts'
import { setTodosInCacheStorage, setTodosInIndexedDb } from '../TodoStorage/TodoStorage.ts'

export const commandMap: Record<string, unknown> = {
  'ChatStorage.appendDebugEvent': appendChatDebugEvent,
  'ChatStorage.appendEvent': appendChatViewEvent,
  'ChatStorage.clear': clearChatSessions,
  'ChatStorage.clearPartialMessage': clearPartialMessage,
  'ChatStorage.consumeSessionUpdates': consumeSessionUpdates,
  'ChatStorage.createSession': createSession,
  'ChatStorage.deleteSession': deleteChatSession,
  'ChatStorage.getEvents': getChatViewEvents,
  'ChatStorage.getMessages': getMessages,
  'ChatStorage.getSession': getChatSession,
  'ChatStorage.listChatViewEvents': listChatViewEvents,
  'ChatStorage.listChatViewEventsSimple': listChatViewEventsSimple,
  'ChatStorage.listSessions': listChatSessions,
  'ChatStorage.loadSelectedEvent': loadSelectedEventOld,
  'ChatStorage.loadSelectedEventNew': loadSelectedEvent,
  'ChatStorage.setPartialMessage': setPartialMessage,
  'ChatStorage.setSession': setSession,
  'ChatStorage.setTodosInCacheStorage': setTodosInCacheStorage,
  'ChatStorage.setTodosInIndexedDb': setTodosInIndexedDb,
  'ChatStorage.subscribeSessionUpdates': subscribeSessionUpdates,
  'ChatStorage.unsubscribeSessionUpdates': unsubscribeSessionUpdates,
  'ChatStorage.waitForSessionUpdates': waitForSessionUpdates,
  'HandleMessagePort.handleMessagePort': handleMessagePort,
  initialize: (_: string, port: MessagePort): Promise<void> => handleMessagePort(port),
}
