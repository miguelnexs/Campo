/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tierra: {
          50: '#FAF6EF',
          100: '#F2E9DB',
          200: '#E4D2B7',
          300: '#CFB086',
          400: '#B58955',
          500: '#9A6B3A',
          600: '#7C5129',
          700: '#5E3B1E',
          800: '#422916',
          900: '#2A1A0E',
          950: '#180E07',
        },
        campo: {
          50: '#F0F9F2',
          100: '#DAF1E0',
          200: '#B7E2C4',
          300: '#85CC9D',
          400: '#4FB072',
          500: '#2E8E52',
          600: '#1F703E',
          700: '#1A5933',
          800: '#17472B',
          900: '#143B24',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
}
