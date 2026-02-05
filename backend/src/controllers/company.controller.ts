import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';

export class CompanyController {
  /**
   * GET /company/settings
   * Retorna as configurações da empresa do organizador autenticado
   */
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const result = await query(
        `SELECT * FROM organizer_accounts WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Organizer account not found' });
      }

      const acc = result.rows[0];
      return res.json(this.formatSettingsResponse(acc));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * PUT /company/settings
   * Atualiza as configurações da empresa
   */
  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
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

      const result = await query(
        `UPDATE organizer_accounts SET
          company_name = COALESCE($2, company_name),
          trading_name = COALESCE($3, trading_name),
          cnpj = COALESCE($4, cnpj),
          company_email = COALESCE($5, company_email),
          company_phone = COALESCE($6, company_phone),
          company_address = COALESCE($7, company_address),
          company_city = COALESCE($8, company_city),
          company_state = COALESCE($9, company_state),
          company_zip_code = COALESCE($10, company_zip_code),
          tax_regime = COALESCE($11, tax_regime),
          updated_at = NOW()
        WHERE user_id = $1
        RETURNING *`,
        [
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
        ]
      );

      if (result.rows.length === 0) {
        throw new AppError(404, 'Organizer account not found');
      }

      return res.json(this.formatSettingsResponse(result.rows[0]));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /company/team
   * Lista membros da equipe e convites pendentes
   */
  async getTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      // Buscar conta do organizador
      const accountResult = await query(
        `SELECT id FROM organizer_accounts WHERE user_id = $1`,
        [userId]
      );

      if (accountResult.rows.length === 0) {
        throw new AppError(404, 'Organizer account not found');
      }

      const organizerAccountId = accountResult.rows[0].id;

      // Buscar todos os membros com dados do usuário
      const membersResult = await query(
        `SELECT tm.*, u.name as user_name, u.email as user_email
         FROM team_members tm
         LEFT JOIN users u ON tm.user_id = u.id
         WHERE tm.organizer_account_id = $1
         ORDER BY tm.created_at ASC`,
        [organizerAccountId]
      );

      const allMembers = membersResult.rows.map(m => this.formatTeamMember(m));
      const members = allMembers.filter(m => m.isAccepted);
      const pendingInvites = allMembers.filter(m => !m.isAccepted);

      return res.json({
        members,
        pendingInvites,
        totalMembers: members.length,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * POST /company/team/invite
   * Convida um novo membro para a equipe
   */
  async inviteMember(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { email, role = 'MEMBER', permissions = [] } = req.body;

      if (!email) {
        throw new AppError(400, 'Email is required');
      }

      // Buscar conta do organizador
      const accountResult = await query(
        `SELECT id FROM organizer_accounts WHERE user_id = $1`,
        [userId]
      );

      if (accountResult.rows.length === 0) {
        throw new AppError(404, 'Organizer account not found');
      }

      const organizerAccountId = accountResult.rows[0].id;

      // Verificar permissão do solicitante (deve ser OWNER ou ADMIN)
      const requesterResult = await query(
        `SELECT role FROM team_members WHERE organizer_account_id = $1 AND user_id = $2`,
        [organizerAccountId, userId]
      );

      if (requesterResult.rows.length > 0) {
        const requesterRole = requesterResult.rows[0].role;
        if (requesterRole !== 'OWNER' && requesterRole !== 'ADMIN') {
          throw new AppError(403, 'You do not have permission to invite team members');
        }
      }

      // Verificar se já existe convite pendente para este email
      const existingInvite = await query(
        `SELECT id FROM team_members WHERE organizer_account_id = $1 AND invited_email = $2`,
        [organizerAccountId, email.toLowerCase()]
      );

      if (existingInvite.rows.length > 0) {
        throw new AppError(400, 'An invite has already been sent to this email');
      }

      // Verificar se o usuário já existe no sistema
      const inviteeResult = await query(
        `SELECT id FROM users WHERE email = $1`,
        [email.toLowerCase()]
      );

      const inviteeUserId = inviteeResult.rows.length > 0
        ? inviteeResult.rows[0].id
        : crypto.randomUUID();

      // Se o usuário já existe, verificar se já é membro
      if (inviteeResult.rows.length > 0) {
        const existingMember = await query(
          `SELECT id FROM team_members WHERE organizer_account_id = $1 AND user_id = $2`,
          [organizerAccountId, inviteeUserId]
        );

        if (existingMember.rows.length > 0) {
          throw new AppError(400, 'This user is already a team member');
        }
      }

      // Criar o membro/convite
      const result = await query(
        `INSERT INTO team_members (organizer_account_id, user_id, role, permissions, invited_email)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [organizerAccountId, inviteeUserId, role, permissions, email.toLowerCase()]
      );

