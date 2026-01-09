import winston from 'winston';
import { env } from './env.js';

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} ${level}: ${message} ${metaStr}`;
  })
);

// JSON format for production logs
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: jsonFormat,
  defaultMeta: { service: 'lumera-api' },
  transports: [
    // Write errors to separate file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs to combined file
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in development
if (env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
} else {
  // In production, also log to console with JSON format for log aggregators
  logger.add(
    new winston.transports.Console({
      format: jsonFormat,
    })
  );
}

// Create child loggers for different modules
export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};

// Predefined loggers for common modules
export const authLogger = createModuleLogger('auth');
export const orderLogger = createModuleLogger('orders');
export const paymentLogger = createModuleLogger('payments');
export const checkinLogger = createModuleLogger('checkin');
export const emailLogger = createModuleLogger('email');
export const dbLogger = createModuleLogger('database');

// Helper functions for structured logging
export const logRequest = (req: {
  method: string;
  path: string;
  ip?: string;
  userId?: string;
}) => {
  logger.info('Request received', {
    type: 'request',
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.userId,
  });
};

export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error(error.message, {
    type: 'error',
    stack: error.stack,
    ...context,
  });
};

export const logPayment = (
  action: string,
  data: {
    orderId?: string;
    amount?: number;
    method?: string;
    status?: string;
    [key: string]: any;
  }
) => {
  paymentLogger.info(action, {
    type: 'payment',
    ...data,
  });
};

export const logCheckin = (
  action: string,
  data: {
    eventId?: string;
    ticketId?: string;
    success?: boolean;
    [key: string]: any;
  }
) => {
  checkinLogger.info(action, {
    type: 'checkin',
    ...data,
  });
};

export default logger;
