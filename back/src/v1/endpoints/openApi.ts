import { pingOpenApiSpecs } from './ping'
import { userOpenApiSpecs } from './image'

export const openApiAppV1Paths = {
  ...pingOpenApiSpecs,
  ...userOpenApiSpecs,
}
