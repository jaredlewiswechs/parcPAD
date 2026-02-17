import React from 'react';
import { clsx } from '../../lib/clsx';

export interface GlassPanelProps {
  children:   React.ReactNode;
  variant?:   'default' | 'elevated' | 'inset';
  status?:    'fin' | 'finfr' | 'pending' | 'neutral';
  className?: string;
  padding?:   'none' | 'sm' | 'md' | 'lg';
  as?:        keyof React.JSX.IntrinsicElements;
  onClick?:   () => void;
}

const paddingMap = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-6',
};

const variantMap = {
  default:  'glass-panel',
  elevated: 'glass-panel-elevated',
  inset:    'glass-panel-inset',
};

const statusMap = {
  neutral: '',
  fin:     'glass-panel-fin',
  finfr:   'glass-panel-finfr',
  pending: 'glass-panel-pending',
};

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  variant  = 'default',
  status   = 'neutral',
  padding  = 'md',
  className,
  as: Tag  = 'div',
  onClick,
}) => {
  return (
    <Tag
      className={clsx(
        variantMap[variant],
        statusMap[status],
        paddingMap[padding],
        onClick && 'cursor-pointer hover:brightness-105 transition-all duration-150',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
};
