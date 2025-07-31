import { healthOpenApiSpecs } from './health'
import { imageOpenApiSpecs } from './image'

export const openApiAppV1Paths = {
  ...healthOpenApiSpecs,
  ...imageOpenApiSpecs,
}
