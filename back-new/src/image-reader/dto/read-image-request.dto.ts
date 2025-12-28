import { createZodDto } from 'nestjs-zod'
import { gameScreen } from './image-example'
import { z } from 'zod'

export const readImageRequestSchema = z.object({
  image: z.string().min(1).meta({
    example: gameScreen,
  }),
  tabSize: z
    .object({
      height: z.number().optional(),
      width: z.number().optional(),
    })
    .optional(),
})

export class ReadImageRequestDto extends createZodDto(readImageRequestSchema) {}

export type ReadImageRequestType = z.infer<typeof readImageRequestSchema>
