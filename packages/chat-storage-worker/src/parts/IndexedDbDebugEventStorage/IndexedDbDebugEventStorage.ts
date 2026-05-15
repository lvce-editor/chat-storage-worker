/* eslint-disable @typescript-eslint/prefer-readonly-parameter-types */
/* cspell:ignore IDBP */
import type { IDBPDatabase } from 'idb'
import { openDB } from 'idb'
import type { DebugEvent, DebugEventStorage } from '../DebugEventStorageTypes/DebugEventStorageTypes.ts'
import {
  debugEventStorageDatabaseName,
  debugEventStorageDatabaseVersion,
  debugEventStorageEventStoreName,
  debugEventStorageSessionIdIndexName,
} from '../DebugEventStorageConfig/DebugEventStorageConfig.ts'

interface State {
  readonly databaseName: string
  databasePromise: Promise<IDBPDatabase> | undefined
  readonly databaseVersion: number
  readonly eventStoreName: string
  readonly sessionIdIndexName: string
}

interface IndexedDbDebugEventStorageOptions {
  readonly databaseName?: string
  readonly databaseVersion?: number
  readonly eventStoreName?: string
  readonly sessionIdIndexName?: string
}

type StoredDebugEvent = DebugEvent & {
  readonly eventId?: number
}

const toDebugEvent = (event: StoredDebugEvent): DebugEvent => {
  const { eventId: _eventId, ...debugEvent } = event
  return debugEvent
}

export class IndexedDbDebugEventStorage implements DebugEventStorage {
  private state: State

  constructor(options: IndexedDbDebugEventStorageOptions = {}) {
    this.state = {
      databaseName: options.databaseName || debugEventStorageDatabaseName,
      databasePromise: undefined,
      databaseVersion: options.databaseVersion || debugEventStorageDatabaseVersion,
      eventStoreName: options.eventStoreName || debugEventStorageEventStoreName,
      sessionIdIndexName: options.sessionIdIndexName || debugEventStorageSessionIdIndexName,
    }
  }

  private openDatabase = async (): Promise<IDBPDatabase> => {
    if (this.state.databasePromise) {
      return this.state.databasePromise
    }
    const databasePromise = openDB(this.state.databaseName, this.state.databaseVersion, {
      upgrade: (database, _oldVersion, _newVersion, transaction) => {
        if (database.objectStoreNames.contains(this.state.eventStoreName)) {
          const eventStore = transaction.objectStore(this.state.eventStoreName)
          if (!eventStore.indexNames.contains(this.state.sessionIdIndexName)) {
            eventStore.createIndex(this.state.sessionIdIndexName, 'sessionId', { unique: false })
          }
          return
        }
        const eventStore = database.createObjectStore(this.state.eventStoreName, {
          autoIncrement: true,
          keyPath: 'eventId',
        })
        eventStore.createIndex(this.state.sessionIdIndexName, 'sessionId', { unique: false })
      },
    })
    this.state.databasePromise = databasePromise
    return databasePromise
  }

  async appendEvent(event: DebugEvent): Promise<void> {
    const database = await this.openDatabase()
    await database.add(this.state.eventStoreName, event)
  }

  async clear(): Promise<void> {
    const database = await this.openDatabase()
    await database.clear(this.state.eventStoreName)
  }

  private deleteSessionGetKeys = async (database: IDBPDatabase, sessionId: string): Promise<readonly IDBValidKey[]> => {
    const readTransaction = database.transaction(this.state.eventStoreName, 'readonly')
    const readEventStore = readTransaction.objectStore(this.state.eventStoreName)
    const readEventIndex = readEventStore.index(this.state.sessionIdIndexName)
    const keys = await readEventIndex.getAllKeys(IDBKeyRange.only(sessionId))
    await readTransaction.done
    return keys
  }

  private deleteSessionRemoveEntries = async (database: IDBPDatabase, keys: readonly IDBValidKey[]): Promise<void> => {
    if (keys.length === 0) {
      return
    }
    const writeTransaction = database.transaction(this.state.eventStoreName, 'readwrite')
    const writeEventStore = writeTransaction.objectStore(this.state.eventStoreName)
    const deletePromises = []
    for (const key of keys) {
      deletePromises.push(writeEventStore.delete(key))
    }
    await Promise.all([...deletePromises, writeTransaction.done])
  }

  async deleteSession(sessionId: string): Promise<void> {
    const database = await this.openDatabase()
    const keys = await this.deleteSessionGetKeys(database, sessionId)
    await this.deleteSessionRemoveEntries(database, keys)
  }

  async getEvents(sessionId?: string): Promise<readonly DebugEvent[]> {
    const database = await this.openDatabase()
    if (sessionId) {
      const events = await database.getAllFromIndex(this.state.eventStoreName, this.state.sessionIdIndexName, IDBKeyRange.only(sessionId))
      return (events as readonly StoredDebugEvent[]).map(toDebugEvent)
    }
    const events = await database.getAll(this.state.eventStoreName)
    return (events as readonly StoredDebugEvent[]).map(toDebugEvent)
  }
}
