import { useState, useCallback } from 'react'
import { X, Delete } from 'lucide-react'
import { cn } from '@/lib/data'

interface CalcPadProps {
  value: string
  onChange: (value: string) => void
  onDone: () => void
  onClose: () => void
}

export default function CalcPad({ value, onChange, onDone, onClose }: CalcPadProps) {
  const [display, setDisplay] = useState(value || '0')

  const handleDigit = useCallback((d: string) => {
    setDisplay(prev => {
      if (prev === '0' && d !== '.') return d
      if (d === '.' && prev.includes('.')) return prev
      if (prev.length >= 12) return prev
      return prev + d
    })
  }, [])

  const handleBackspace = useCallback(() => {
    setDisplay(prev => {
      if (prev.length <= 1) return '0'
      return prev.slice(0, -1)
    })
  }, [])

  const handleClear = useCallback(() => {
    setDisplay('0')
  }, [])

  const handleDone = useCallback(() => {
    const num = parseFloat(display)
    if (!isNaN(num) && num > 0) {
      onChange(String(num))
    }
    onDone()
  }, [display, onChange, onDone])

  const formatted = formatDisplay(display)

  const keys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['C', '0', '⌫'],
  ]

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Calculadora</span>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Display */}
        <div className="px-5 py-6 bg-gray-50 dark:bg-gray-800">
          <p className="text-right text-3xl font-bold text-gray-900 dark:text-white tabular-nums tracking-tight truncate">
            {formatted}
          </p>
        </div>

        {/* Keypad */}
        <div className="p-4 space-y-2">
          {keys.map((row, i) => (
            <div key={i} className="grid grid-cols-3 gap-2">
              {row.map(key => {
                const isAction = key === 'C' || key === '⌫'
                return (
                  <button
                    key={key}
                    onClick={() => {
                      if (key === 'C') handleClear()
                      else if (key === '⌫') handleBackspace()
                      else handleDigit(key)
                    }}
                    className={cn(
                      'h-14 rounded-xl text-lg font-semibold transition-all active:scale-[0.95]',
                      isAction
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    {key === '⌫' ? <Delete size={20} className="mx-auto" /> : key}
                  </button>
                )
              })}
            </div>
          ))}

          {/* Done button */}
          <button
            onClick={handleDone}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 active:scale-[0.98] transition-all text-sm"
          >
            Usar monto
          </button>
        </div>
      </div>
    </div>
  )
}

function formatDisplay(val: string): string {
  if (val === '0') return '0'
  const parts = val.split('.')
  const intPart = parts[0]
  const decPart = parts[1]
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return decPart !== undefined ? `${formatted}.${decPart}` : formatted
}
