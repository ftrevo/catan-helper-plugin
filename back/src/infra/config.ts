import dotenv from 'dotenv'
import { z } from 'zod'

const configSchema = z.object({
  NODE_ENV: z.union([z.literal('development'), z.literal('test'), z.literal('production')]),
  PORT: z.coerce.number().int().gt(0),
})

const getOnProd = () => ({
  NODE_ENV: 'production',
  PORT: process.env.PORT,
})

export const loadConfigs = () => {
  let rawConfigs

  if (process.env.NODE_ENV === 'production') {
    rawConfigs = getOnProd()
  } else {
    rawConfigs = dotenv.config().parsed
  }

  return configSchema.parse(rawConfigs)
}

export type Config = ReturnType<typeof loadConfigs>
