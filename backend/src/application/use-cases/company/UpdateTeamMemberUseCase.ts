import { TeamRole } from '../../../domain/entities/TeamMember.js';
import { ITeamMemberRepository } from '../../../domain/repositories/ITeamMemberRepository.js';
import { IOrganizerAccountRepository } from '../../../domain/repositories/IOrganizerAccountRepository.js';

export interface UpdateTeamMemberInput {
  organizerUserId: string;
  memberId: string;
  role?: TeamRole;
  permissions?: string[];
}

export interface UpdateTeamMemberOutput {
  id: string;
  role: TeamRole;
  permissions: string[];
  updatedAt: Date;
}

export class UpdateTeamMemberUseCase {
  constructor(
    private teamMemberRepository: ITeamMemberRepository,
    private organizerAccountRepository: IOrganizerAccountRepository
  ) {}

  async execute(input: UpdateTeamMemberInput): Promise<UpdateTeamMemberOutput> {
    // Get organizer account
    const organizerAccount = await this.organizerAccountRepository.findByUserId(input.organizerUserId);
    if (!organizerAccount) {
      throw new Error('Organizer account not found');
    }

    // Check permission
    const requester = await this.teamMemberRepository.findByOrganizerAndUser(
      organizerAccount.id,
      input.organizerUserId
    );

    // Must be owner or admin to update members
    if (requester && !requester.isAdmin()) {
      throw new Error('You do not have permission to update team members');
    }

    // Get the member to update
    const member = await this.teamMemberRepository.findById(input.memberId);
    if (!member) {
      throw new Error('Team member not found');
    }

    // Verify member belongs to this organizer
    if (member.organizerAccountId !== organizerAccount.id) {
      throw new Error('Team member does not belong to your organization');
    }

    // Cannot update owner role
    if (member.isOwner()) {
      throw new Error('Cannot modify the owner');
    }

    // Update role if provided
    if (input.role !== undefined) {
      member.updateRole(input.role);
    }

    // Update permissions if provided
    if (input.permissions !== undefined) {
      member.updatePermissions(input.permissions);
    }

    const updatedMember = await this.teamMemberRepository.update(member);

    return {
      id: updatedMember.id,
      role: updatedMember.role,
      permissions: updatedMember.permissions,
      updatedAt: updatedMember.updatedAt,
    };
  }
}
