import { AsyncLocalStorage } from 'async_hooks'
import type { NextFunction } from 'express'
import type { Logger } from 'winston'

type Store = {
  logger: Logger
  correlationId: string
}

const asyncLocalStorage = new AsyncLocalStorage<Store>()

export const getStore = () => {
  const store = asyncLocalStorage.getStore()

  if (!store) {
    throw new Error(
      'AsyncLocalStorage store is not initialized. Ensure createStore is called before accessing the store.'
    )
  }

  return store
}

export const createStore = (store: Store, next: NextFunction | ((err?: Error) => void)) => {
  asyncLocalStorage.run(store, () => {
    next()
  })
}
