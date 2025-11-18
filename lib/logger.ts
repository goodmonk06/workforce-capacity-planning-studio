import pino from 'pino'

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard',
        },
      }
    : undefined,
})

export function createLogger(context: string) {
  return logger.child({ context })
}

// Typed log functions for specific use cases
export const apiLogger = createLogger('api')
export const dbLogger = createLogger('database')
export const simulationLogger = createLogger('simulation')
export const seedLogger = createLogger('seed')
