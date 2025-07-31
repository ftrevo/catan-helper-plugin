import cors from 'cors'

import type { Config } from '../infra'

export const createCorsMiddleware = (config: Config) => {
  return cors({
    origin: config.CORS_ORIGIN ? [config.CORS_ORIGIN] : '*',
    methods: ['GET', 'POST', 'PATCH', 'HEAD', 'OPTIONS', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Accept'],
  })
}
