import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import logger from '../config/logger.js';

/**
 * CSRF Protection Middleware
 *
 * For REST APIs using JWT tokens (not cookies), traditional CSRF attacks are mitigated
 * because the token must be explicitly included in requests.
 *
 * However, we add additional protection by:
 * 1. Checking Origin/Referer headers on state-changing requests
 * 2. Requiring a custom header (X-Requested-With) for sensitive operations
 */

const ALLOWED_ORIGINS = [
  env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
].filter(Boolean);

// Check if the request origin is allowed
const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // Allow requests without origin (mobile apps, etc.)
  return ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed as string));
};

/**
 * Basic CSRF protection for state-changing requests
 * Verifies Origin header matches allowed origins
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Only check state-changing methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const origin = req.get('Origin');
  const referer = req.get('Referer');

  // In development, allow all requests
  if (env.NODE_ENV === 'development') {
    return next();
  }

  // Check origin header
  if (origin && !isOriginAllowed(origin)) {
    logger.warn('CSRF: Invalid origin', {
      type: 'security',
      issue: 'csrf_origin',
      origin,
      path: req.path,
      ip: req.ip,
    });

    return res.status(403).json({
      error: 'Request origin not allowed',
    });
  }

  // If no origin, check referer
  if (!origin && referer) {
    const refererOrigin = new URL(referer).origin;
    if (!isOriginAllowed(refererOrigin)) {
      logger.warn('CSRF: Invalid referer', {
        type: 'security',
        issue: 'csrf_referer',
        referer,
        path: req.path,
        ip: req.ip,
      });

      return res.status(403).json({
        error: 'Request referer not allowed',
      });
    }
  }

  next();
};

/**
 * Strict CSRF protection requiring custom header
 * Use for sensitive operations (password change, payment, etc.)
 */
export const strictCsrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // First apply basic protection
  const origin = req.get('Origin');

  if (env.NODE_ENV !== 'development') {
    if (origin && !isOriginAllowed(origin)) {
      return res.status(403).json({
        error: 'Request origin not allowed',
      });
    }
  }

  // Require custom header to prevent simple cross-origin requests
  const customHeader = req.get('X-Requested-With');
  if (!customHeader || customHeader !== 'XMLHttpRequest') {
    // Allow if it's a mobile request (no origin, has authorization)
    if (!origin && req.get('Authorization')) {
      return next();
    }

    // In development, just log warning
    if (env.NODE_ENV === 'development') {
      return next();
    }

    logger.warn('CSRF: Missing X-Requested-With header', {
      type: 'security',
      issue: 'csrf_header',
      path: req.path,
      ip: req.ip,
    });

    return res.status(403).json({
      error: 'Missing required security header',
    });
  }

  next();
};

/**
 * Double-submit cookie pattern (optional, for web clients)
 * Generates a CSRF token that must be sent back in a header
 */
export const generateCsrfToken = (): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

export const csrfTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Set CSRF token cookie for web clients
  if (!req.cookies?.csrfToken) {
    const token = generateCsrfToken();
    res.cookie('csrfToken', token, {
      httpOnly: false, // Must be readable by JavaScript
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  }
  next();
};
