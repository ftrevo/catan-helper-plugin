import { readImageRequestSchema, readImageResponseSchema } from './validation'

export const readImageOpenApiSpecs = {
  '/image/read': {
    post: {
      tags: ['Image'],
      requestBody: {
        content: {
          'application/json': {
            schema: readImageRequestSchema,
          },
        },
      },
      responses: {
        '201': {
          description: '200 read process was sucessfuly',
          content: {
            'application/json': {
              schema: readImageResponseSchema,
            },
          },
        },
        '400': {
          $ref: '#/components/schemas/400BadRequest',
        },
        '500': {
          $ref: '#/components/schemas/500InternalError',
        },
      },
    },
  },
}
