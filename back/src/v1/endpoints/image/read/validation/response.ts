import { z } from 'zod'

export const readImageResponseSchema = z.object({
  resources: z.array(z.string()).length(19),
  numbers: z.array(z.string()).length(19),
})

export type ReadImageResponseSchema = z.infer<typeof readImageResponseSchema>

export const validateResponseObject = (params: ReadImageResponseSchema) => {
  return readImageResponseSchema.parse(params)
}
