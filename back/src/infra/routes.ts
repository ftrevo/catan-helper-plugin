import { Router } from 'express'
import * as swaggerUi from 'swagger-ui-express'

import { swaggerSpecification } from './swagger'
import type { Config } from './config'

export const defineInfraRoutes = (config: Config) => {
  const router = Router()

  if (config.NODE_ENV === 'production') {
    return router
  }

  router.use('/docs', swaggerUi.serve)
  router.get('/docs', swaggerUi.setup(swaggerSpecification))
  router.get('/docs/swagger.json', (_req, res) => res.json(swaggerSpecification))

  return router
}
