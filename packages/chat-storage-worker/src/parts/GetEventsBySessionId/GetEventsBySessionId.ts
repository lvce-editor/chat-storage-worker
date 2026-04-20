// cspell:ignore IDBP
import type { IDBPObjectStore } from 'idb'
import type { ChatViewEventSimple } from '../ChatViewEventSimple/ChatViewEventSimple.ts'
import { collapseToolExecutionEvents } from '../CollapseToolExecutionEvents/CollapseToolExecutionEvents.ts'
import { filterEventsBySessionId } from '../FilterEventsBySessionId/FilterEventsBySessionId.ts'
import { getAllEvents } from '../GetAllEvents/GetAllEvents.ts'
import { getLightweightEvent } from '../GetLightweightEvent/GetLightweightEvent.ts'
import { filterDebugChatViewEvents } from '../IsRequiredChatViewEvent/IsRequiredChatViewEvent.ts'

const toLightweightEvents = (events: readonly ChatViewEventSimple[]): readonly ChatViewEventSimple[] => {
  const eventsWithIds = events.map((event, index) => {
    return {
      ...event,
      eventId: index + 1,
    }
  })
  return collapseToolExecutionEvents(eventsWithIds).map((event, index) => getLightweightEvent(event, index + 1))
}

export const getSimpleEventsBySessionId = async (
  store: Pick<IDBPObjectStore, 'getAll' | 'indexNames' | 'index'>, // eslint-disable-line @typescript-eslint/prefer-readonly-parameter-types
  sessionId: string,
  sessionIdIndexName: string,
): Promise<readonly ChatViewEventSimple[]> => {
  if (store.indexNames.contains(sessionIdIndexName)) {
    const index = store.index(sessionIdIndexName)
    const events = await index.getAll(sessionId)

    return toLightweightEvents(filterDebugChatViewEvents(filterEventsBySessionId(events as readonly ChatViewEventSimple[], sessionId)))
  }
  const all = await getAllEvents(store)
  return toLightweightEvents(filterDebugChatViewEvents(filterEventsBySessionId(all, sessionId)))
}
