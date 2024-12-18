export class Forbidden extends Error {
  constructor(message: string) {
    super(message)
  }

  status = 403 as const
}
