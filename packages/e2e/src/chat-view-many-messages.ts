import type { Test } from '@lvce-editor/test-with-playwright'

export const name = 'chat-view.many-messages'

export const skip = 1

export const test: Test = async ({ Chat, expect, FileSystem, Locator, Workspace }) => {
  // arrange
  const tmpDir = await FileSystem.getTmpDir()
  await Workspace.setPath(tmpDir)
  await Chat.show()
  await Chat.reset()

  // act
  const messages = Locator('.ChatMessages .Message')
  for (let i = 0; i < 20; i++) {
    await Chat.handleInput('hello from e2e')
    await Chat.handleSubmit()
  }

  // assert
  await expect(messages).toHaveCount(40)
}
