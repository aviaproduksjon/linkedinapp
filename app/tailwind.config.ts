import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Category colors (see docs/05-kategorier.md §Farger).
        category: {
          'give-value': '#eab308',
          'slik-tenker-vi': '#1e3a8a',
          'hjelpe-markedssjefer': '#16a34a',
          'vise-suksess': '#7c3aed',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
