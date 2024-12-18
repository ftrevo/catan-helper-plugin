import * as winston from 'winston'

export const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(winston.format.colorize(), winston.format.timestamp()),
    }),
  ],
})
