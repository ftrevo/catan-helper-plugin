import { AsyncLocalStorage } from 'async_hooks'
import type { NextFunction } from 'express'
import type { Logger } from 'winston'

type Store = {
  logger: Logger
  correlationId: string
}

const asyncLocalStorage = new AsyncLocalStorage()

export const getStore = () => {
  return asyncLocalStorage.getStore() as Store
}

export const createStore = (store: Store, next: NextFunction | ((err?: Error) => void)) => {
  asyncLocalStorage.run(store, () => {
    next()
  })
}
