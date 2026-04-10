import jwt from 'jsonwebtoken'

export const generateToken = (userId: string, email: string): string => {
  return jwt.sign(
    { id: userId, email },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

export const verifyToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET!)
}
