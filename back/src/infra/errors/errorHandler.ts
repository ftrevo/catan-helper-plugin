import { Logger } from 'winston'
import { z } from 'zod'
import { fromZodError } from 'zod-validation-error'

export const errorHandler = (error: any, logger: Logger) => {
  if (error.status && error.message) {
    logger.info(error.message)

    return error
  }

  if (error instanceof z.ZodError) {
    const { message } = fromZodError(error)
    logger.info(message)

    return { message, status: 400 }
  }

  logger.error(error)
  return { message: 'Internal server error', status: 500 }
}
