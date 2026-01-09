import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service.js';
import { triggerRemindersManually } from '../jobs/scheduler.js';

const adminService = new AdminService();

export class AdminController {
  // Orders Management
  async getAllOrders(req: Request, res: Response) {
    const {
      page = '1',
      limit = '20',
      status,
      paymentStatus,
      eventId,
      startDate,
      endDate,
      search,
    } = req.query;

    const result = await adminService.getAllOrders({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as string,
      paymentStatus: paymentStatus as string,
      eventId: eventId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      search: search as string,
      userId: req.user!.role === 'ORGANIZER' ? req.user!.id : undefined,
    });

    res.status(200).json(result);
  }

  async getOrderDetails(req: Request, res: Response) {
    const { id } = req.params;
    const order = await adminService.getOrderDetails(id, req.user!.id, req.user!.role);
    res.status(200).json(order);
  }

  async refundOrder(req: Request, res: Response) {
    const { id } = req.params;
    const result = await adminService.refundOrder(id, req.user!.id, req.user!.role);
    res.status(200).json(result);
  }

  async resendOrderEmail(req: Request, res: Response) {
    const { id } = req.params;
    const result = await adminService.resendOrderEmail(id);
    res.status(200).json(result);
  }

  async confirmPaymentManual(req: Request, res: Response) {
    const { id } = req.params;
    const result = await adminService.confirmPaymentManual(id);
    res.status(200).json(result);
  }

  // Reports
  async getSalesReport(req: Request, res: Response) {
    const { startDate, endDate, groupBy = 'day', eventId } = req.query;

    const result = await adminService.getSalesReport({
      startDate: startDate as string,
      endDate: endDate as string,
      groupBy: groupBy as 'day' | 'week' | 'month',
      eventId: eventId as string,
      userId: req.user!.role === 'ORGANIZER' ? req.user!.id : undefined,
    });

    res.status(200).json(result);
  }

  async getRevenueReport(req: Request, res: Response) {
    const { startDate, endDate, eventId } = req.query;

    const result = await adminService.getRevenueReport({
      startDate: startDate as string,
      endDate: endDate as string,
      eventId: eventId as string,
      userId: req.user!.role === 'ORGANIZER' ? req.user!.id : undefined,
    });

    res.status(200).json(result);
  }

  async exportReport(req: Request, res: Response) {
    const { type, format = 'csv', startDate, endDate, eventId } = req.query;

    const result = await adminService.exportReport({
      type: type as 'orders' | 'sales' | 'revenue',
      format: format as 'csv' | 'xlsx',
      startDate: startDate as string,
      endDate: endDate as string,
      eventId: eventId as string,
      userId: req.user!.role === 'ORGANIZER' ? req.user!.id : undefined,
    });

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  }

  // Financial Dashboard
  async getFinancialSummary(req: Request, res: Response) {
    const { startDate, endDate } = req.query;

    const result = await adminService.getFinancialSummary({
      startDate: startDate as string,
      endDate: endDate as string,
      userId: req.user!.role === 'ORGANIZER' ? req.user!.id : undefined,
    });

    res.status(200).json(result);
  }

  async getTransactions(req: Request, res: Response) {
    const { page = '1', limit = '20', status, startDate, endDate } = req.query;

    const result = await adminService.getTransactions({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
      userId: req.user!.role === 'ORGANIZER' ? req.user!.id : undefined,
    });

    res.status(200).json(result);
  }

  // Payouts Management
  async getAllPayouts(req: Request, res: Response) {
    const { page = '1', limit = '20', status } = req.query;

    const result = await adminService.getAllPayouts({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as string,
      userId: req.user!.role === 'ORGANIZER' ? req.user!.id : undefined,
    });

    res.status(200).json(result);
  }

  async approvePayout(req: Request, res: Response) {
    const { id } = req.params;
    const result = await adminService.approvePayout(id, req.user!.id);
    res.status(200).json(result);
  }

  async rejectPayout(req: Request, res: Response) {
    const { id } = req.params;
    const { reason } = req.body;
    const result = await adminService.rejectPayout(id, req.user!.id, reason);
    res.status(200).json(result);
  }

  // Export Attendees
  async exportEventAttendees(req: Request, res: Response) {
    const { eventId } = req.params;
    const result = await adminService.exportEventAttendees(
      eventId,
      req.user!.id,
      req.user!.role
    );

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.status(200).send(result.data);
  }

  // Reminders (manual trigger for testing)
  async triggerReminders(_req: Request, res: Response) {
    const result = await triggerRemindersManually();
    res.status(200).json({
      message: 'Reminders processed successfully',
      sent24h: result.sent24h,
      sent2h: result.sent2h,
    });
  }

  // Dashboard
  async getDashboard(req: Request, res: Response) {
    const userId = req.user!.role === 'ORGANIZER' ? req.user!.id : undefined;
    const result = await adminService.getDashboardData(userId);
    res.status(200).json(result);
  }

  // User Management (ADMIN only)
  async getAllUsers(req: Request, res: Response) {
    const { page = '1', limit = '20', search, role } = req.query;

    const result = await adminService.getAllUsers({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string,
      role: role as string,
    });

    res.status(200).json(result);
  }

  async updateUserRole(req: Request, res: Response) {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['USER', 'ADMIN', 'ORGANIZER', 'PROMOTER'].includes(role)) {
      return res.status(400).json({ error: 'Role inválido' });
    }

    // Prevent changing own role
    if (id === req.user!.id) {
      return res.status(400).json({ error: 'Você não pode alterar seu próprio role' });
    }

    const result = await adminService.updateUserRole(id, role);
    return res.status(200).json(result);
  }
}
