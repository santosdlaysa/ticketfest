import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import Sentry from '../config/sentry.js';
import logger from '../config/logger.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Zod validation errors
  if (err instanceof ZodError) {
    // Erros de validação não são enviados ao Sentry (são erros do cliente)
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    // Return the first error message as main error for better UX
    const mainError = details[0]?.message || 'Erro de validação';
    return res.status(400).json({
      error: mainError,
      details,
    });
  }

  // Custom AppError
  if (err instanceof AppError) {
    // Apenas captura no Sentry erros operacionais críticos (>= 500)
    if (err.statusCode >= 500) {
      Sentry.captureException(err, {
        tags: {
          errorType: 'AppError',
          statusCode: err.statusCode.toString(),
        },
        level: 'error',
        extra: {
          isOperational: err.isOperational,
          url: req.url,
          method: req.method,
        },
      });
    }

    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // PostgreSQL errors (pg driver)
  const pgError = err as any;
  if (pgError.code) {
    // Unique constraint violation
    if (pgError.code === '23505') {
      const match = pgError.detail?.match(/Key \((\w+)\)/);
      return res.status(409).json({
        error: 'Resource already exists',
        field: match ? match[1] : undefined,
      });
    }

    // Foreign key violation
    if (pgError.code === '23503') {
      return res.status(400).json({
        error: 'Referenced resource not found',
      });
    }

    // Not null violation
    if (pgError.code === '23502') {
      return res.status(400).json({
        error: `Missing required field: ${pgError.column}`,
      });
    }

    // Outros erros do PostgreSQL são críticos
    Sentry.captureException(err, {
      tags: {
        errorType: 'PostgreSQL',
        pgCode: pgError.code,
      },
      level: 'error',
      extra: {
        detail: pgError.detail,
        hint: pgError.hint,
        url: req.url,
        method: req.method,
      },
    });
  }

  // Log unexpected errors
  logger.error('Unexpected error', {
    type: 'error',
    message: err.message,
    stack: err.stack,
  });

  // Captura erros inesperados no Sentry
  Sentry.captureException(err, {
    tags: {
      errorType: 'UnexpectedError',
    },
    level: 'error',
    extra: {
      url: req.url,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params,
    },
  });

  // Default error response
  return res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
};

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    error: `Route ${req.originalUrl} not found`,
  });
};
