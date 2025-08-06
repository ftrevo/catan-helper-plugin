import type { ReadCreateData } from '../../typings/api'

const API_HOST = process.env.REACT_APP_API_HOST

type TabSize = { height?: number; width?: number }

const readImage = async (image: string, tabSize: TabSize) => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

    const response = await fetch(`${API_HOST}/image/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image, tabSize }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json()
      return {
        error: {
          message: errorData?.message || `An error has occurred: ${response.status}`,
          status: response.status,
        },
      }
    }

    const data = (await response.json()) as ReadCreateData
    return { data }
  } catch (error) {
    // FIXME: Handle error properly and send it to a logging service
    console.error('Error reading image:', error)

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        error: {
          message: 'Request timeout - backend server may be unavailable',
          status: 408,
        },
      }
    }

    return {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 500,
      },
    }
  }
}

type TabInfo = { height?: number; url?: string; width?: number; windowId: number }

export const captureAndProcessScreenshot = (tabInfo: TabInfo): ReturnType<typeof readImage> => {
  return new Promise((resolve) => {
    chrome.runtime?.sendMessage(
      { action: 'captureBoardImage', tabInfo },
      async (params: { error: any; data: string }) => {
        if (params.error) {
          console.error('Error capturing image', JSON.stringify(params.error))
          return resolve({
            error: {
              message: (params.error as string) ?? 'Failed to capture screenshot',
              status: 500,
            },
          })
        }

        const result = await readImage(params.data, {
          height: tabInfo.height,
          width: tabInfo.width,
        })

        return resolve(result)
      }
    )
  })
}
