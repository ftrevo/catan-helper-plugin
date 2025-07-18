import type { ReadCreateData } from '../../typings/api'

const HOST = 'http://localhost:3300'

const readImage = async (image: string) => {
  try {
    const response = await fetch(`${HOST}/image/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image }),
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

// TODO: Not tested yet
export const captureAndProcessScreenshot = (): ReturnType<typeof readImage> => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'capturePage' }, async (params: { error: any; data: string }) => {
      if (params.error) {
        console.error('Error capturing image', params.error)
        return resolve({
          error: {
            message: (params.error as string) || 'Failed to capture screenshot',
            status: 500,
          },
        })
      }

      const result = await readImage(params.data)
      return resolve(result)
    })
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
