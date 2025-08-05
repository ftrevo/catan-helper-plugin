import type { ReadCreateData } from '../../typings/api'

const HOST = 'http://localhost:3500'

type TabSize = { height?: number; width?: number }

const readImage = async (image: string, tabSize: TabSize) => {
  try {
    const response = await fetch(`${HOST}/image/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image, tabSize }),
    })

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
    console.error('Error reading image:', error)
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

export const readImageCb = async (image: string) => {
  return fetch(`${HOST}/image/read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image }),
  })
}
