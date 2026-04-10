import { Response } from 'express'
import { TransactionService } from '../services/transaction.service'
import { AuthRequest } from '../middleware/auth'

const transactionService = new TransactionService()

export class TransactionController {
  async getAll(req: AuthRequest, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    await transactionService.getAll(req.user.id, res)
  }

  async getById(req: AuthRequest, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { id } = req.params
    await transactionService.getById(id, req.user.id, res)
  }

  async create(req: AuthRequest, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { amount, type, category, description, date } = req.body

    if (!amount || !type || !category || !description || !date) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    await transactionService.create(req.user.id, req.body, res)
  }

  async update(req: AuthRequest, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { id } = req.params
    await transactionService.update(id, req.user.id, req.body, res)
  }

  async delete(req: AuthRequest, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { id } = req.params
    await transactionService.delete(id, req.user.id, res)
  }
}

export default new TransactionController()
