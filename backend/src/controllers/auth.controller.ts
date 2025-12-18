import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { validate, registerSchema, loginSchema } from '../utils/validation.js';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = validate(registerSchema)(req.body);
      const result = await authService.register(data);
      res.status(201).json(result);
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
      res.status(200).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const result = await authService.refreshToken(refreshToken);
    res.status(200).json(result);
  }

  async logout(req: Request, res: Response) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const result = await authService.logout(refreshToken);
    res.status(200).json(result);
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
      res.status(200).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  async verifyResetToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ error: 'Token é obrigatório' });
      }

      const result = await authService.verifyResetToken(token);
      res.status(200).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
      }

      const result = await authService.resetPassword(token, password);
      res.status(200).json(result);
    } catch (error: any) {
      next(error);
    }
  }
}
