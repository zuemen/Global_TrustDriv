/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vault: {
          900:    '#020617',
          800:    '#0f172a',
          700:    '#1e293b',
          accent: '#38bdf8',
          safe:   '#10b981',
          gold:   '#fbbf24',
        },
      },
      animation: {
        scan: 'scan 2s linear infinite',
      },
      keyframes: {
        scan: { '0%': { top: '0' }, '100%': { top: '100%' } },
      },
    },
  },
  plugins: [],
}
