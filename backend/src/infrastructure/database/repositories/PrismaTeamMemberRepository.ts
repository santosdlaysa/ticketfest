import { PrismaClient } from '@prisma/client';
import { TeamMember, TeamRole } from '../../../domain/entities/TeamMember.js';
import { ITeamMemberRepository } from '../../../domain/repositories/ITeamMemberRepository.js';

export class PrismaTeamMemberRepository implements ITeamMemberRepository {
  constructor(private prisma: PrismaClient) {}

  async create(teamMember: TeamMember): Promise<TeamMember> {
    const data = teamMember.toJSON();

    const created = await this.prisma.teamMember.create({
      data: {
        id: data.id,
        organizerAccountId: data.organizerAccountId,
        userId: data.userId,
        role: data.role,
        permissions: data.permissions,
        invitedEmail: data.invitedEmail,
        invitedAt: data.invitedAt,
        acceptedAt: data.acceptedAt,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<TeamMember | null> {
    const member = await this.prisma.teamMember.findUnique({
      where: { id },
    });

    return member ? this.toDomain(member) : null;
  }

  async findByOrganizerAccountId(organizerAccountId: string): Promise<TeamMember[]> {
    const members = await this.prisma.teamMember.findMany({
      where: { organizerAccountId },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return members.map((m) => this.toDomain(m));
  }

  async findByUserId(userId: string): Promise<TeamMember[]> {
    const members = await this.prisma.teamMember.findMany({
      where: { userId },
    });

    return members.map((m) => this.toDomain(m));
  }

  async findByOrganizerAndUser(organizerAccountId: string, userId: string): Promise<TeamMember | null> {
    const member = await this.prisma.teamMember.findUnique({
      where: {
        organizerAccountId_userId: {
          organizerAccountId,
          userId,
        },
      },
    });

    return member ? this.toDomain(member) : null;
  }

  async findByInviteEmail(organizerAccountId: string, email: string): Promise<TeamMember | null> {
    const member = await this.prisma.teamMember.findFirst({
      where: {
        organizerAccountId,
        invitedEmail: email.toLowerCase(),
        acceptedAt: null,
      },
    });

    return member ? this.toDomain(member) : null;
  }

  async findPendingInvites(organizerAccountId: string): Promise<TeamMember[]> {
    const members = await this.prisma.teamMember.findMany({
      where: {
        organizerAccountId,
        acceptedAt: null,
      },
      orderBy: { invitedAt: 'desc' },
    });

    return members.map((m) => this.toDomain(m));
  }

  async update(teamMember: TeamMember): Promise<TeamMember> {
    const data = teamMember.toJSON();

    const updated = await this.prisma.teamMember.update({
      where: { id: data.id },
      data: {
        role: data.role,
        permissions: data.permissions,
        acceptedAt: data.acceptedAt,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.teamMember.delete({
      where: { id },
    });
  }

  async deleteByOrganizerAccountId(organizerAccountId: string): Promise<void> {
    await this.prisma.teamMember.deleteMany({
      where: { organizerAccountId },
    });
  }

  private toDomain(data: any): TeamMember {
    return TeamMember.restore({
      id: data.id,
      organizerAccountId: data.organizerAccountId,
      userId: data.userId,
      role: data.role as TeamRole,
      permissions: data.permissions || [],
      invitedEmail: data.invitedEmail ?? undefined,
      invitedAt: data.invitedAt,
      acceptedAt: data.acceptedAt ?? undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
