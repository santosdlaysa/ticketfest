import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

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
  next: NextFunction
) => {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Custom AppError
  if (err instanceof AppError) {
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
  }

  // Log unexpected errors
  console.error('❌ Unexpected error:', err);

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
