import prisma from '../lib/prisma'
import { sendError, sendSuccess } from '../utils/response'
import { Response } from 'express'

export class TransactionService {
  async getAll(userId: string, res: Response) {
    try {
      const transactions = await prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      })

      return sendSuccess(res, transactions)
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch transactions', 500)
    }
  }

  async getById(id: string, userId: string, res: Response) {
    try {
      const transaction = await prisma.transaction.findFirst({
        where: { id, userId },
      })

      if (!transaction) {
        return sendError(res, 'Transaction not found', 404)
      }

      return sendSuccess(res, transaction)
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch transaction', 500)
    }
  }

  async create(
    userId: string,
    data: {
      amount: number
      type: string
      category: string
      description: string
      date: string
    },
    res: Response
  ) {
    try {
      const transaction = await prisma.transaction.create({
        data: {
          ...data,
          userId,
          date: new Date(data.date),
        },
      })

      return sendSuccess(res, transaction, 'Transaction created', 201)
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create transaction', 500)
    }
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{
      amount: number
      type: string
      category: string
      description: string
      date: string
    }>,
    res: Response
  ) {
    try {
      const transaction = await prisma.transaction.findFirst({
        where: { id, userId },
      })

      if (!transaction) {
        return sendError(res, 'Transaction not found', 404)
      }

      const updated = await prisma.transaction.update({
        where: { id },
        data: {
          ...data,
          date: data.date ? new Date(data.date) : undefined,
        },
      })

      return sendSuccess(res, updated, 'Transaction updated')
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update transaction', 500)
    }
  }

  async delete(id: string, userId: string, res: Response) {
    try {
      const transaction = await prisma.transaction.findFirst({
        where: { id, userId },
      })

      if (!transaction) {
        return sendError(res, 'Transaction not found', 404)
      }

      await prisma.transaction.delete({ where: { id } })

      return sendSuccess(res, null, 'Transaction deleted')
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to delete transaction', 500)
    }
  }
}
