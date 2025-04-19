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
        green: {
          700: '#15803d', // Cor verde personalizada para o tema monárquico
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // Para melhorar os estilos dos formulários
  ],
}
