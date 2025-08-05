type Request = { windowId: number; action: 'captureBoardImage' }

chrome.runtime?.onMessage.addListener((message: Request, _sender, callback) => {
  if (message.action === 'captureBoardImage') {
    chrome.tabs.captureVisibleTab(message.windowId, { format: 'png' }, (dataUrl: string) => {
      callback({ error: chrome.runtime?.lastError, data: dataUrl })
    })
    return true // to allow async response
  }
})

export {}
