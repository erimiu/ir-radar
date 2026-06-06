import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1B3A5B',
        accent: '#2E6FB7',
        soft: '#E8F0FA',
        surface: '#F7F9FC',
        sub: '#6B7785',
        line: '#E3E8EF',
        danger: '#C0392B',
      },
    },
  },
  plugins: [],
}
export default config
