import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-[60vh] flex items-center justify-center"
    >
      <div className="text-center">
        <h1 className="text-9xl font-bold text-aureo mb-4">404</h1>
        <h2 className="text-3xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Button asChild>
          <Link to="/">
            <Home size={18} className="mr-2" />
            Go Home
          </Link>
        </Button>
      </div>
    </motion.div>
  )
}
