import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Rate limit configurations for different endpoint types
const rateLimitConfigs = {
  // Very strict for auth endpoints (prevent brute force)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts
    message: 'Too many authentication attempts. Try again in 15 minutes.',
  },
  // Strict for password reset (prevent abuse)
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 attempts
    message: 'Too many password reset requests. Try again in 1 hour.',
  },
  // Moderate for order creation (prevent spam orders)
  orders: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 orders
    message: 'Too many orders. Please wait a few minutes.',
  },
  // Moderate for check-in (prevent scanning abuse)
  checkin: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 check-ins per minute (1 per second)
    message: 'Too many check-in requests. Please slow down.',
  },
  // Lenient for general API calls
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests
    message: 'Too many requests. Please try again later.',
  },
  // Very lenient for public endpoints (event listing, etc.)
  public: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests
    message: 'Too many requests. Please try again later.',
  },
  // Strict for file uploads
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 uploads
    message: 'Upload limit reached. Try again later.',
  },
};

// Custom key generator to use user ID when authenticated
const keyGenerator = (req: Request): string => {
  // Use user ID if authenticated, otherwise use IP
  const userId = (req as any).user?.id;
  if (userId) {
    return `user:${userId}`;
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
};

// Standard headers configuration
const standardHeaders = true;
const legacyHeaders = false;

// Create rate limiters
export const authRateLimiter = rateLimit({
  ...rateLimitConfigs.auth,
  keyGenerator,
  standardHeaders,
  legacyHeaders,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: rateLimitConfigs.auth.message,
      retryAfter: Math.ceil(rateLimitConfigs.auth.windowMs / 1000),
    });
  },
});

export const passwordResetRateLimiter = rateLimit({
  ...rateLimitConfigs.passwordReset,
  keyGenerator,
  standardHeaders,
  legacyHeaders,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: rateLimitConfigs.passwordReset.message,
      retryAfter: Math.ceil(rateLimitConfigs.passwordReset.windowMs / 1000),
    });
  },
});

export const ordersRateLimiter = rateLimit({
  ...rateLimitConfigs.orders,
  keyGenerator,
  standardHeaders,
  legacyHeaders,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: rateLimitConfigs.orders.message,
      retryAfter: Math.ceil(rateLimitConfigs.orders.windowMs / 1000),
    });
  },
});

export const checkinRateLimiter = rateLimit({
  ...rateLimitConfigs.checkin,
  keyGenerator,
  standardHeaders,
  legacyHeaders,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: rateLimitConfigs.checkin.message,
      retryAfter: Math.ceil(rateLimitConfigs.checkin.windowMs / 1000),
    });
  },
});

export const generalRateLimiter = rateLimit({
  ...rateLimitConfigs.general,
  keyGenerator,
  standardHeaders,
  legacyHeaders,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: rateLimitConfigs.general.message,
      retryAfter: Math.ceil(rateLimitConfigs.general.windowMs / 1000),
    });
  },
});

export const publicRateLimiter = rateLimit({
  ...rateLimitConfigs.public,
  keyGenerator,
  standardHeaders,
  legacyHeaders,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: rateLimitConfigs.public.message,
      retryAfter: Math.ceil(rateLimitConfigs.public.windowMs / 1000),
    });
  },
});

export const uploadRateLimiter = rateLimit({
  ...rateLimitConfigs.upload,
  keyGenerator,
  standardHeaders,
  legacyHeaders,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: rateLimitConfigs.upload.message,
      retryAfter: Math.ceil(rateLimitConfigs.upload.windowMs / 1000),
    });
  },
});

// Export configs for reference
export { rateLimitConfigs };
