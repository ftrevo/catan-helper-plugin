import { Catch, type ArgumentsHost, Logger, HttpException, HttpStatus } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'

@Catch()
export class ExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(ExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof HttpException) {
      this.logger.warn({
        msg: exception.message,
        extraContext: {
          exception,
          statusCode: exception.getStatus(),
        },
      })
    } else {
      this.logger.error({
        msg: 'Unhandled exception',
        extraContext: {
          exception,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
      })
    }

    super.catch(exception, host)
  }
}
