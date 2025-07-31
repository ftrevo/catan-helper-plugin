import type { NextFunction, Request, Response } from 'express'
import { getStore } from '../infra'

export const createLogRequestMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.url?.startsWith('/health') && !req.url?.startsWith('/docs')) {
    const { logger } = getStore()

    logger.info('Request received', { method: req.method, path: req.path })
  }

  next()
}
