import { z } from 'zod'

export const readImageRequestSchema = z.object({
  image: z.string().min(1),
  tabSize: z
    .object({
      height: z.number().optional(),
      width: z.number().optional(),
    })
    .optional(),
})

export type ReadImageRequestParams = z.infer<typeof readImageRequestSchema>

export const validateRequestParams = (params: ReadImageRequestParams) => {
  return readImageRequestSchema.parse(params)
}
