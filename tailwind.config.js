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
        brand: {
          50: '#f0f3ff',
          100: '#e1e7ff',
          200: '#c8d4ff',
          300: '#a3b5ff',
          400: '#7a8cff',
          500: '#4f5cff',
          600: '#3b3fff',
          700: '#2c2be6',
          800: '#2322bd',
          900: '#212296',
          950: '#131258',
        },
        navy: {
          50: '#f4f6fa',
          100: '#e8ecf4',
          200: '#cbd6e7',
          300: '#a0b5d3',
          400: '#6f8fb8',
          500: '#4c6f9b',
          600: '#3a577f',
          700: '#304667',
          800: '#293a55',
          900: '#0f172a', /* slate-900 */
          950: '#030712', /* gray-950 - Stripe/Linear dark */
          border: '#1e293b',
          card: '#0f172a',
          cardMuted: '#1e293b'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 8px 32px 0 rgba(3, 7, 18, 0.4)',
        'premium-light': '0 4px 20px 0 rgba(0, 0, 0, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.02)',
      },
    },
  },
  plugins: [],
}