      // Buscar dados do usuário para o retorno
      const memberRow = result.rows[0];
      const userResult = await query(
        `SELECT name, email FROM users WHERE id = $1`,
        [memberRow.user_id]
      );

      const userName = userResult.rows.length > 0 ? userResult.rows[0].name : 'Pending';
      const userEmail = userResult.rows.length > 0 ? userResult.rows[0].email : email;

      return res.status(201).json({
        id: memberRow.id,
        userId: memberRow.user_id,
        userName,
        userEmail,
        role: memberRow.role,
        permissions: memberRow.permissions || [],
        invitedEmail: memberRow.invited_email,
        invitedAt: memberRow.invited_at,
        acceptedAt: memberRow.accepted_at,
        isAccepted: !!memberRow.accepted_at,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * PUT /company/team/:memberId
   * Atualiza role/permissões de um membro da equipe
   */
  async updateMember(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { memberId } = req.params;
      const { role, permissions } = req.body;

      // Buscar conta do organizador
      const accountResult = await query(
        `SELECT id FROM organizer_accounts WHERE user_id = $1`,
        [userId]
      );

      if (accountResult.rows.length === 0) {
        throw new AppError(404, 'Organizer account not found');
      }

      const organizerAccountId = accountResult.rows[0].id;

      // Verificar permissão do solicitante
      const requesterResult = await query(
        `SELECT role FROM team_members WHERE organizer_account_id = $1 AND user_id = $2`,
        [organizerAccountId, userId]
      );

      if (requesterResult.rows.length > 0) {
        const requesterRole = requesterResult.rows[0].role;
        if (requesterRole !== 'OWNER' && requesterRole !== 'ADMIN') {
          throw new AppError(403, 'You do not have permission to update team members');
        }
      }

      // Buscar o membro a ser atualizado
      const memberResult = await query(
        `SELECT * FROM team_members WHERE id = $1 AND organizer_account_id = $2`,
        [memberId, organizerAccountId]
      );

      if (memberResult.rows.length === 0) {
        throw new AppError(404, 'Team member not found');
      }

      const member = memberResult.rows[0];

      // Não pode alterar o OWNER
      if (member.role === 'OWNER') {
        throw new AppError(400, 'Cannot modify the owner');
      }

      // Atualizar o membro
      const updates: string[] = [];
      const params: any[] = [memberId];
      let paramIndex = 2;

      if (role !== undefined) {
        if (role === 'OWNER') {
          throw new AppError(400, 'Cannot promote to owner');
        }
        updates.push(`role = $${paramIndex}`);
        params.push(role);
        paramIndex++;
      }

      if (permissions !== undefined) {
        updates.push(`permissions = $${paramIndex}`);
        params.push(permissions);
        paramIndex++;
      }

      if (updates.length === 0) {
        throw new AppError(400, 'No fields to update');
      }

      updates.push('updated_at = NOW()');

      const result = await query(
        `UPDATE team_members SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
        params
      );

      const updatedMember = result.rows[0];

      // Buscar dados do usuário
      const userResult = await query(
        `SELECT name, email FROM users WHERE id = $1`,
        [updatedMember.user_id]
      );

      const userName = userResult.rows.length > 0 ? userResult.rows[0].name : 'Pending';
      const userEmail = userResult.rows.length > 0 ? userResult.rows[0].email : updatedMember.invited_email || '';

      return res.json({
        id: updatedMember.id,
        userId: updatedMember.user_id,
        userName,
        userEmail,
        role: updatedMember.role,
        permissions: updatedMember.permissions || [],
        invitedEmail: updatedMember.invited_email,
        invitedAt: updatedMember.invited_at,
        acceptedAt: updatedMember.accepted_at,
        isAccepted: !!updatedMember.accepted_at,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * DELETE /company/team/:memberId
   * Remove um membro da equipe
   */
  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { memberId } = req.params;

      // Buscar conta do organizador
      const accountResult = await query(
        `SELECT id FROM organizer_accounts WHERE user_id = $1`,
        [userId]
      );

      if (accountResult.rows.length === 0) {
        throw new AppError(404, 'Organizer account not found');
      }

      const organizerAccountId = accountResult.rows[0].id;

      // Verificar permissão do solicitante
      const requesterResult = await query(
        `SELECT role FROM team_members WHERE organizer_account_id = $1 AND user_id = $2`,
        [organizerAccountId, userId]
      );

      if (requesterResult.rows.length > 0) {
        const requesterRole = requesterResult.rows[0].role;
        if (requesterRole !== 'OWNER' && requesterRole !== 'ADMIN') {
          throw new AppError(403, 'You do not have permission to remove team members');
        }
      }

      // Buscar o membro a ser removido
      const memberResult = await query(
        `SELECT * FROM team_members WHERE id = $1 AND organizer_account_id = $2`,
        [memberId, organizerAccountId]
      );

      if (memberResult.rows.length === 0) {
        throw new AppError(404, 'Team member not found');
      }

      const member = memberResult.rows[0];

      if (member.role === 'OWNER') {
        throw new AppError(400, 'Cannot remove the owner');
      }

      if (member.user_id === userId) {
        throw new AppError(400, 'Cannot remove yourself. Transfer ownership first if needed.');
      }

      await query(`DELETE FROM team_members WHERE id = $1`, [memberId]);

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }

  /**
   * POST /company/team/accept
   * Aceita um convite para fazer parte da equipe
   */
  async acceptInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { inviteId } = req.body;

      if (!inviteId) {
        throw new AppError(400, 'Invite ID is required');
      }

      // Buscar dados do usuário
      const userResult = await query(
        `SELECT id, email, name FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new AppError(404, 'User not found');
      }

      const user = userResult.rows[0];

      // Buscar o convite
      const inviteResult = await query(
        `SELECT * FROM team_members WHERE id = $1`,
        [inviteId]
      );

      if (inviteResult.rows.length === 0) {
        throw new AppError(404, 'Invite not found');
      }

      const invite = inviteResult.rows[0];

      // Verificar se o convite é para o email do usuário
      if (invite.invited_email?.toLowerCase() !== user.email.toLowerCase()) {
        throw new AppError(403, 'This invite is not for your email');
      }

      // Verificar se já foi aceito
      if (invite.accepted_at) {
        throw new AppError(400, 'Invite already accepted');
      }

      // Aceitar o convite - atualizar user_id e accepted_at
      const result = await query(
        `UPDATE team_members SET
          user_id = $2,
          accepted_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *`,
        [inviteId, userId]
      );

      const accepted = result.rows[0];

      return res.json({
        id: accepted.id,
        organizerAccountId: accepted.organizer_account_id,
        role: accepted.role,
        permissions: accepted.permissions || [],
        acceptedAt: accepted.accepted_at,
      });
    } catch (error) {
      return next(error);
    }
  }

  private formatSettingsResponse(acc: any) {
    return {
      id: acc.id,
      userId: acc.user_id,
      verified: acc.verified,
      companySettings: {
        companyName: acc.company_name,
        tradingName: acc.trading_name,
        cnpj: acc.cnpj,
        companyEmail: acc.company_email,
        companyPhone: acc.company_phone,
        companyAddress: acc.company_address,
        companyCity: acc.company_city,
        companyState: acc.company_state,
        companyZipCode: acc.company_zip_code,
        taxRegime: acc.tax_regime,
      },
      bankDetails: {
        bankCode: acc.bank_code,
        bankName: acc.bank_name,
        accountType: acc.account_type,
        accountNumber: acc.account_number,
        accountDigit: acc.account_digit,
        agencyNumber: acc.agency_number,
        agencyDigit: acc.agency_digit,
        holderName: acc.holder_name,
        holderDocument: acc.holder_document,
        holderType: acc.holder_type,
      },
      availableBalance: acc.available_balance || 0,
      pendingBalance: acc.pending_balance || 0,
    };
  }

  private formatTeamMember(m: any) {
    return {
      id: m.id,
      userId: m.user_id,
      userName: m.user_name || 'Pending',
      userEmail: m.user_email || m.invited_email || '',
      role: m.role,
      permissions: m.permissions || [],
      invitedEmail: m.invited_email,
      invitedAt: m.invited_at,
      acceptedAt: m.accepted_at,
      isAccepted: !!m.accepted_at,
    };
  }
}

export const companyController = new CompanyController();
