import { Request, Response } from 'express';
import { CompanyUseCaseFactory } from '../infrastructure/factories/CompanyUseCaseFactory.js';

export class CompanyController {
  // ========================================
  // COMPANY SETTINGS
  // ========================================

  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const useCase = CompanyUseCaseFactory.getCompanySettingsUseCase();
      const result = await useCase.execute({ userId });

      if (!result) {
        res.status(404).json({ error: 'Organizer account not found' });
        return;
      }

      res.json(result);
    } catch (error: any) {
      console.error('Error getting company settings:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const {
        companyName,
        tradingName,
        cnpj,
        companyEmail,
        companyPhone,
        companyAddress,
        companyCity,
        companyState,
        companyZipCode,
        taxRegime,
      } = req.body;

      const useCase = CompanyUseCaseFactory.updateCompanySettingsUseCase();
      const result = await useCase.execute({
        userId,
        companyName,
        tradingName,
        cnpj,
        companyEmail,
        companyPhone,
        companyAddress,
        companyCity,
        companyState,
        companyZipCode,
        taxRegime,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error updating company settings:', error);
      res.status(400).json({ error: error.message || 'Failed to update settings' });
    }
  }

  // ========================================
  // TEAM MANAGEMENT
  // ========================================

  async getTeamMembers(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const useCase = CompanyUseCaseFactory.getTeamMembersUseCase();
      const result = await useCase.execute({ organizerUserId: userId });

      res.json(result);
    } catch (error: any) {
      console.error('Error getting team members:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async inviteTeamMember(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { email, role, permissions } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      const useCase = CompanyUseCaseFactory.inviteTeamMemberUseCase();
      const result = await useCase.execute({
        organizerUserId: userId,
        inviteeEmail: email,
        role,
        permissions,
      });

      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error inviting team member:', error);
      res.status(400).json({ error: error.message || 'Failed to invite team member' });
    }
  }

  async updateTeamMember(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { memberId } = req.params;
      const { role, permissions } = req.body;

      const useCase = CompanyUseCaseFactory.updateTeamMemberUseCase();
      const result = await useCase.execute({
        organizerUserId: userId,
        memberId,
        role,
        permissions,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error updating team member:', error);
      res.status(400).json({ error: error.message || 'Failed to update team member' });
    }
  }

  async removeTeamMember(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { memberId } = req.params;

      const useCase = CompanyUseCaseFactory.removeTeamMemberUseCase();
      await useCase.execute({
        organizerUserId: userId,
        memberId,
      });

      res.status(204).send();
    } catch (error: any) {
      console.error('Error removing team member:', error);
      res.status(400).json({ error: error.message || 'Failed to remove team member' });
    }
  }

  async acceptInvite(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { inviteId } = req.body;

      if (!inviteId) {
        res.status(400).json({ error: 'Invite ID is required' });
        return;
      }

      const useCase = CompanyUseCaseFactory.acceptTeamInviteUseCase();
      const result = await useCase.execute({
        userId,
        inviteId,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error accepting invite:', error);
      res.status(400).json({ error: error.message || 'Failed to accept invite' });
    }
  }
}
