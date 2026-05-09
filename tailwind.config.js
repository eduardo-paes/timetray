/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        obs: {
          950: '#0A0908',
          900: '#12100E',
          800: '#1D1A17',
          700: '#26211D',
          600: '#2E2722',
          500: '#2A241F',
          400: '#201C19',
        },
        copper: {
          DEFAULT: '#C87A2B',
          bright: '#E89A47',
          muted: '#9E5D1F',
        },
        steel: {
          primary: '#F5F0EA',
          secondary: '#B8ADA2',
          muted: '#7F756C',
          disabled: '#5B534D',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
