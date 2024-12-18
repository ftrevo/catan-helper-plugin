import { Router } from 'express'
import { ping } from './endpoints'
import { setupImageActions } from './endpoints'

export const v1Routes = () => {
  const router = Router()

  const actions = setupImageActions()

  router.get('/', ping)

  router.post('/image/read', actions.readImage)

  return router
}
