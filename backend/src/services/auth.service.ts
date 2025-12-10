import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  type TokenPayload,
} from '../utils/jwt.js';

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

export class AuthService {
  async register(data: RegisterData) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(409, 'Email already registered');
    }

    // Check CPF if provided
    if (data.cpf) {
      const existingCpf = await prisma.user.findUnique({
        where: { cpf: data.cpf },
      });

      if (existingCpf) {
        throw new AppError(409, 'CPF already registered');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        cpf: data.cpf,
        phone: data.phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        cpf: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginData) {
    // DEV MODE: Accept any credentials for testing - NO DATABASE REQUIRED
    // Determine role based on email pattern
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
      const dbUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (dbUser) {
        user = dbUser;
      } else {
        // Try to create user
        const passwordHash = await bcrypt.hash(data.password || '123456', 10);
        const newUser = await prisma.user.create({
          data: {
            email: data.email,
            passwordHash,
            name: data.email.split('@')[0],
            role,
          },
        });
        user = newUser;
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
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
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

    // Check if token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken) {
      throw new AppError(401, 'Invalid refresh token');
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { token } });
      throw new AppError(401, 'Refresh token expired');
    }

    // Generate new access token
    const newPayload: TokenPayload = {
      sub: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    };

    const accessToken = generateAccessToken(newPayload);

    return { accessToken };
  }

  async logout(token: string) {
    // Delete refresh token
    await prisma.refreshToken.deleteMany({
      where: { token },
    });

    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        cpf: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }
}
