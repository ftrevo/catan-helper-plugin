import { CaptureError, NotColonistTabError } from '../platform/screenshot'
import { BoardNotFoundError, ModelLoadError } from '../vision/errors'

/** Maps any failure of the analysis to a sentence the popup can show. */
export const describeError = (error: unknown): string => {
  if (error instanceof NotColonistTabError) {
    return 'Open a game on colonist.io and try again. The extension only reads colonist.io boards.'
  }
  if (error instanceof CaptureError) {
    const reason = error.cause instanceof Error ? ` (${error.cause.message})` : ''
    return `Chrome refused to capture the tab${reason}. Click the extension icon again while the game is visible.`
  }
  if (error instanceof BoardNotFoundError) {
    return 'Could not find the board in the capture. Make sure the whole board with its number tokens is visible, then retry.'
  }
  if (error instanceof ModelLoadError) {
    return 'The recognition models could not be loaded. Try reloading the extension.'
  }
  if (error instanceof Error && error.message) {
    return `Could not read the board: ${error.message}`
  }
  return 'Could not read the board because of an unknown error.'
}
