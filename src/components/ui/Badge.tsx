import type { ReactNode } from 'react';

type BadgeTone = 'success' | 'error' | 'info' | 'neutral';
type BadgeVariant = 'solid' | 'muted';

interface BadgeProps {
  tone: BadgeTone;
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}

const TONE_CLASS: Record<BadgeVariant, Record<BadgeTone, string>> = {
  solid: {
    success: 'bg-semantic-success text-white',
    error: 'bg-semantic-error text-white',
    info: 'bg-brand-blue text-white',
    neutral: 'bg-neutral-mid text-white',
  },
  muted: {
    success: 'bg-semantic-success-muted text-semantic-success-dark',
    error: 'bg-semantic-error/10 text-semantic-error',
    info: 'bg-brand-blue/10 text-brand-blue',
    neutral: 'bg-surface-cream text-neutral-mid',
  },
};

export default function Badge({ tone, variant = 'muted', className = '', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold ${TONE_CLASS[variant][tone]} ${className}`}>
      {children}
    </span>
  );
}
