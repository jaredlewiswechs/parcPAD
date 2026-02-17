import React from 'react';
import { clsx } from '@/lib/clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  'primary' | 'secondary' | 'ghost' | 'danger';
  size?:     'sm' | 'md' | 'lg';
  loading?:  boolean;
  leftIcon?: React.ReactNode;
}

const variantMap = {
  primary:
    'bg-sequoia-sage text-white hover:bg-sequoia-forest active:scale-95 ' +
    'shadow-sm shadow-sequoia-sage/20',
  secondary:
    'glass-panel text-stone-800 dark:text-stone-100 hover:brightness-105 active:scale-95',
  ghost:
    'bg-transparent text-stone-600 dark:text-stone-300 hover:bg-black/5 ' +
    'dark:hover:bg-white/8 active:scale-95',
  danger:
    'bg-sequoia-berry text-white hover:brightness-90 active:scale-95 ' +
    'shadow-sm shadow-sequoia-berry/20',
};

const sizeMap = {
  sm: 'px-3 py-1.5 text-sm rounded-xl min-h-[36px]',
  md: 'px-4 py-2   text-base rounded-2xl min-h-[44px]',
  lg: 'px-6 py-3   text-lg rounded-2xl min-h-[52px]',
};

export const Button: React.FC<ButtonProps> = ({
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  leftIcon,
  children,
  className,
  disabled,
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium',
        'transition-all duration-150 select-none',
        'focus-visible:outline-2 focus-visible:outline-sequoia-sage focus-visible:outline-offset-2',
        variantMap[variant],
        sizeMap[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden />
      ) : leftIcon}
      {children}
    </button>
  );
};
