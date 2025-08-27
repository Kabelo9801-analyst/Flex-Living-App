import type { Config } from 'tailwindcss'
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f8ff",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1"
        }
      }
    }
  },
  plugins: []
}
export default config
