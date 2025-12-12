import { ITeamMemberRepository } from '../../../domain/repositories/ITeamMemberRepository.js';
import { IOrganizerAccountRepository } from '../../../domain/repositories/IOrganizerAccountRepository.js';

export interface RemoveTeamMemberInput {
  organizerUserId: string;
  memberId: string;
}

export class RemoveTeamMemberUseCase {
  constructor(
    private teamMemberRepository: ITeamMemberRepository,
    private organizerAccountRepository: IOrganizerAccountRepository
  ) {}

  async execute(input: RemoveTeamMemberInput): Promise<void> {
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

    // Must be owner or admin to remove members
    if (requester && !requester.isAdmin()) {
      throw new Error('You do not have permission to remove team members');
    }

    // Get the member to remove
    const member = await this.teamMemberRepository.findById(input.memberId);
    if (!member) {
      throw new Error('Team member not found');
    }

    // Verify member belongs to this organizer
    if (member.organizerAccountId !== organizerAccount.id) {
      throw new Error('Team member does not belong to your organization');
    }

    // Cannot remove owner
    if (member.isOwner()) {
      throw new Error('Cannot remove the owner');
    }

    // Cannot remove yourself (must transfer ownership first)
    if (member.userId === input.organizerUserId) {
      throw new Error('Cannot remove yourself. Transfer ownership first if needed.');
    }

    await this.teamMemberRepository.delete(input.memberId);
  }
}
