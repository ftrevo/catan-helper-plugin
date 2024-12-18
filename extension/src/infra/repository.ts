import type { ReadCreateData } from '../../typings/api'
import { HOST } from './utils'

const readImage = async (image: string) => {
  const response = await fetch(`${HOST}/image/read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image }),
  })

  console.log('response', response)

  if (!response.ok) {
    const body = await response.json()
    throw new Error(body?.message ?? `An error has occured: ${response.status}`)
  }

  return response.json() as Promise<ReadCreateData>
}

const readImageCb = async (image: string) => {
  return fetch(`${HOST}/image/read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image }),
  })
}

export { readImage, readImageCb }
