import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bilibili-pink': '#fb7299',
      },
      animation: {
        'highlight-fade': 'highlightFade 0.3s ease-in-out',
      },
      keyframes: {
        highlightFade: {
          '0%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: '#fef08a' },
          '100%': { backgroundColor: '#fef3c7' },
        },
      },
    },
  },
  plugins: [],
}

export default config

