import { Router } from 'express'
import * as swaggerUi from 'swagger-ui-express'

import { swaggerSpecification } from './swagger'

export const defineInfraRoutes = () => {
  const router = Router()

  router.use('/api-docs', swaggerUi.serve)
  router.get('/api-docs', swaggerUi.setup(swaggerSpecification))
  router.get('/api-docs/swagger.json', (_req, res) => res.json(swaggerSpecification))

  return router
}
