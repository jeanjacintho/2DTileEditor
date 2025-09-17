/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'custom-white': '#f1f2f3',
        'custom-light-gray': '#404248',
        'custom-medium-gray': '#2b2d31',
        'custom-black': '#1e1f22',
        'custom-pure-black': '#000000',
        'custom-color': '#8a2be2',
        'custom-color-dark': '#7b1fa2',
      }
    },
  },
  plugins: [],
}

