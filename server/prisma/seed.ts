import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create demo user
  const hashedPassword = await bcrypt.hash('password123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'demo@aureo.app' },
    update: {},
    create: {
      email: 'demo@aureo.app',
      name: 'Demo User',
      password: hashedPassword,
    },
  })

  console.log('✅ User created:', user.email)

  // Create sample transactions
  const transactions = await Promise.all([
    prisma.transaction.create({
      data: {
        userId: user.id,
        amount: 3200,
        type: 'INCOME',
        category: 'Salary',
        description: 'Monthly salary',
        date: new Date('2026-04-10'),
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        amount: 85.50,
        type: 'EXPENSE',
        category: 'Food',
        description: 'Groceries',
        date: new Date('2026-04-09'),
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        amount: 15.99,
        type: 'EXPENSE',
        category: 'Entertainment',
        description: 'Netflix subscription',
        date: new Date('2026-04-08'),
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        amount: 50,
        type: 'EXPENSE',
        category: 'Health',
        description: 'Gym membership',
        date: new Date('2026-04-07'),
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        amount: 500,
        type: 'INCOME',
        category: 'Freelance',
        description: 'Freelance project',
        date: new Date('2026-04-06'),
      },
    }),
  ])

  console.log('✅ Transactions created:', transactions.length)

  // Create sample budgets
  const budgets = await Promise.all([
    prisma.budget.create({
      data: {
        userId: user.id,
        category: 'Food',
        amount: 600,
        period: 'MONTHLY',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-30'),
      },
    }),
    prisma.budget.create({
      data: {
        userId: user.id,
        category: 'Entertainment',
        amount: 150,
        period: 'MONTHLY',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-30'),
      },
    }),
    prisma.budget.create({
      data: {
        userId: user.id,
        category: 'Transport',
        amount: 200,
        period: 'MONTHLY',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-30'),
      },
    }),
    prisma.budget.create({
      data: {
        userId: user.id,
        category: 'Shopping',
        amount: 300,
        period: 'MONTHLY',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-30'),
      },
    }),
  ])

  console.log('✅ Budgets created:', budgets.length)

  console.log('✨ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
