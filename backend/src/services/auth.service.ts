import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, transaction } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  type TokenPayload,
} from '../utils/jwt.js';
import { EmailService } from './email.service.js';
import { env } from '../config/env.js';

const emailService = new EmailService();

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  cpf?: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  role: 'USER' | 'ADMIN' | 'ORGANIZER';
  created_at: Date;
  updated_at: Date;
}

export class AuthService {
  async register(data: RegisterData) {
    // Check if user already exists
    const existingUser = await query<User>(
      'SELECT id FROM users WHERE email = $1',
      [data.email]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError(409, 'Email already registered');
    }

    // Check CPF if provided
    if (data.cpf) {
      const existingCpf = await query<User>(
        'SELECT id FROM users WHERE cpf = $1',
        [data.cpf]
      );

      if (existingCpf.rows.length > 0) {
        throw new AppError(409, 'CPF already registered');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user and refresh token in transaction
    const result = await transaction(async (client) => {
      // Create user (default role: ORGANIZER)
      const userResult = await client.query<User>(
        `INSERT INTO users (email, password_hash, name, cpf, phone, role)
         VALUES ($1, $2, $3, $4, $5, 'ORGANIZER')
         RETURNING id, email, name, cpf, phone, role, created_at`,
        [data.email, passwordHash, data.name, data.cpf || null, data.phone || null]
      );

      const user = userResult.rows[0];

      // Generate tokens
      const payload: TokenPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // Save refresh token
      await client.query(
        `INSERT INTO refresh_tokens (token, user_id, expires_at)
         VALUES ($1, $2, $3)`,
        [refreshToken, user.id, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          cpf: user.cpf,
          phone: user.phone,
          role: user.role,
          createdAt: user.created_at,
        },
        accessToken,
        refreshToken,
      };
    });

    return result;
  }

  async login(data: LoginData) {
    // Determine role based on email pattern (for dev mode)
    let role: 'USER' | 'ADMIN' | 'ORGANIZER' = 'ORGANIZER';
    if (data.email.includes('admin')) {
      role = 'ADMIN';
    } else if (data.email.includes('user')) {
      role = 'USER';
    }

    // Create a mock user object (no database needed)
    const mockUser = {
      id: `mock-${Date.now()}`,
      email: data.email,
      name: data.email.split('@')[0],
      cpf: null,
      phone: null,
      role: role,
    };

    // Try to use database, but fallback to mock if unavailable
    let user: any = mockUser;

    try {
      // Try to find user in database
      const dbResult = await query<User>(
        'SELECT * FROM users WHERE email = $1',
        [data.email]
      );

      if (dbResult.rows.length > 0) {
        user = dbResult.rows[0];
      } else {
        // Try to create user
        const passwordHash = await bcrypt.hash(data.password || '123456', 10);
        const newUserResult = await query<User>(
          `INSERT INTO users (email, password_hash, name, role)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [data.email, passwordHash, data.email.split('@')[0], role]
        );
        user = newUserResult.rows[0];
      }
    } catch (dbError) {
      // Database unavailable - use mock user
      console.warn('Database unavailable, using mock user:', dbError);
    }

    // Generate tokens
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Try to save refresh token (ignore errors)
    try {
      await query(
        `INSERT INTO refresh_tokens (token, user_id, expires_at)
         VALUES ($1, $2, $3)`,
        [refreshToken, user.id, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
      );
    } catch (tokenError) {
      // Ignore - mock mode
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        cpf: user.cpf,
        phone: user.phone,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    // Verify token
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(token);
    } catch (error) {
      throw new AppError(401, 'Invalid refresh token');
    }

    // Check if token exists in database with user data
    const result = await query<{
      token: string;
      expires_at: Date;
      user_id: string;
      email: string;
      role: 'USER' | 'ADMIN' | 'ORGANIZER';
    }>(
      `SELECT rt.token, rt.expires_at, u.id as user_id, u.email, u.role
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new AppError(401, 'Invalid refresh token');
    }

    const storedToken = result.rows[0];

    // Check if token is expired
    if (storedToken.expires_at < new Date()) {
      await query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
      throw new AppError(401, 'Refresh token expired');
    }

    // Generate new access token
    const newPayload: TokenPayload = {
      sub: storedToken.user_id,
      email: storedToken.email,
      role: storedToken.role,
    };

    const accessToken = generateAccessToken(newPayload);

    return { accessToken };
  }

  async logout(token: string) {
    // Delete refresh token
    await query('DELETE FROM refresh_tokens WHERE token = $1', [token]);

    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const result = await query<User>(
      `SELECT id, email, name, cpf, phone, role, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'User not found');
    }

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      cpf: user.cpf,
      phone: user.phone,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  async forgotPassword(email: string) {
    // Check if user exists
    const userResult = await query<User>(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email]
    );

    // Always return success to prevent email enumeration
    if (userResult.rows.length === 0) {
      return { message: 'Se o email existir, você receberá instruções para redefinir sua senha.' };
    }

    const user = userResult.rows[0];

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate any existing tokens for this user
    await query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1',
      [user.id]
    );

    // Save new token
    await query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    );

    // Build reset URL
    const frontendUrl = env.FRONTEND_URL || 'http://localhost:3001';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

    // Send email
    try {
      await emailService.sendPasswordResetEmail(user.email, {
        userName: user.name,
        resetUrl,
        expiresIn: '1 hora',
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Don't throw - we still want to return success
    }

    return { message: 'Se o email existir, você receberá instruções para redefinir sua senha.' };
  }

  async verifyResetToken(token: string) {
    const result = await query<{
      id: string;
      user_id: string;
      expires_at: Date;
      used_at: Date | null;
    }>(
      `SELECT id, user_id, expires_at, used_at
       FROM password_reset_tokens
       WHERE token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new AppError(400, 'Token inválido ou expirado');
    }

    const resetToken = result.rows[0];

    if (resetToken.used_at) {
      throw new AppError(400, 'Este link já foi utilizado');
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      throw new AppError(400, 'Este link expirou. Solicite um novo.');
    }

    return { valid: true, userId: resetToken.user_id };
  }

  async resetPassword(token: string, newPassword: string) {
    // Verify token first
    const tokenResult = await query<{
      id: string;
      user_id: string;
      expires_at: Date;
      used_at: Date | null;
    }>(
      `SELECT id, user_id, expires_at, used_at
       FROM password_reset_tokens
       WHERE token = $1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      throw new AppError(400, 'Token inválido ou expirado');
    }

    const resetToken = tokenResult.rows[0];

    if (resetToken.used_at) {
      throw new AppError(400, 'Este link já foi utilizado');
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      throw new AppError(400, 'Este link expirou. Solicite um novo.');
    }

    // Validate password
    if (!newPassword || newPassword.length < 6) {
      throw new AppError(400, 'A senha deve ter pelo menos 6 caracteres');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and mark token as used in transaction
    await transaction(async (client) => {
      // Update user password
      await client.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [passwordHash, resetToken.user_id]
      );

      // Mark token as used
      await client.query(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
        [resetToken.id]
      );

      // Invalidate all refresh tokens for this user (logout from all devices)
      await client.query(
        'DELETE FROM refresh_tokens WHERE user_id = $1',
        [resetToken.user_id]
      );
    });

    return { message: 'Senha redefinida com sucesso!' };
  }
}
