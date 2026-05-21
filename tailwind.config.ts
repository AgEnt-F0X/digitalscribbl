import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paper surfaces — warmed in round 3 of doc 18 (Sunlit Lawn theme).
        // paper-100 went from #FFF9E6 → #FFF6D9 (~8% warmer toward golden hour).
        paper: {
          50:  '#FFFDF7',
          100: '#FFF6D9',
          200: '#FFF0C2',
          300: '#F4EAD8',
          400: '#EFDFBC',
          DEFAULT: '#FFF6D9',
        },
        cream: {
          50:  '#FFFDF7',
          100: '#FFF6D9',
          200: '#FFF0C2',
          DEFAULT: '#FFF6D9',
        },
        // Ink — text + dark surfaces
        ink: {
          900: '#1A1208',
          700: '#3D2E14',
          500: '#6B4E1E',
          300: '#A07040',
          100: '#D6C3A3',
          DEFAULT: '#1A1208',
        },
        // Brand — singular purple accent
        brand: {
          DEFAULT: '#6f54df',
          soft:    '#ECE8FB',
          hover:   '#5B41C9',
          ring:    'rgba(111, 84, 223, 0.30)',
        },
        // Whiteboard — round 4 of doc 18 (renamed from chalkboard).
        // Dry-erase board: off-white surface + aluminum frame.
        whiteboard: {
          surface:   '#F8F8F2',
          frame:     '#cfd5da',
          frameEdge: '#9ba2aa',
          DEFAULT:   '#F8F8F2',
        },
        // Marker palette — dry-erase colours, used on whiteboard text only.
        marker: {
          blue:  '#2563EB',
          black: '#1A1208',
          red:   '#D83F6B',
          green: '#5F8B48',
        },
        // Scribble palette — what users draw with on shirts
        scribble: {
          black:  '#2D2923',
          red:    '#E8453C',
          blue:   '#2563EB',
          green:  '#5F8B48',
          purple: '#7C3AED',
          orange: '#EA580C',
          yellow: '#D97706',
          pink:   '#D83F6B',
          teal:   '#0891B2',
        },
        // Shirt fabric colours (the t-shirt background)
        shirt: {
          white:  '#F8F8F8',
          cream:  '#F5F0E0',
          black:  '#1C1C1C',
          navy:   '#1E3A5F',
          sage:   '#6B8E6B',
        },
        // Status
        success: '#5F8B48',
        warning: '#D97706',
        danger:  '#D83F6B',
        info:    '#2563EB',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        hand:    ['var(--font-hand)', 'Caveat', 'cursive'],
        marker:  ['var(--font-marker)', 'Caveat', 'cursive'],
        body:    ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Slightly larger base for mobile readability
        'xs':    ['12px', { lineHeight: '16px' }],
        'sm':    ['14px', { lineHeight: '20px' }],
        'base':  ['16px', { lineHeight: '24px' }],
        'lg':    ['18px', { lineHeight: '28px' }],
        'xl':    ['20px', { lineHeight: '30px' }],
        '2xl':   ['24px', { lineHeight: '32px' }],
        '3xl':   ['30px', { lineHeight: '36px' }],
        '4xl':   ['36px', { lineHeight: '44px' }],
        '5xl':   ['48px', { lineHeight: '56px' }],
      },
      borderRadius: {
        'sketch-sm': '8px 10px 7px 9px',
        'sketch':    '14px 16px 13px 15px',
        'sketch-lg': '18px 16px 20px 15px',
        'sketch-xl': '24px 22px 26px 21px',
      },
      boxShadow: {
        'paper':       '0 12px 28px rgba(45, 35, 22, 0.08)',
        'paper-soft':  '0 6px 16px rgba(45, 35, 22, 0.05)',
        'paper-deep':  '0 18px 48px rgba(45, 35, 22, 0.10)',
        'sticker':     '0 8px 12px rgba(45, 35, 22, 0.12)',
        'pencil':      'inset 0 0 0 1px rgba(45, 41, 35, 0.12), 0 2px 6px rgba(45, 35, 22, 0.06)',
      },
      animation: {
        'paper-shimmer': 'paper-shimmer 1.8s ease-in-out infinite',
        'confetti-in':   'confetti-in 0.6s ease-out',
        'badge-bounce':  'badge-bounce 0.2s ease-out',
        'fade-in-up':    'fade-in-up 0.3s ease-out',
        'fade-in':       'fade-in 0.2s ease-out',
        'scribble-draw': 'scribble-draw 0.4s ease-out',
      },
      keyframes: {
        'paper-shimmer': {
          '0%, 100%': { opacity: '0.55' },
          '50%':       { opacity: '0.85' },
        },
        'confetti-in': {
          '0%':   { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        'badge-bounce': {
          '0%':   { transform: 'scale(1)' },
          '50%':  { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scribble-draw': {
          '0%':   { strokeDashoffset: '100', opacity: '0.4' },
          '100%': { strokeDashoffset: '0',   opacity: '1' },
        },
      },
      screens: {
        // Standard Tailwind + a small-mobile breakpoint
        'xs': '420px',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-top':    'env(safe-area-inset-top, 0px)',
        'nav-bottom':  'calc(72px + env(safe-area-inset-bottom, 0px))',
      },
    },
  },
  plugins: [],
}

export default config
