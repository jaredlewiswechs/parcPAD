/** Sequoia palette — earthy National Park meets Apple Liquid Glass */
export const sequoia = {
  bg: {
    deep:     '#1C1917',
    base:     '#292524',
    elevated: '#44403C',
    light:    '#F5F0EB',
    cream:    '#FAF7F2',
    sand:     '#E8E0D4',
  },
  accent: {
    sage:   '#6B8F71',
    forest: '#2D5016',
    cedar:  '#8B4513',
    clay:   '#C67B4E',
    sky:    '#6BA3BE',
    sunset: '#D4845A',
    berry:  '#9B2D30',
    gold:   '#C9A84C',
  },
  fin:     '#6B8F71',
  finfr:   '#9B2D30',
  pending: '#C9A84C',
  witness: '#6BA3BE',
  glass: {
    light:  'rgba(245,240,235,0.72)',
    dark:   'rgba(28,25,23,0.68)',
    border: 'rgba(255,255,255,0.12)',
    glow:   'rgba(107,143,113,0.15)',
  },
} as const;

export type NewtonResult = 'fin' | 'finfr' | 'pending';

export const resultColor: Record<NewtonResult, string> = {
  fin:     sequoia.fin,
  finfr:   sequoia.finfr,
  pending: sequoia.pending,
};

export const resultLabel: Record<NewtonResult, string> = {
  fin:     'Admissible',
  finfr:   'Forbidden',
  pending: 'Pending',
};
