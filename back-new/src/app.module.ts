import { type DynamicModule, Module } from '@nestjs/common'
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { LoggerModule } from 'nestjs-pino'
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod'
import { logBlocklist } from './constants'
import { ImageReaderModule } from './image-reader/image-reader.module'
import { isDevelopmentEnv } from './utils'
import { HealthModule } from './health/health.module'

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: {
          ignore: (req) => logBlocklist.includes(req.url ?? ''),
        },
        ...(isDevelopmentEnv()
          ? {
              level: 'debug',
              transport: {
                target: 'pino-pretty',
                options: {
                  ignore: 'env,req',
                  translateTime: 'SYS:standard',
                },
              },
            }
          : { level: 'warn' }),
      },
    }),
    ImageReaderModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
  ],
})

// biome-ignore lint/complexity/noStaticOnlyClass: this is a NestJS module
export class AppModule {
  static forRoot(): DynamicModule {
    return {
      module: AppModule,
      imports: [],
    }
  }
}
