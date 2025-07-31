import type { RequestHandler } from 'express'
import { healthCommand } from './commands/health'
import { validateResponseObject } from './validation/response'

export const health: RequestHandler = (_req, res, next) => {
  try {
    const result = healthCommand()

    const responseData = validateResponseObject(result)

    return res.status(200).json(responseData)
  } catch (error) {
    next(error)
  }
}
