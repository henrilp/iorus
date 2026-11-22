# 0002. Un moteur pur, déterministe et séparé du rendu

- Statut : Acceptée ; en partie remplacée par [0018](0018-phaser-4.md) (Phaser 4 au lieu de Phaser 3)
- Date : 2026-11-22

## Contexte

Le jeu doit pouvoir accélérer le temps sur des générations, rejouer une partie à l'identique pour comparer l'effet d'un seul réglage, et prouver que ses règles produisent des comportements connus. Le rendu visé est un village en pixel art, avec un zoom prévu plus tard entre trois échelles (interpersonnel, village, société).

## Options envisagées

1. Une logique de simulation mêlée aux scènes du moteur de jeu : rapide à démarrer, mais difficile à tester, impossible à faire tourner sans affichage, et liée au framework.
2. Un moteur de simulation en TypeScript pur, sans dépendance au rendu, déterministe grâce à un générateur aléatoire à graine. Le rendu se contente de lire son état.

## Décision

Option 2. Stack : TypeScript, Vite, Vitest, et Phaser 3 pour le rendu à venir (cartes en tuiles, sprites, zoom de caméra). Le moteur vit dans `src/sim/`, n'importe ni Phaser ni le DOM, et fait passer tout son aléa par `Rng` (mulberry32). Il expose `step()` (une saison) et `run()` / `runYears()` (sans rendu).

## Conséquences

- Même graine et mêmes réglages donnent exactement la même partie (testé). « Rejouer en changeant un seul paramètre » devient une vraie expérience contrôlée.
- On peut simuler des siècles en quelques millisecondes et tester le moteur sans navigateur.
- Le labo (`src/lab/`) et le futur jeu sont deux affichages du même moteur.
- Toute nouvelle source d'aléa doit passer par `Rng`, jamais par `Math.random`.
