import { AnimatePresence, motion } from 'framer-motion'
import { X, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/data'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center" onClick={onCancel}>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ type: 'spring', damping: 25 }}
            className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm border border-gray-100 dark:border-gray-800 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 text-center">
              {danger && <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-3"><AlertTriangle size={24} className="text-red-500" /></div>}
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{message}</p>
            </div>
            <div className="flex gap-2 p-4 pt-0">
              <button onClick={onCancel} className="flex-1 h-11 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl text-xs">{cancelLabel}</button>
              <button onClick={onConfirm} className={cn('flex-1 h-11 text-white font-medium rounded-xl text-xs', danger ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-indigo-500 to-purple-600')}>{confirmLabel}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg ${className}`} />
}

export function EmptyState({ emoji, title, message, action, actionLabel }: { emoji: string; title: string; message: string; action?: () => void; actionLabel?: string }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4"><span className="text-3xl">{emoji}</span></div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
      <p className="text-xs text-gray-400 mt-1 max-w-xs">{message}</p>
      {action && <button onClick={action} className="mt-4 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-300/30 dark:shadow-indigo-900/50">{actionLabel}</button>}
    </div>
  )
}
