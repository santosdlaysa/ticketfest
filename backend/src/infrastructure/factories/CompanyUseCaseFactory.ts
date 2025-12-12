import { prisma } from '../database/prisma/PrismaClient.js';
import { PrismaOrganizerAccountRepository } from '../database/repositories/PrismaOrganizerAccountRepository.js';
import { PrismaTeamMemberRepository } from '../database/repositories/PrismaTeamMemberRepository.js';
import { PrismaUserRepository } from '../database/repositories/PrismaUserRepository.js';

import {
  UpdateCompanySettingsUseCase,
  GetCompanySettingsUseCase,
  InviteTeamMemberUseCase,
  GetTeamMembersUseCase,
  UpdateTeamMemberUseCase,
  RemoveTeamMemberUseCase,
  AcceptTeamInviteUseCase,
} from '../../application/use-cases/company/index.js';

export class CompanyUseCaseFactory {
  private static organizerAccountRepository = new PrismaOrganizerAccountRepository(prisma);
  private static teamMemberRepository = new PrismaTeamMemberRepository(prisma);
  private static userRepository = new PrismaUserRepository(prisma);

  static updateCompanySettingsUseCase(): UpdateCompanySettingsUseCase {
    return new UpdateCompanySettingsUseCase(this.organizerAccountRepository);
  }

  static getCompanySettingsUseCase(): GetCompanySettingsUseCase {
    return new GetCompanySettingsUseCase(this.organizerAccountRepository);
  }

  static inviteTeamMemberUseCase(): InviteTeamMemberUseCase {
    return new InviteTeamMemberUseCase(
      this.teamMemberRepository,
      this.organizerAccountRepository,
      this.userRepository
    );
  }

  static getTeamMembersUseCase(): GetTeamMembersUseCase {
    return new GetTeamMembersUseCase(
      this.teamMemberRepository,
      this.organizerAccountRepository,
      this.userRepository
    );
  }

  static updateTeamMemberUseCase(): UpdateTeamMemberUseCase {
    return new UpdateTeamMemberUseCase(
      this.teamMemberRepository,
      this.organizerAccountRepository
    );
  }

  static removeTeamMemberUseCase(): RemoveTeamMemberUseCase {
    return new RemoveTeamMemberUseCase(
      this.teamMemberRepository,
      this.organizerAccountRepository
    );
  }

  static acceptTeamInviteUseCase(): AcceptTeamInviteUseCase {
    return new AcceptTeamInviteUseCase(
      this.teamMemberRepository,
      this.userRepository
    );
  }
}
