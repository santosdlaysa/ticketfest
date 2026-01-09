import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { validate, registerSchema } from '../utils/validation.js';
import { env } from '../config/env.js';

const authService = new AuthService();

// Cookie configuration
const isProduction = env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProduction, // Only send over HTTPS in production
  sameSite: isProduction ? 'none' as const : 'lax' as const, // 'none' required for cross-origin cookies
  path: '/',
};

// Helper to set auth cookies
const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  // Access token - short lived (15 minutes)
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Refresh token - longer lived (7 days)
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Helper to clear auth cookies
const clearAuthCookies = (res: Response) => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
};

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = validate(registerSchema)(req.body);
      const result = await authService.register(data);

      // Set httpOnly cookies
      setAuthCookies(res, result.accessToken, result.refreshToken);

      // Return user info (tokens are in cookies, not in response body for security)
      res.status(201).json({
        user: result.user,
        accessToken: result.accessToken, // Keep for backwards compatibility
        refreshToken: result.refreshToken, // Keep for backwards compatibility
      });
    } catch (error: any) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await authService.login({ email, password });

      // Set httpOnly cookies
      setAuthCookies(res, result.accessToken, result.refreshToken);

      // Return user info (tokens are in cookies, not in response body for security)
      return res.status(200).json({
        user: result.user,
        accessToken: result.accessToken, // Keep for backwards compatibility
        refreshToken: result.refreshToken, // Keep for backwards compatibility
      });
    } catch (error: any) {
      return next(error);
    }
  }

  async refreshToken(req: Request, res: Response) {
    // Try to get refresh token from cookie first, then from body
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    try {
      const result = await authService.refreshToken(refreshToken);

      // Set new access token cookie
      res.cookie('accessToken', result.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      return res.status(200).json(result);
    } catch (error: any) {
      // Clear cookies on refresh failure
      clearAuthCookies(res);
      return res.status(401).json({ error: error.message || 'Invalid refresh token' });
    }
  }

  async logout(req: Request, res: Response) {
    // Try to get refresh token from cookie first, then from body
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch (error) {
        // Ignore logout errors - we still want to clear cookies
        console.error('Logout error:', error);
      }
    }

    // Always clear cookies
    clearAuthCookies(res);

    res.status(200).json({ message: 'Logged out successfully' });
  }

  async getProfile(req: Request, res: Response) {
    const userId = req.user!.id;
    const user = await authService.getProfile(userId);

    res.status(200).json(user);
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }

      const result = await authService.forgotPassword(email);
      return res.status(200).json(result);
    } catch (error: any) {
      return next(error);
    }
  }

  async verifyResetToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ error: 'Token é obrigatório' });
      }

      const result = await authService.verifyResetToken(token);
      return res.status(200).json(result);
    } catch (error: any) {
      return next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
      }

      const result = await authService.resetPassword(token, password);
      return res.status(200).json(result);
    } catch (error: any) {
      return next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { name, phone, cpf } = req.body;

      const result = await authService.updateProfile(userId, { name, phone, cpf });
      res.status(200).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
      }

      const result = await authService.changePassword(userId, currentPassword, newPassword);
      return res.status(200).json(result);
    } catch (error: any) {
      return next(error);
    }
  }
}
