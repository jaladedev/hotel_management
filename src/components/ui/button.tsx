import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'accent' | 'ghost' | 'danger'
}

const VARIANT_STYLES: Record<string, string> = {
  primary: 'bg-indigo-700 text-paper hover:bg-indigo-800',
  accent: 'bg-brass-600 text-paper hover:bg-brass-700',
  ghost: 'bg-transparent text-ink-soft hover:bg-paper-dim',
  danger: 'bg-status-bad text-paper hover:opacity-90',
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${VARIANT_STYLES[variant]} ${className}`}
      {...props}
    />
  )
}