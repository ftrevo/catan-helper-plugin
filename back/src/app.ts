import express from 'express'
import helmet from 'helmet'

import { createLogRequestMiddleware, createStoreRestMiddleware, createCorsMiddleware } from './middlewares'

import { type Config, defineInfraRoutes, errorHandlerRest } from './infra'

import { v1Routes } from './v1'

export const createApp = async (config: Config) => {
  const app = express()

  app.use(createCorsMiddleware(config))
  app.use(createStoreRestMiddleware)
  app.use(createLogRequestMiddleware)

  app.use(express.json({ limit: '5mb' }))
  app.use(helmet())

  app.use(defineInfraRoutes(config))
  app.use(v1Routes())

  app.use(errorHandlerRest)

  return app
}
