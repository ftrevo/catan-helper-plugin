import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const readImageResponseSchema = z.object({
  resources: z.array(z.string()).length(19),
  numbers: z.array(z.string()).length(19),
})

export class ReadImageResponseDto extends createZodDto(readImageResponseSchema) {}

export type ReadImageResponseType = z.infer<typeof readImageResponseSchema>
