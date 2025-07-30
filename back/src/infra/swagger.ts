import { createDocument, type ZodOpenApiObject } from 'zod-openapi'

import { openApiAppV1Paths } from '../v1'

import { errors } from './errors'

const options: ZodOpenApiObject = {
  openapi: '3.1.0',
  info: {
    title: 'backend',
    version: '1.0.0',
    description: 'catan-helper',
  },
  components: {
    responses: {
      ...errors,
    },
  },
  paths: {
    ...openApiAppV1Paths,
  },
}

export const swaggerSpecification: ReturnType<typeof createDocument> = createDocument(options)
