import { writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { HttpAdapterHost, NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { Logger } from 'nestjs-pino'
import { cleanupOpenApiDoc } from 'nestjs-zod'
import { AppModule } from './app.module'

import { logBlocklist } from './constants'
import { ExceptionsFilter } from './lib/exception-filter'
import { json } from 'express'
import { INestApplication } from '@nestjs/common'

async function setupSwagger(app: INestApplication) {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Catan helper')
    .setDescription('Catan helper API')
    .setVersion('1.0.0')
    .build()

  const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig)
  const document = cleanupOpenApiDoc(documentFactory())

  SwaggerModule.setup('docs', app, document)

  const name = 'swagger.json'
  const path = process.cwd()

  await writeFile(resolve(join(path, name)), JSON.stringify(document, null, 2), 'utf-8')
    .then(() => process.stdout.write(`Swagger file written to ${name} at ${path}\n`))
    .catch((e) => process.stderr.write(`Could not write swagger file to ${path}: ${e}\n`))
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule.forRoot())

  const { httpAdapter } = app.get(HttpAdapterHost)

  app.useLogger(app.get(Logger))
  app.useGlobalFilters(new ExceptionsFilter(httpAdapter))
  app.use(json({ limit: '5mb' }))
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  app.getHttpAdapter().getInstance().disable('x-powered-by')
  app.enableShutdownHooks()

  await setupSwagger(app)
  await app.listen(process.env.PORT ?? 3000)
}

bootstrap()
