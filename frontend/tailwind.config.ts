import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sequoia: {
          'bg-deep':    '#1C1917',
          'bg-base':    '#292524',
          'bg-elevated':'#44403C',
          'bg-light':   '#F5F0EB',
          'bg-cream':   '#FAF7F2',
          'bg-sand':    '#E8E0D4',
          sage:         '#6B8F71',
          forest:       '#2D5016',
          cedar:        '#8B4513',
          clay:         '#C67B4E',
          sky:          '#6BA3BE',
          sunset:       '#D4845A',
          berry:        '#9B2D30',
          gold:         '#C9A84C',
          fin:          '#6B8F71',
          finfr:        '#9B2D30',
          pending:      '#C9A84C',
          witness:      '#6BA3BE',
        },
      },
      fontFamily: {
        ui:      ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono:    ['SF Mono', 'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'monospace'],
        heading: ['Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', 'Palatino', 'Georgia', 'serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'pulse-soft':  'pulse-soft 3s ease-in-out infinite',
        'pulse-warm':  'pulse-warm 1.5s ease-in-out infinite',
        'trail':       'trail 1.8s ease-in-out infinite',
        'glow-sage':   'glow-sage 2s ease-in-out infinite',
        'glow-berry':  'glow-berry 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1',   transform: 'scale(1)' },
          '50%':       { opacity: '0.6', transform: 'scale(0.95)' },
        },
        'pulse-warm': {
          '0%, 100%': { opacity: '1',   transform: 'scale(1)' },
          '50%':       { opacity: '0.5', transform: 'scale(0.9)' },
        },
        'trail': {
          '0%':   { strokeDashoffset: '200' },
          '100%': { strokeDashoffset: '-200' },
        },
        'glow-sage': {
          '0%, 100%': { boxShadow: '0 0 6px 2px rgba(107,143,113,0.5)' },
          '50%':       { boxShadow: '0 0 12px 4px rgba(107,143,113,0.8)' },
        },
        'glow-berry': {
          '0%, 100%': { boxShadow: '0 0 6px 2px rgba(155,45,48,0.5)' },
          '50%':       { boxShadow: '0 0 12px 4px rgba(155,45,48,0.8)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
