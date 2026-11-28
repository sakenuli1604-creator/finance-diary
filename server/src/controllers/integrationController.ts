import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import integrationService, { INTEGRATION_PERIODS, IntegrationPeriod } from '../services/integrationService';

class IntegrationController {
  // GET /api/integrations/genos/overview?period=month|last_month|all
  async getOverview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = (req.query.period as string | undefined) ?? 'month';
      if (!INTEGRATION_PERIODS.includes(period as IntegrationPeriod)) {
        res.status(400).json({ message: `period must be one of: ${INTEGRATION_PERIODS.join(', ')}` });
        return;
      }
      const data = await integrationService.getOverview(req.userId!, period as IntegrationPeriod);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/integrations/genos/goals
  async getGoals(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await integrationService.getGoals(req.userId!));
    } catch (error) {
      next(error);
    }
  }
}

export default new IntegrationController();
