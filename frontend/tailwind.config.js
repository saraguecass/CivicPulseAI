/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ser-verde': '#16a34a',
        'ser-azul': '#2563eb',
      }
    },
  },
  plugins: [],
}
