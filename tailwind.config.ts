import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      colors: {
        builder: {
          primary: '#EAB308',
          accent: '#FDD835',
          dark: '#1a1a1a',
          light: '#f5f5f5',
        },
      },
      backgroundImage: {
        'gradient-to-br': 'linear-gradient(to bottom right, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config
