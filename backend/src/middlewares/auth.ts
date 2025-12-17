import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError(401, 'Authentication token required');
  }

  const [bearer, token] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !token) {
    throw new AppError(401, 'Invalid authentication token format');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'Token expired');
    }
    throw new AppError(401, 'Invalid token');
  }
};

// Optional authentication - populates req.user if token is valid, but doesn't block the request
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  const [bearer, token] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    // Token invalid or expired, continue without user
  }

  next();
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'Insufficient permissions');
    }

    next();
  };
};
