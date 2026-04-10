import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Creando usuario admin...')

  const email = 'demo@aureo.app'
  const password = 'Aureo2026!'
  const name = 'Demo User'

  // Check if exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log('⚠️  User already exists:', email)
    return
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
  })

  console.log('✅ User created!')
  console.log('')
  console.log('📧 Email:', email)
  console.log('🔑 Password:', password)
  console.log('')
  console.log('Use these credentials to log in.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
