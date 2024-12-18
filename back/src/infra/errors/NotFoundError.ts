export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
  }

  status = 404 as const
}
