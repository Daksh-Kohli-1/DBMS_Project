/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'ui-sans-serif'],
        display: ['var(--font-display)', 'ui-serif'],
      },
      colors: {
        stone: {
          50:  '#fafaf9',
          100: '#f5f5f4',
          150: '#eeede9',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
        sage: {
          50:  '#f2f4f0',
          100: '#e2e8dc',
          200: '#c4d1b9',
          300: '#9db58e',
          400: '#769665',
          500: '#5a7a4a',
          600: '#47623a',
          700: '#384d2d',
          800: '#2a3922',
          900: '#1e2a18',
        },
        clay: {
          50:  '#faf5f0',
          100: '#f0e4d4',
          200: '#dfc5a3',
          300: '#c9a070',
          400: '#b47d48',
          500: '#9a6535',
          600: '#7d5029',
          700: '#613d1f',
          800: '#472d17',
          900: '#2e1d0e',
        },
      },
    },
  },
  plugins: [],
}
