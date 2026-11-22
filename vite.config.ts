import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// base relatif : le site est servi sous /iorus/ sur GitHub Pages.
// Trois pages : le labo du moteur (racine), le prototype en texte d'une vie (vie/) et le jeu (jeu/),
// pour que le labo et le prototype ne chargent pas Phaser.
export default defineConfig({
  base: './',
  build: {
    // Phaser pèse à lui seul environ 1,4 Mo (370 ko compressés) ; il n'est chargé que par la page du jeu.
    chunkSizeWarningLimit: 1600,
    rolldownOptions: {
      input: {
        lab: resolve(import.meta.dirname, 'index.html'),
        vie: resolve(import.meta.dirname, 'vie/index.html'),
        jeu: resolve(import.meta.dirname, 'jeu/index.html'),
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
