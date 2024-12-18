export class BusinessError extends Error {
  constructor(message: string) {
    super(message)
  }

  status = 422 as const
}
