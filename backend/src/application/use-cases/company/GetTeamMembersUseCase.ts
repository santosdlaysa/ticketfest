import { TeamRole } from '../../../domain/entities/TeamMember.js';
import { ITeamMemberRepository } from '../../../domain/repositories/ITeamMemberRepository.js';
import { IOrganizerAccountRepository } from '../../../domain/repositories/IOrganizerAccountRepository.js';
import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';

export interface GetTeamMembersInput {
  organizerUserId: string;
}

export interface TeamMemberDTO {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: TeamRole;
  permissions: string[];
  invitedEmail?: string;
  invitedAt: Date;
  acceptedAt?: Date;
  isAccepted: boolean;
}

export interface GetTeamMembersOutput {
  members: TeamMemberDTO[];
  pendingInvites: TeamMemberDTO[];
  totalMembers: number;
}

export class GetTeamMembersUseCase {
  constructor(
    private teamMemberRepository: ITeamMemberRepository,
    private organizerAccountRepository: IOrganizerAccountRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(input: GetTeamMembersInput): Promise<GetTeamMembersOutput> {
    // Get organizer account
    const organizerAccount = await this.organizerAccountRepository.findByUserId(input.organizerUserId);
    if (!organizerAccount) {
      throw new Error('Organizer account not found');
    }

    // Get all team members
    const teamMembers = await this.teamMemberRepository.findByOrganizerAccountId(organizerAccount.id);

    // Enrich with user data
    const membersWithUsers: TeamMemberDTO[] = await Promise.all(
      teamMembers.map(async (member) => {
        const user = await this.userRepository.findById(member.userId);

        return {
          id: member.id,
          userId: member.userId,
          userName: user?.name ?? 'Pending',
          userEmail: user?.email ?? member.invitedEmail ?? '',
          role: member.role,
          permissions: member.permissions,
          invitedEmail: member.invitedEmail,
          invitedAt: member.invitedAt,
          acceptedAt: member.acceptedAt,
          isAccepted: member.isAccepted(),
        };
      })
    );

    // Separate accepted members from pending invites
    const members = membersWithUsers.filter((m) => m.isAccepted);
    const pendingInvites = membersWithUsers.filter((m) => !m.isAccepted);

    return {
      members,
      pendingInvites,
      totalMembers: members.length,
    };
  }
}
