import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { validate, registerSchema, loginSchema } from '../utils/validation.js';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    const data = validate(registerSchema)(req.body);
    const result = await authService.register(data);

    res.status(201).json(result);
  }

  async login(req: Request, res: Response) {
    const data = validate(loginSchema)(req.body);
    const result = await authService.login(data);

    res.status(200).json(result);
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
}
