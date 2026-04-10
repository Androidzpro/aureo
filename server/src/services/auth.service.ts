import bcrypt from 'bcrypt'
import prisma from '../lib/prisma'
import { generateToken } from '../utils/jwt'
import { sendError } from '../utils/response'
import { Response } from 'express'

export class AuthService {
  async register(name: string, email: string, password: string, res: Response) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) {
        return sendError(res, 'User already exists', 400)
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      })

      // Generate token
      const token = generateToken(user.id, user.email)

      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { user, token },
      })
    } catch (error: any) {
      return sendError(res, error.message || 'Registration failed', 500)
    }
  }

  async login(email: string, password: string, res: Response) {
    try {
      // Find user
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        return sendError(res, 'Invalid credentials', 401)
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return sendError(res, 'Invalid credentials', 401)
      }

      // Generate token
      const token = generateToken(user.id, user.email)

      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      }

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: { user: userData, token },
      })
    } catch (error: any) {
      return sendError(res, error.message || 'Login failed', 500)
    }
  }

  async getProfile(userId: string, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      })

      if (!user) {
        return sendError(res, 'User not found', 404)
      }

      return res.status(200).json({
        success: true,
        data: user,
      })
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to get profile', 500)
    }
  }
}
