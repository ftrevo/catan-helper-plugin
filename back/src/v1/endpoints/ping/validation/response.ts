import { z } from 'zod'

const status = z.literal('ok')

export const pingOptionsResponseSchema = z.object({
  status,
})

export type PingOptionsResponse = z.infer<typeof pingOptionsResponseSchema>

export const validateResponseObject = (result: PingOptionsResponse) => {
  return pingOptionsResponseSchema.parse(result)
}
