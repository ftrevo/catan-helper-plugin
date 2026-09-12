/** True when running as an installed extension; false in the Vite dev server and in tests. */
export const isExtensionRuntime = (): boolean =>
  typeof chrome !== 'undefined' && typeof chrome.tabs?.captureVisibleTab === 'function'

/** Resolves a path inside the extension package (or the dev server root) to a fetchable URL. */
export const assetUrl = (path: string): string =>
  typeof chrome !== 'undefined' && chrome.runtime?.getURL
    ? chrome.runtime.getURL(path)
    : new URL(path, document.baseURI).href
