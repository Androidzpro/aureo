import prisma from '../lib/prisma'
import { sendError, sendSuccess } from '../utils/response'
import { Response } from 'express'

export class BudgetService {
  async getAll(userId: string, res: Response) {
    try {
      const budgets = await prisma.budget.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })

      return sendSuccess(res, budgets)
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch budgets', 500)
    }
  }

  async create(
    userId: string,
    data: {
      category: string
      amount: number
      period: string
      startDate: string
      endDate: string
    },
    res: Response
  ) {
    try {
      const budget = await prisma.budget.create({
        data: {
          ...data,
          userId,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
        },
      })

      return sendSuccess(res, budget, 'Budget created', 201)
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create budget', 500)
    }
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{
      category: string
      amount: number
      period: string
      startDate: string
      endDate: string
    }>,
    res: Response
  ) {
    try {
      const budget = await prisma.budget.findFirst({
        where: { id, userId },
      })

      if (!budget) {
        return sendError(res, 'Budget not found', 404)
      }

      const updated = await prisma.budget.update({
        where: { id },
        data: {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        },
      })

      return sendSuccess(res, updated, 'Budget updated')
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update budget', 500)
    }
  }

  async delete(id: string, userId: string, res: Response) {
    try {
      const budget = await prisma.budget.findFirst({
        where: { id, userId },
      })

      if (!budget) {
        return sendError(res, 'Budget not found', 404)
      }

      await prisma.budget.delete({ where: { id } })

      return sendSuccess(res, null, 'Budget deleted')
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to delete budget', 500)
    }
  }
}
