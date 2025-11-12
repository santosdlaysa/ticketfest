import { UserRole } from '../../domain/entities/User.js';

export interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
  cpf?: string;
  phone?: string;
  role?: UserRole;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UpdateUserDTO {
  name?: string;
  phone?: string;
  cpf?: string;
}
