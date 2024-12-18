export class NotAuthorized extends Error {
  constructor(message: string) {
    super(message)
  }

  status = 401 as const
}
