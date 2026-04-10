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

  const { id } = req.query

  try {
    if (req.method === 'PUT') {
      const updated = await prisma.budget.update({
        where: { id },
        data: {
          ...req.body,
          startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
          endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        },
      })
      return res.status(200).json({ success: true, data: updated })
    }

    if (req.method === 'DELETE') {
      await prisma.budget.delete({ where: { id } })
      return res.status(200).json({ success: true, data: null })
    }

    res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}
