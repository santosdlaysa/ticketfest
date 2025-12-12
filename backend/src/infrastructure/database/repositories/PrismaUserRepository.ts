import { PrismaClient } from '@prisma/client';
import { User, UserRole } from '../../../domain/entities/User.js';
import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';

export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async create(user: User): Promise<User> {
    const data = user.toJSON();

    const created = await this.prisma.user.create({
      data: {
        id: data.id,
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        cpf: data.cpf,
        phone: data.phone,
        role: data.role,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user ? this.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    return user ? this.toDomain(user) : null;
  }

  async findByCpf(cpf: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { cpf },
    });

    return user ? this.toDomain(user) : null;
  }

  async update(user: User): Promise<User> {
    const data = user.toJSON();

    const updated = await this.prisma.user.update({
      where: { id: data.id },
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        cpf: data.cpf,
        phone: data.phone,
        role: data.role,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  private toDomain(data: any): User {
    return User.restore({
      id: data.id,
      email: data.email,
      passwordHash: data.passwordHash,
      name: data.name,
      cpf: data.cpf ?? undefined,
      phone: data.phone ?? undefined,
      role: data.role as UserRole,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
