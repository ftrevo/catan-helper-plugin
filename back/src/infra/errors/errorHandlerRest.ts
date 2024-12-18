import type { ErrorRequestHandler } from 'express'

import { getStore } from '../asyncStore'
import { errorHandler } from './errorHandler'

export const errorHandlerRest: ErrorRequestHandler = (error, _req, res, _next) => {
  const { logger } = getStore()

  const { status, message } = errorHandler(error, logger)

  return res.status(status).json({ message })
}
