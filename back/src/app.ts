import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import { createStoreRestMiddleware } from './middlewares'

import { defineInfraRoutes, errorHandlerRest } from './infra'

import { v1Routes } from './v1'

export const createApp = async () => {
  const app = express()

  app.use((req, res, next) => {
    console.log(new Date().toISOString(), req.method, req.path)
    next()
  })
  app.use(createStoreRestMiddleware)

  app.use(express.json({ limit: '5mb' }))
  app.use(
    cors({
      credentials: true,
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'HEAD', 'OPTIONS'],
    })
  )
  app.use(helmet())

  app.use(defineInfraRoutes())
  app.use(v1Routes())

  app.use(errorHandlerRest)

  return app
}
