/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        warm: {
          50: '#fdfbf7',
          100: '#fbf7ef',
          200: '#f5eadb',
          300: '#edd8bd',
          400: '#e2be95',
          500: '#d7a270',
          600: '#ca8a59',
          700: '#a86f45',
          800: '#885a3c',
          900: '#6e4a34',
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
