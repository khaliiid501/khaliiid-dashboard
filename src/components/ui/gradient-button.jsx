import React from 'react';
import { cn } from '@/lib/utils';

export default function GradientButton({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'default',
  disabled = false,
  className,
  icon: Icon
}) {
  const variants = {
    primary: 'bg-gradient-to-l from-blue-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98]',
    secondary: 'bg-gradient-to-l from-purple-500 to-blue-500 text-white hover:shadow-lg hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98]',
    outline: 'border-2 border-transparent bg-gradient-to-l from-blue-500 to-emerald-500 bg-clip-border hover:shadow-md',
    ghost: 'hover:bg-gradient-to-l hover:from-blue-50 hover:to-emerald-50 text-slate-700'
  };

  const sizes = {
    sm: 'h-9 px-4 text-sm',
    default: 'h-11 px-6 text-base',
    lg: 'h-14 px-8 text-lg'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
}