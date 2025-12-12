import { TeamMember } from '../entities/TeamMember.js';

export interface ITeamMemberRepository {
  create(teamMember: TeamMember): Promise<TeamMember>;
  findById(id: string): Promise<TeamMember | null>;
  findByOrganizerAccountId(organizerAccountId: string): Promise<TeamMember[]>;
  findByUserId(userId: string): Promise<TeamMember[]>;
  findByOrganizerAndUser(organizerAccountId: string, userId: string): Promise<TeamMember | null>;
  findByInviteEmail(organizerAccountId: string, email: string): Promise<TeamMember | null>;
  findPendingInvites(organizerAccountId: string): Promise<TeamMember[]>;
  update(teamMember: TeamMember): Promise<TeamMember>;
  delete(id: string): Promise<void>;
  deleteByOrganizerAccountId(organizerAccountId: string): Promise<void>;
}
