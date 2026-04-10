import { Request, Response } from 'express'
import { AuthService } from '../services/auth.service'
import { AuthRequest } from '../middleware/auth'

const authService = new AuthService()

export class AuthController {
  async register(req: Request, res: Response) {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    await authService.register(name, email, password, res)
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    await authService.login(email, password, res)
  }

  async getProfile(req: AuthRequest, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    await authService.getProfile(req.user.id, res)
  }
}

export default new AuthController()
