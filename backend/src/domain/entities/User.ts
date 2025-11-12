export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  ORGANIZER = 'ORGANIZER',
}

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  cpf?: string;
  phone?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private props: UserProps) {}

  static create(props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): User {
    const now = new Date();
    return new User({
      ...props,
      id: props.id || crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: UserProps): User {
    return new User(props);
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get name(): string {
    return this.props.name;
  }

  get cpf(): string | undefined {
    return this.props.cpf;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isAdmin(): boolean {
    return this.props.role === UserRole.ADMIN;
  }

  isOrganizer(): boolean {
    return this.props.role === UserRole.ORGANIZER || this.props.role === UserRole.ADMIN;
  }

  updateProfile(data: { name?: string; phone?: string; cpf?: string }): void {
    if (data.name) this.props.name = data.name;
    if (data.phone) this.props.phone = data.phone;
    if (data.cpf) this.props.cpf = data.cpf;
    this.props.updatedAt = new Date();
  }

  toJSON(): UserProps {
    return { ...this.props };
  }
}
