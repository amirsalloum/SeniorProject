/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Adds Inter as the default sans-serif font
      },
      screens: {
        'xs': '450px', // Custom breakpoint for 450px screens
      },
      height: {
        '15.5': '60px',
      },
      backgroundImage: {
        'dashboard-gradient': 'linear-gradient(90deg, #1f4061 6%, #92afcf 100%)',
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease',
        slideDown: 'slideDown 0.3s ease',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideDown: {
          '0%': { transform: 'translateY(-50px)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hidden': {
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          '&::-moz-scrollbar': {
            display: 'none',
          },
        },
      });
    },
  ],
}