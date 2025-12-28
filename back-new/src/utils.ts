import { productiveEnvs } from './constants'

export const isDevelopmentEnv = () => process.env.ENVIRONMENT === 'development'
export const isStagingOrProductionEnv = () => productiveEnvs.includes(`${process.env.ENVIRONMENT}`)
