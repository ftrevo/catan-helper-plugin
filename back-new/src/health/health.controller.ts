import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Controller, Get, HttpStatus, Logger } from '@nestjs/common'
import { HealthCheckResponseDto } from './response.dto'
import { ZodResponse } from 'nestjs-zod'
import { execSync } from 'node:child_process'

const gitCommand = 'git rev-parse HEAD'

const resolveVersion = (logger: Logger): string => {
  if (process.env.GIT_COMMIT) {
    return process.env.GIT_COMMIT
  }

  try {
    return execSync(gitCommand, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    logger.warn('Could not resolve git commit hash; set GIT_COMMIT to expose it on /health')
    return 'unknown'
  }
}

@ApiTags('Health Check')
@Controller()
export class HealthController {
  private readonly logger = new Logger(HealthController.name)
  private readonly version: string

  constructor() {
    this.version = resolveVersion(this.logger)
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health Check',
    description: 'Performs a health check of the application',
  })
  @ZodResponse({
    description: 'Health check successful.',
    status: HttpStatus.OK,
    type: HealthCheckResponseDto,
  })
  @ApiResponse({ status: HttpStatus.SERVICE_UNAVAILABLE, description: 'Health check failed.' })
  check() {
    return {
      status: 'ok' as const,
      version: this.version,
    }
  }
}
