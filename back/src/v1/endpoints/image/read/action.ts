import type { NextFunction, Request, Response } from 'express'
import type { Commands } from '../setupCommands'
import { validateRequestParams, validateResponseObject } from './validation'

export const readImageAction =
  (readImageCommand: Commands['readImageCommand']) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = validateRequestParams(req.body)

      const result = await readImageCommand(data)

      const responseData = validateResponseObject(result)

      return res.status(201).json(responseData)
    } catch (error) {
      next(error)
    }
  }
