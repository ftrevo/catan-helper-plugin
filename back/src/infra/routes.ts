import { Router } from 'express'
import * as swaggerUi from 'swagger-ui-express'

import { swaggerSpecification } from './swagger'

export const defineInfraRoutes = () => {
  const router = Router()

  router.use('/docs', swaggerUi.serve)
  router.get('/docs', swaggerUi.setup(swaggerSpecification))
  router.get('/docs/swagger.json', (_req, res) => res.json(swaggerSpecification))

  return router
}
