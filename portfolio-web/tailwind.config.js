/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--primary))',
        secondary: 'hsl(var(--secondary))',
        accent: {
          gold: 'hsl(var(--accent-1))',
          yellow: 'hsl(var(--accent-2))',
        },
        darkText: 'hsl(var(--text-dark))',
        lightText: 'hsl(var(--text-light))',
        lightBg: {
          1: 'var(--light-bg-1)',
          2: 'var(--light-bg-2)',
          3: 'var(--light-bg-3)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}

