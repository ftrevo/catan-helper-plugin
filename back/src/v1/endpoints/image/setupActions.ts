import { readImageAction } from './read'
import { setupCommands } from './setupCommands'

export const setupImageActions = () => {
  const { readImageCommand } = setupCommands()

  return {
    readImage: readImageAction(readImageCommand),
  }
}
