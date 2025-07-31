import { Router } from 'express'
import { health } from './endpoints'
import { setupImageActions } from './endpoints'

export const v1Routes = () => {
  const router = Router()

  const actions = setupImageActions()

  router.get('/health', health)

  router.post('/image/read', actions.readImage)

  return router
}
