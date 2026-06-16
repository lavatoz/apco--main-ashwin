/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--theme-font-family)', 'sans-serif'],
      },
      colors: {
        primary: 'rgb(var(--primary-color-rgb) / <alpha-value>)',
      }
    },
  },
  plugins: [],
};
