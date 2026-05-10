import {
  appendChatDebugEvent,
  appendChatViewEvent,
  clearChatSessions,
  consumeSessionUpdates,
  deleteChatSession,
  getChatSession,
  getChatViewEvents,
  listChatSessions,
  listChatViewEvents,
  loadSelectedEventOld,
  setSession,
  subscribeSessionUpdates,
  unsubscribeSessionUpdates,
  waitForSessionUpdates,
} from '../ChatSessionStorage/ChatSessionStorage.ts'
import { createSession } from '../CreateSession/CreateSession.ts'
import { getMessages } from '../GetMessages/GetMessages.ts'
import { handleMessagePort } from '../HandleMessagePort/HandleMessagePort.ts'
import { listChatViewEventsSimple } from '../ListChatViewEventsSimple/ListChatViewEventsSimple.ts'
import { loadSelectedEvent } from '../LoadSelectedEvent/LoadSelectedEvent.ts'
import { setTodosInCacheStorage, setTodosInIndexedDb } from '../TodoStorage/TodoStorage.ts'

export const commandMap = {
  'ChatStorage.appendDebugEvent': appendChatDebugEvent,
  'ChatStorage.appendEvent': appendChatViewEvent,
  'ChatStorage.clear': clearChatSessions,
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
  'ChatStorage.setSession': setSession,
  'ChatStorage.setTodosInCacheStorage': setTodosInCacheStorage,
  'ChatStorage.setTodosInIndexedDb': setTodosInIndexedDb,
  'ChatStorage.subscribeSessionUpdates': subscribeSessionUpdates,
  'ChatStorage.unsubscribeSessionUpdates': unsubscribeSessionUpdates,
  'ChatStorage.waitForSessionUpdates': waitForSessionUpdates,
  'HandleMessagePort.handleMessagePort': handleMessagePort,
  initialize: (_: string, port: MessagePort): Promise<void> => handleMessagePort(port),
}
