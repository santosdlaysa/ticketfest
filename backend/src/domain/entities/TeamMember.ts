export enum TeamRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  MEMBER = 'MEMBER',
}

export interface TeamMemberProps {
  id: string;
  organizerAccountId: string;
  userId: string;
  role: TeamRole;
  permissions: string[];
  invitedEmail?: string;
  invitedAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class TeamMember {
  private constructor(private props: TeamMemberProps) {}

  static create(
    props: Pick<TeamMemberProps, 'organizerAccountId' | 'userId'> &
    Partial<Omit<TeamMemberProps, 'id' | 'createdAt' | 'updatedAt' | 'invitedAt'>>
  ): TeamMember {
    return new TeamMember({
      id: crypto.randomUUID(),
      organizerAccountId: props.organizerAccountId,
      userId: props.userId,
      role: props.role ?? TeamRole.MEMBER,
      permissions: props.permissions ?? [],
      invitedEmail: props.invitedEmail,
      invitedAt: new Date(),
      acceptedAt: props.acceptedAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static restore(props: TeamMemberProps): TeamMember {
    return new TeamMember(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get organizerAccountId(): string {
    return this.props.organizerAccountId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get role(): TeamRole {
    return this.props.role;
  }

  get permissions(): string[] {
    return [...this.props.permissions];
  }

  get invitedEmail(): string | undefined {
    return this.props.invitedEmail;
  }

  get invitedAt(): Date {
    return this.props.invitedAt;
  }

  get acceptedAt(): Date | undefined {
    return this.props.acceptedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business Logic
  isOwner(): boolean {
    return this.props.role === TeamRole.OWNER;
  }

  isAdmin(): boolean {
    return this.props.role === TeamRole.ADMIN || this.props.role === TeamRole.OWNER;
  }

  isAccepted(): boolean {
    return !!this.props.acceptedAt;
  }

  hasPermission(permission: string): boolean {
    // Owners and admins have all permissions
    if (this.isAdmin()) return true;
    return this.props.permissions.includes(permission);
  }

  accept(): void {
    if (this.props.acceptedAt) {
      throw new Error('Invite already accepted');
    }
    this.props.acceptedAt = new Date();
    this.props.updatedAt = new Date();
  }

  updateRole(role: TeamRole): void {
    if (this.props.role === TeamRole.OWNER) {
      throw new Error('Cannot change owner role');
    }
    if (role === TeamRole.OWNER) {
      throw new Error('Cannot promote to owner');
    }
    this.props.role = role;
    this.props.updatedAt = new Date();
  }

  updatePermissions(permissions: string[]): void {
    this.props.permissions = [...permissions];
    this.props.updatedAt = new Date();
  }

  addPermission(permission: string): void {
    if (!this.props.permissions.includes(permission)) {
      this.props.permissions.push(permission);
      this.props.updatedAt = new Date();
    }
  }

  removePermission(permission: string): void {
    const index = this.props.permissions.indexOf(permission);
    if (index > -1) {
      this.props.permissions.splice(index, 1);
      this.props.updatedAt = new Date();
    }
  }

  toJSON(): TeamMemberProps {
    return { ...this.props };
  }
}
