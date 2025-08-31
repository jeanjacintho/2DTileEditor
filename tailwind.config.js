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
        'custom-color': '#5964ea',
      }
    },
  },
  plugins: [],
}

