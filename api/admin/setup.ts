import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const email = 'demo@aureo.app'
    const password = 'Aureo2026!'
    const name = 'Demo User'

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Admin user already exists',
        credentials: { email, password: 'Use the same password' },
      })
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: { email, name, password: hashedPassword },
    })

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      credentials: { email, password },
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}
