import winston from 'winston';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');

// Custom format for timestamps
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}\n${stack}`;
    }
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      ),
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write errors to error.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Helper functions to maintain existing log format
export const log = {
  info: (message: string, data?: any) => {
    const msg = data ? `${message} ${JSON.stringify(data, null, 2)}` : message;
    logger.info(msg);
  },
  error: (message: string, error?: any) => {
    const msg = error instanceof Error 
      ? `${message} ${error.message}` 
      : error 
        ? `${message} ${JSON.stringify(error, null, 2)}` 
        : message;
    logger.error(msg, { stack: error?.stack });
  },
  warn: (message: string, data?: any) => {
    const msg = data ? `${message} ${JSON.stringify(data, null, 2)}` : message;
    logger.warn(msg);
  },
  debug: (message: string, data?: any) => {
    const msg = data ? `${message} ${JSON.stringify(data, null, 2)}` : message;
    logger.debug(msg);
  },
};
