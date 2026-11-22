import { defineConfig } from 'vitest/config';

// base relatif : le site est servi sous /iorus/ sur GitHub Pages.
export default defineConfig({
  base: './',
  test: {
    include: ['src/**/*.test.ts'],
  },
});
