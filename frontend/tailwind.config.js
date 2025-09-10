/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Panorama 360 App фирменные цвета
        primary: {
          50: '#fff7ed',
          100: '#ffedd5', 
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FF6B1A', // Основной оранжевый
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        sunset: {
          orange: '#FF6B1A',
          red: '#FF3C00',
          yellow: '#FFD36B',
        },
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#9D4EDD', // Лиловый
          600: '#663399', // Средний фиолетовый
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#2B1D52', // Тёмный фиолетовый
        },
        accent: {
          blue: '#1E293B', // Синий акцентный
          gray: '#F4F4F8', // Светло-серый фон
        },
        secondary: {
          50: '#fafaf9',
          100: '#f4f4f3',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}