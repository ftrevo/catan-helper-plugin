import { z } from 'zod'

const status = z.literal('ok')

export const healthOptionsResponseSchema = z.object({
  status,
})

export type HealthOptionsResponse = z.infer<typeof healthOptionsResponseSchema>

export const validateResponseObject = (result: HealthOptionsResponse) => {
  return healthOptionsResponseSchema.parse(result)
}
