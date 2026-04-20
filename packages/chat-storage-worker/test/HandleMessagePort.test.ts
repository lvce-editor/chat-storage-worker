import { expect, test } from '@jest/globals'
import * as CommandMap from '../src/parts/CommandMap/CommandMap.ts'
import * as HandleMessagePort from '../src/parts/HandleMessagePort/HandleMessagePort.ts'

test('commandMap exposes handleMessagePort', () => {
  expect(CommandMap.commandMap['HandleMessagePort.handleMessagePort']).toBe(HandleMessagePort.handleMessagePort)
})

test('commandMap exposes chat view event commands', async () => {
  const chatSessionStorage = await import('../src/parts/ChatSessionStorage/ChatSessionStorage.ts')
  expect(CommandMap.commandMap['ChatStorage.appendDebugEvent']).toBe(chatSessionStorage.appendChatDebugEvent)
  expect(CommandMap.commandMap['ChatStorage.listChatViewEvents']).toBe(chatSessionStorage.listChatViewEvents)
  expect(CommandMap.commandMap['ChatStorage.loadSelectedEvent']).toBe(chatSessionStorage.loadSelectedEventOld)
})
