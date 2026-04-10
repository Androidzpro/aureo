import { Response } from 'express'
import { BudgetService } from '../services/budget.service'
import { AuthRequest } from '../middleware/auth'

const budgetService = new BudgetService()

export class BudgetController {
  async getAll(req: AuthRequest, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    await budgetService.getAll(req.user.id, res)
  }

  async create(req: AuthRequest, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { category, amount, period, startDate, endDate } = req.body

    if (!category || !amount || !period || !startDate || !endDate) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    await budgetService.create(req.user.id, req.body, res)
  }

  async update(req: AuthRequest, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { id } = req.params
    await budgetService.update(id, req.user.id, req.body, res)
  }

  async delete(req: AuthRequest, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { id } = req.params
    await budgetService.delete(id, req.user.id, res)
  }
}

export default new BudgetController()
