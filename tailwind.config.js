/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'fast-green': {
          light: '#66BB6A',
          DEFAULT: '#4CAF50',
          dark: '#2E7D32',
        },
        phase: {
          digesting: '#FF9800',
          glycogen: '#FFC107',
          'fat-burning': '#FF5722',
          'deep-fat-burning': '#D32F2F',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
  // Avoid conflicts with MUI styles
  important: '#root',
};
