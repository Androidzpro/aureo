import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export default async function handler(req: any, res: any) {
  const { method, url } = req
  const pathname = url.split('?')[0]

  // === ADMIN SETUP ===
  if (pathname === '/api/admin/setup' && (method === 'GET' || method === 'POST')) {
    try {
      const email = 'demo@aureo.app'
      const password = 'Aureo2026!'
      const name = 'Demo User'

      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        return res.status(200).json({
          success: true,
          message: 'Admin user exists',
          email,
          password: 'Aureo2026!',
        })
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      await prisma.user.create({ data: { email, name, password: hashedPassword } })

      return res.status(201).json({
        success: true,
        message: 'Admin user created',
        email,
        password,
      })
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  // === AUTH REGISTER ===
  if (pathname === '/api/auth/register' && method === 'POST') {
    try {
      const { name, email, password } = req.body
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields required' })
      }

      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        return res.status(400).json({ message: 'User already exists' })
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      const user = await prisma.user.create({
        data: { name, email, password: hashedPassword },
        select: { id: true, email: true, name: true, createdAt: true },
      })

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'aureo-secret-key-2026',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      )

      return res.status(201).json({ success: true, data: { user, token } })
    } catch (error: any) {
      return res.status(500).json({ message: error.message })
    }
  }

  // === AUTH LOGIN ===
  if (pathname === '/api/auth/login' && method === 'POST') {
    try {
      const { email, password } = req.body
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' })
      }

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' })
      }

      const isValid = await bcrypt.compare(password, user.password)
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' })
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'aureo-secret-key-2026',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      )

      const userData = { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt }
      return res.status(200).json({ success: true, data: { user: userData, token } })
    } catch (error: any) {
      return res.status(500).json({ message: error.message })
    }
  }

  // === TRANSACTIONS ===
  if (pathname === '/api/transactions') {
    const user = authenticate(req)
    if (!user) return res.status(401).json({ message: 'Unauthorized' })

    if (method === 'GET') {
      try {
        const transactions = await prisma.transaction.findMany({
          where: { userId: user.id },
          orderBy: { date: 'desc' },
        })
        return res.status(200).json({ success: true, data: transactions })
      } catch (error: any) {
        return res.status(500).json({ message: error.message })
      }
    }

    if (method === 'POST') {
      try {
        const { amount, type, category, description, date } = req.body
        const transaction = await prisma.transaction.create({
          data: { userId: user.id, amount, type, category, description, date: new Date(date) },
        })
        return res.status(201).json({ success: true, data: transaction })
      } catch (error: any) {
        return res.status(500).json({ message: error.message })
      }
    }
  }

  // === BUDGETS ===
  if (pathname === '/api/budgets') {
    const user = authenticate(req)
    if (!user) return res.status(401).json({ message: 'Unauthorized' })

    if (method === 'GET') {
      try {
        const budgets = await prisma.budget.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
        })
        return res.status(200).json({ success: true, data: budgets })
      } catch (error: any) {
        return res.status(500).json({ message: error.message })
      }
    }

    if (method === 'POST') {
      try {
        const { category, amount, period, startDate, endDate } = req.body
        const budget = await prisma.budget.create({
          data: {
            userId: user.id, category, amount, period,
            startDate: new Date(startDate), endDate: new Date(endDate),
          },
        })
        return res.status(201).json({ success: true, data: budget })
      } catch (error: any) {
        return res.status(500).json({ message: error.message })
      }
    }
  }

  return res.status(404).json({ message: 'Route not found' })
}

function authenticate(req: any) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'aureo-secret-key-2026')
  } catch {
    return null
  }
}
