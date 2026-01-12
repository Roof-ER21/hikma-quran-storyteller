/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./*.tsx",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark mode accent colors - inviting & powerful
        dark: {
          bg: '#0f0f14',
          card: '#1a1a24',
          border: '#2a2a3a',
          surface: '#252532',
          elevated: '#2d2d3d',
        },
        accent: {
          gold: '#d4a853',
          rose: '#e8849a',
          emerald: '#4ade80',
          cyan: '#22d3ee',
        }
      },
      backgroundImage: {
        'dark-gradient': 'linear-gradient(to bottom right, #0f0f14, #1a1a24, #151520)',
        'dark-card': 'linear-gradient(135deg, #1a1a24 0%, #252532 100%)',
        'gold-shimmer': 'linear-gradient(90deg, #d4a853, #f5d485, #d4a853)',
      },
      boxShadow: {
        'dark-glow': '0 0 20px rgba(212, 168, 83, 0.15)',
        'dark-lg': '0 10px 40px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
};
