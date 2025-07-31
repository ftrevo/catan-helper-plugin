import { createServer } from 'http'

import { createApp } from './app'
import { loadConfigs } from './infra'

const shutDownSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT', 'uncaughtException'] as const

const start = async () => {
  const config = loadConfigs()

  const app = await createApp(config)

  const server = createServer(app)

  server.listen(config.PORT, () => {
    console.log(`Application is running at ${config.PORT}`)
  })

  return { server }
}

const main = async () => {
  const { server } = await start()

  shutDownSignals.forEach((signal) =>
    process.on(signal, async (err, origin) => {
      server.close(() => {
        console.log('HTTP server closed')
        console.error(err, origin)
      })
    })
  )

  process.on('unhandledRejection', (error) => {
    console.error('unhandledRejection', error)
  })
}

main().catch((error) => {
  console.error('Error during service initialization', error)
  process.exit(1)
})
