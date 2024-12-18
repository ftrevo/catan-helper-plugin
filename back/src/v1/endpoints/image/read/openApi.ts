import { readImageRequestSchema, readImageResponseSchema } from './validation'

export const createUserOpenApiSpecs = {
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
          $ref: '#/components/responses/400BadRequest',
        },
        '500': {
          $ref: '#/components/responses/500InternalError',
        },
      },
    },
  },
}
