import { useState, useCallback, useEffect } from 'react'
import { cn, CURRENCIES } from '@/lib/data'
import CalcPad from '@/components/CalcPad'
import { Calculator } from 'lucide-react'

interface InputCurrencyProps {
  value: string
  onChange: (value: string) => void
  currency?: string
  placeholder?: string
  className?: string
  label?: string
}

/**
 * InputCurrency — Smart currency input with auto-formatting.
 * - Displays numbers with thousand separators (1,000,000)
 * - Calculator pad on icon click
 * - Native number input fallback
 */
export default function InputCurrency({
  value,
  onChange,
  currency = 'MXN',
  placeholder = '0',
  className,
  label,
}: InputCurrencyProps) {
  const [display, setDisplay] = useState('')
  const [showCalc, setShowCalc] = useState(false)
  const [focused, setFocused] = useState(false)

  // Format value for display
  useEffect(() => {
    if (!focused && value) {
      const num = parseFloat(value)
      if (!isNaN(num)) {
        const sym = CURRENCIES[currency]?.symbol || '$'
        setDisplay(`${sym} ${num.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`)
        return
      }
    }
    setDisplay(value || '')
  }, [value, currency, focused])

  const handleCalcDone = useCallback((rawValue: string) => {
    onChange(rawValue)
  }, [onChange])

  const sym = CURRENCIES[currency]?.symbol || '$'

  return (
    <div className={className}>
      {label && (
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {/* Currency symbol prefix */}
        {!focused && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm pointer-events-none">
            {sym}
          </span>
        )}

        <input
          type={focused ? 'text' : 'text'}
          inputMode="decimal"
          value={focused ? value : display}
          placeholder={placeholder}
          onFocus={() => {
            setFocused(true)
            setDisplay(value || '')
          }}
          onBlur={() => {
            setFocused(false)
          }}
          onChange={e => {
            const raw = e.target.value.replace(/[^0-9.]/g, '')
            onChange(raw)
          }}
          className={cn(
            'w-full h-14 pl-10 pr-12 rounded-xl text-xl font-bold',
            'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
            'text-gray-900 dark:text-white',
            'placeholder:text-gray-300 dark:placeholder:text-gray-600',
            'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
            'transition-all duration-150 outline-none tabular-nums',
          )}
        />

        {/* Calculator trigger */}
        <button
          type="button"
          onClick={() => setShowCalc(true)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          <Calculator size={16} />
        </button>
      </div>

      {/* Calculator Pad */}
      {showCalc && (
        <CalcPad
          value={value}
          onChange={handleCalcDone}
          onDone={() => setShowCalc(false)}
          onClose={() => setShowCalc(false)}
        />
      )}
    </div>
  )
}
