import { TeamMember, TeamRole } from '../../../domain/entities/TeamMember.js';
import { ITeamMemberRepository } from '../../../domain/repositories/ITeamMemberRepository.js';
import { IOrganizerAccountRepository } from '../../../domain/repositories/IOrganizerAccountRepository.js';
import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';

export interface InviteTeamMemberInput {
  organizerUserId: string;  // User who is inviting
  inviteeEmail: string;
  role?: TeamRole;
  permissions?: string[];
}

export interface InviteTeamMemberOutput {
  id: string;
  organizerAccountId: string;
  userId: string;
  invitedEmail: string;
  role: TeamRole;
  permissions: string[];
  invitedAt: Date;
}

export class InviteTeamMemberUseCase {
  constructor(
    private teamMemberRepository: ITeamMemberRepository,
    private organizerAccountRepository: IOrganizerAccountRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(input: InviteTeamMemberInput): Promise<InviteTeamMemberOutput> {
    // Get organizer account
    const organizerAccount = await this.organizerAccountRepository.findByUserId(input.organizerUserId);
    if (!organizerAccount) {
      throw new Error('Organizer account not found');
    }

    // Check if inviter has permission to invite
    const inviterMember = await this.teamMemberRepository.findByOrganizerAndUser(
      organizerAccount.id,
      input.organizerUserId
    );

    // If not the owner and not an admin, they can't invite
    if (inviterMember && !inviterMember.isAdmin()) {
      throw new Error('You do not have permission to invite team members');
    }

    // Check if there's already a pending invite for this email
    const existingInvite = await this.teamMemberRepository.findByInviteEmail(
      organizerAccount.id,
      input.inviteeEmail
    );
    if (existingInvite) {
      throw new Error('An invite has already been sent to this email');
    }

    // Find user by email (they might already be registered)
    const inviteeUser = await this.userRepository.findByEmail(input.inviteeEmail);

    if (inviteeUser) {
      // Check if user is already a team member
      const existingMember = await this.teamMemberRepository.findByOrganizerAndUser(
        organizerAccount.id,
        inviteeUser.id
      );
      if (existingMember) {
        throw new Error('This user is already a team member');
      }
    }

    // Create team member (with or without user)
    const teamMember = TeamMember.create({
      organizerAccountId: organizerAccount.id,
      userId: inviteeUser?.id ?? crypto.randomUUID(), // Placeholder if user doesn't exist yet
      role: input.role ?? TeamRole.MEMBER,
      permissions: input.permissions ?? [],
      invitedEmail: input.inviteeEmail.toLowerCase(),
    });

    const savedMember = await this.teamMemberRepository.create(teamMember);

    // TODO: Send invitation email

    return {
      id: savedMember.id,
      organizerAccountId: savedMember.organizerAccountId,
      userId: savedMember.userId,
      invitedEmail: savedMember.invitedEmail!,
      role: savedMember.role,
      permissions: savedMember.permissions,
      invitedAt: savedMember.invitedAt,
    };
  }
}
