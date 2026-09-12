export class BoardNotFoundError extends Error {
  constructor(readonly detail: string) {
    super(`Could not find the Catan board in the screenshot (${detail})`)
    this.name = 'BoardNotFoundError'
  }
}

export class ModelLoadError extends Error {
  constructor(modelName: string, cause: unknown) {
    super(`Could not load the ${modelName} model`, { cause })
    this.name = 'ModelLoadError'
  }
}
