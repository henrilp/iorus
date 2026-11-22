import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// base relatif : le site est servi sous /iorus/ sur GitHub Pages.
// Deux pages : le labo du moteur (racine) et le jeu (jeu/), pour que le labo ne charge pas Phaser.
export default defineConfig({
  base: './',
  build: {
    // Phaser pèse à lui seul environ 1,4 Mo (370 ko compressés) ; il n'est chargé que par la page du jeu.
    chunkSizeWarningLimit: 1600,
    rolldownOptions: {
      input: {
        lab: resolve(import.meta.dirname, 'index.html'),
        jeu: resolve(import.meta.dirname, 'jeu/index.html'),
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
