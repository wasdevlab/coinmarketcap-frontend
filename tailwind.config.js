module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        dark: {
          900: '#0B0E11',
          800: '#151A1F',
          700: '#1E2329',
        },
        brand: {
          green: '#0ECB81',
          red: '#F6465D',
          text: '#EAECEF',
          muted: '#848E9C',
        },
      },
    },
  },
  plugins: [],
};
