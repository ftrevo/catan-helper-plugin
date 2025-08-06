import type { ReadCreateData } from '../../typings/api'

const mockData: ReadCreateData = {
  numbers: ['8', '10', '5', '4', '3', '9', '2', '11', '7', '11', '5', '6', '12', '10', '4', '3', '9', '6', '8'],
  resources: [
    'wool',
    'stone',
    'wool',
    'brick',
    'brick',
    'wool',
    'stone',
    'grain',
    'desert',
    'lumber',
    'grain',
    'stone',
    'brick',
    'wool',
    'grain',
    'lumber',
    'lumber',
    'grain',
    'lumber',
  ],
}

export const setMockData = async (setData: (data: ReadCreateData) => void, setLoading: (loading: boolean) => void) => {
  setLoading(true)
  await new Promise((resolve) => setTimeout(resolve, 2000))
  setData(mockData)
  setLoading(false)
}
