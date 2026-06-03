import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Legacy aliases kept for internal ui/ components
        dark: {
          bg:             '#080810',
          surface:        '#0f0f1a',
          elevated:       '#161624',
          border:         '#1e1e32',
          'border-hi':    '#4f46e5',
        },
        // Semantic palette
        'c-base':     '#080810',
        'c-surface':  '#0f0f1a',
        'c-elevated': '#161624',
        'c-border':   '#1e1e32',
        'c-focus':    '#4f46e5',
        'c-fg':       '#e8e8f0',
        'c-muted':    '#6b6b8a',
        'c-accent':   '#4f46e5',
        'c-positive': '#10b981',
        'c-warning':  '#f59e0b',
        'c-negative': '#ef4444',
        'c-gold':     '#fbbf24',
        'c-silver':   '#94a3b8',
        'c-bronze':   '#c07a3a',
      },
      fontFamily: {
        sans:  ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono:  ['var(--font-dm-mono)', 'ui-monospace', 'monospace'],
        syne:  ['var(--font-syne)', 'sans-serif'],
      },
      transitionDuration: {
        '150': '150ms',
      },
    },
  },
  plugins: [],
}

export default config
