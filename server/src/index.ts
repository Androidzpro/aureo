import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { errorHandler } from './middleware/errorHandler'
import { rateLimiter } from './middleware/rateLimiter'
import authRoutes from './routes/auth.routes'
import transactionRoutes from './routes/transaction.routes'
import budgetRoutes from './routes/budget.routes'

// Load environment variables
dotenv.config()

const app: Application = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet()) // Security headers
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(compression()) // Compress responses
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev')) // Logging

// Rate limiting
app.use('/api', rateLimiter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/budgets', budgetRoutes)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// Error handler
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app
