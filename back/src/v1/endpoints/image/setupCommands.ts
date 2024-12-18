import { readImageCommand } from './read/commands/read'

export const setupCommands = () => {
  return { readImageCommand: readImageCommand() }
}

export type Commands = ReturnType<typeof setupCommands>
