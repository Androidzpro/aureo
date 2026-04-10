import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/data'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95',
  { variants: { variant: { default: 'gradient-primary text-white shadow-lg shadow-indigo-200', outline: 'border border-input bg-background hover:bg-accent', ghost: 'hover:bg-accent', destructive: 'bg-red-500 text-white hover:bg-red-600' }, size: { default: 'h-10 px-4 py-2', sm: 'h-9 rounded-lg px-3', lg: 'h-12 rounded-xl px-6 text-base', icon: 'h-10 w-10' } },
    defaultVariants: { variant: 'default', size: 'default' } }
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
})
Button.displayName = 'Button'
export { Button, buttonVariants }
