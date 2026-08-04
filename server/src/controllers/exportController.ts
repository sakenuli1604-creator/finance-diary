import { Response, NextFunction } from 'express';
import exportService from '../services/exportService';
import { AuthRequest } from '../middlewares/auth';

function sendCsv(res: Response, csv: string, filename: string) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  // BOM — чтобы Excel на Windows правильно определил кодировку UTF-8
  res.send('\uFEFF' + csv);
}

class ExportController {
  async exportTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const dateFrom = req.query.from ? new Date(req.query.from as string) : undefined;
      const dateTo = req.query.to ? new Date(req.query.to as string) : undefined;

      const csv = await exportService.exportTransactionsCSV(userId, dateFrom, dateTo);
      sendCsv(res, csv, `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      next(error);
    }
  }

  async exportAccounts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const csv = await exportService.exportAccountsCSV(userId);
      sendCsv(res, csv, `accounts_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      next(error);
    }
  }

  async exportGoals(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const csv = await exportService.exportGoalsCSV(userId);
      sendCsv(res, csv, `goals_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      next(error);
    }
  }
}

export default new ExportController();
