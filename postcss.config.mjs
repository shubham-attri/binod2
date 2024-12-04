/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
  exclude: ['**/*.tsx', '**/*.ts'],
};

export default config;
