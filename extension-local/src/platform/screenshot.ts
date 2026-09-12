export class NotColonistTabError extends Error {
  constructor() {
    super('The active tab is not a colonist.io game')
    this.name = 'NotColonistTabError'
  }
}

export class CaptureError extends Error {
  constructor(cause: unknown) {
    super('Chrome could not capture the current tab', { cause })
    this.name = 'CaptureError'
  }
}

export const isColonistUrl = (url: string): boolean => {
  try {
    const { hostname } = new URL(url)
    return hostname === 'colonist.io' || hostname.endsWith('.colonist.io')
  } catch {
    return false
  }
}

/**
 * Captures the active tab as a PNG data URL. Relies on the `activeTab` permission, which Chrome grants
 * for the current tab when the user opens the popup, so no host permissions are needed.
 */
export const captureActiveTab = async (): Promise<string> => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  if (!tab?.url || !isColonistUrl(tab.url)) throw new NotColonistTabError()

  try {
    return await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' })
  } catch (cause) {
    throw new CaptureError(cause)
  }
}
