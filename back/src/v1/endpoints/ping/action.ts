import type { RequestHandler } from 'express'
import { pingCommand } from './commands/ping'
import { validateResponseObject } from './validation/response'

export const ping: RequestHandler = (_req, res, next) => {
  try {
    const result = pingCommand()

    const responseData = validateResponseObject(result)

    return res.status(200).json(responseData)
  } catch (error) {
    next(error)
  }
}
