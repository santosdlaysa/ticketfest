import { ITeamMemberRepository } from '../../../domain/repositories/ITeamMemberRepository.js';
import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { TeamRole } from '../../../domain/entities/TeamMember.js';

export interface AcceptTeamInviteInput {
  userId: string;
  inviteId: string;
}

export interface AcceptTeamInviteOutput {
  id: string;
  organizerAccountId: string;
  role: TeamRole;
  permissions: string[];
  acceptedAt: Date;
}

export class AcceptTeamInviteUseCase {
  constructor(
    private teamMemberRepository: ITeamMemberRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(input: AcceptTeamInviteInput): Promise<AcceptTeamInviteOutput> {
    // Get the user
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get the invite
    const invite = await this.teamMemberRepository.findById(input.inviteId);
    if (!invite) {
      throw new Error('Invite not found');
    }

    // Verify the invite is for this user's email
    if (invite.invitedEmail?.toLowerCase() !== user.email.toLowerCase()) {
      throw new Error('This invite is not for your email');
    }

    // Check if already accepted
    if (invite.isAccepted()) {
      throw new Error('Invite already accepted');
    }

    // Accept the invite
    invite.accept();

    const updatedMember = await this.teamMemberRepository.update(invite);

    return {
      id: updatedMember.id,
      organizerAccountId: updatedMember.organizerAccountId,
      role: updatedMember.role,
      permissions: updatedMember.permissions,
      acceptedAt: updatedMember.acceptedAt!,
    };
  }
}
