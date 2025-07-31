import { pingOptionsResponseSchema } from './validation/response'

export const pingOpenApiSpecs = {
  '/': {
    get: {
      tags: ['Infra'],
      responses: {
        '200': {
          description: '200 OK',
          content: {
            'application/json': {
              schema: pingOptionsResponseSchema,
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
