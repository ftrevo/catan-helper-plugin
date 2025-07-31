import { transports, format, createLogger } from 'winston'

export const logger = createLogger({
  transports: [
    new transports.Console({
      level: 'debug',
      format: format.combine(format.timestamp(), format.json()),
    }),
  ],
})
