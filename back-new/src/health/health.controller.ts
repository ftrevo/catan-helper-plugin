import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Controller, Get, HttpStatus } from '@nestjs/common'
import { HealthCheckResponseDto } from './response.dto'
import { ZodResponse } from 'nestjs-zod'
import { execSync } from 'node:child_process'

const gitCommand = 'git rev-parse HEAD'

@ApiTags('Health Check')
@Controller()
export class HealthController {
  gitHash: string
  constructor() {
    this.gitHash = execSync(gitCommand).toString().trim()
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
      version: this.gitHash,
    }
  }
}
