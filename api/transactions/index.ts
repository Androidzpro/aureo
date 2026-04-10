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

// GET - All transactions for user
// POST - Create new transaction
export default async function handler(req: any, res: any) {
  const user = authenticate(req)
  if (!user) return res.status(401).json({ message: 'Unauthorized' })

  try {
    if (req.method === 'GET') {
      const transactions = await prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
      })
      return res.status(200).json({ success: true, data: transactions })
    }

    if (req.method === 'POST') {
      const { amount, type, category, description, date } = req.body
      const transaction = await prisma.transaction.create({
        data: { userId: user.id, amount, type, category, description, date: new Date(date) },
      })
      return res.status(201).json({ success: true, data: transaction })
    }

    res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}
