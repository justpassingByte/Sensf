/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#07080b',
          900: '#0b0e14',
          850: '#0f121a',
          800: '#141824',
          700: '#1d2334',
        },
        volt: {
          500: '#00e599',
          600: '#00c280',
          700: '#009963',
          glow: 'rgba(0, 229, 153, 0.25)',
        },
        tactical: {
          dark: '#0b0e14',
          card: '#121622',
          border: 'rgba(255, 255, 255, 0.08)',
          accent: '#00e599',
          danger: '#ff3366',
          amber: '#ffaa00'
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'volt-glow': '0 0 25px rgba(0, 229, 153, 0.25)',
        'hero-card': '0 10px 40px -10px rgba(0, 0, 0, 0.7)',
        'panel-subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.5)'
      }
    },
  },
  plugins: [],
}
