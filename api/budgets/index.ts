import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

const authenticate = (req: any): any => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'aureo-secret-key-2026')
  } catch {
    return null
  }
}

export default async function handler(req: any, res: any) {
  const user = authenticate(req)
  if (!user) return res.status(401).json({ message: 'Unauthorized' })

  try {
    if (req.method === 'GET') {
      const budgets = await prisma.budget.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      })
      return res.status(200).json({ success: true, data: budgets })
    }

    if (req.method === 'POST') {
      const { category, amount, period, startDate, endDate } = req.body
      const budget = await prisma.budget.create({
        data: {
          userId: user.id, category, amount, period,
          startDate: new Date(startDate), endDate: new Date(endDate),
        },
      })
      return res.status(201).json({ success: true, data: budget })
    }

    res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}
