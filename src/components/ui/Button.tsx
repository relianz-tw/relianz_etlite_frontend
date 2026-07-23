'use client';

import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'outline' | 'warm' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  children?: ReactNode;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-blue text-white border border-transparent hover:bg-brand-blue-dark focus-visible:ring-brand-blue/30',
  outline: 'bg-white text-brand-blue border border-brand-blue hover:bg-brand-blue/5 focus-visible:ring-brand-blue/20',
  warm: 'bg-brand-tan text-white border border-transparent hover:bg-brand-tan-dark focus-visible:ring-brand-tan-dark/40',
  ghost: 'bg-white text-neutral-dark border border-neutral-blue-gray/50 hover:bg-surface-cream focus-visible:ring-neutral-blue-gray/50',
  danger: 'bg-semantic-error text-white border border-transparent hover:brightness-95 focus-visible:ring-semantic-error/30',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[13px] gap-1.5',
  md: 'px-4 py-2 text-sm gap-1.5',
  lg: 'px-6 py-3 text-base gap-2',
};

const ICON_SIZE: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18 };

export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-45 ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`}
      {...rest}
    >
      {Icon && iconPosition === 'left' && <Icon size={ICON_SIZE[size]} />}
      {children}
      {Icon && iconPosition === 'right' && <Icon size={ICON_SIZE[size]} />}
    </button>
  );
}
