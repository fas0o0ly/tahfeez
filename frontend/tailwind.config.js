/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary greens
        forest: {
          50:  '#f0f7f4',
          100: '#dceee6',
          200: '#bbddd0',
          300: '#8ec4b0',
          400: '#5da38e',
          500: '#3c8571',
          600: '#2d6a4f',   // primary brand green
          700: '#1f4d38',
          800: '#1a3f2e',
          900: '#163326',
          950: '#0b1f17',
        },
        // Accent golds
        gold: {
          50:  '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#d4af37',   // primary gold
          600: '#b8962e',
          700: '#927519',
          800: '#715b11',
          900: '#4a3c0b',
        },
        // Warm neutrals
        cream: {
          50:  '#fdfaf4',
          100: '#faf4e8',
          200: '#f5ebd4',
          300: '#edddb8',
          400: '#e0c98f',
          500: '#d3b56a',
        },
        // Dark backgrounds
        obsidian: {
          800: '#1a1f1c',
          900: '#111714',
          950: '#080c0a',
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body:    ['DM Sans', 'system-ui', 'sans-serif'],
        arabic:  ['Amiri', 'serif'],
        ui:      ['Noto Naskh Arabic', 'serif'],
      },
      backgroundImage: {
        'geometric-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232d6a4f' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(45, 106, 79, 0.3)',
        'glow-gold':  '0 0 20px rgba(212, 175, 55, 0.25)',
        'card':       '0 4px 24px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-in':     'fadeIn 0.5s ease forwards',
        'slide-up':    'slideUp 0.5s ease forwards',
        'pulse-slow':  'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};