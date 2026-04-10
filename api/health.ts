import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: 'connected'
    })
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}
