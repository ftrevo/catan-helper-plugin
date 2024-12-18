export const errors = {
  '400BadRequest': {
    description: 'Data validation error',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Invalid data received',
            },
          },
        },
      },
    },
  },
  '401NotAuthorized': {
    description: 'Not Authorized error',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Not Authorized error',
            },
          },
        },
      },
    },
  },
  '403Forbidden': {
    description: 'Forbidden error',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Forbidden error',
            },
          },
        },
      },
    },
  },
  '404NotFound': {
    description: 'Not Found error',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Not Found',
            },
          },
        },
      },
    },
  },
  '422UnprocessableEntity': {
    description: 'Unprocessable Entity error',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Business Error',
            },
          },
        },
      },
    },
  },
  '500InternalError': {
    description: 'Internal server error',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Internal Server Error',
            },
          },
        },
      },
    },
  },
} as const
