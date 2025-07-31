import { healthOptionsResponseSchema } from './validation/response'

export const healthOpenApiSpecs = {
  '/health': {
    get: {
      tags: ['Infra'],
      responses: {
        '200': {
          description: '200 OK',
          content: {
            'application/json': {
              schema: healthOptionsResponseSchema,
            },
          },
        },
        '500': {
          $ref: '#/components/schemas/500InternalError',
        },
      },
    },
  },
}
