import { pingOpenApiSpecs } from './ping'
import { imageOpenApiSpecs } from './image'

export const openApiAppV1Paths = {
  ...pingOpenApiSpecs,
  ...imageOpenApiSpecs,
}
