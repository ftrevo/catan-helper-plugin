import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const healthCheckReponseSchema = z.object({
  status: z.union([z.literal('ok'), z.literal('error')]),
  version: z.hash('sha1'),
})

export class HealthCheckResponseDto extends createZodDto(healthCheckReponseSchema) {}

export type HealthCheckResponseType = z.infer<typeof healthCheckReponseSchema>
