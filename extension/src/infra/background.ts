chrome.runtime.onMessage.addListener((request, sender, callback) => {
  if (request.action === 'capturePage') {
    chrome.tabs.captureVisibleTab(null as any, { format: 'png' }, (dataUrl: string) => {
      if (chrome.runtime.lastError) {
        callback({ error: chrome.runtime.lastError })
        return
      }

      callback({ error: null, data: dataUrl })
      return
    })
    return true // to allow async response
  }
})
