// Bundle Vite du jeu de pêche (games/peche_game).
// - Le code source reste exécutable SANS build (GitHub Pages sert les sources).
// - « three » pointe vers la copie locale (aucun CDN, aucune dépendance npm de three).
// - Les ressources chargées à l'exécution (./assets/...) sont copiées telles quelles.
import { defineConfig } from 'vite';
import { cpSync } from 'node:fs';
import { resolve } from 'node:path';
import { VitePWA } from 'vite-plugin-pwa';

const racine = resolve(import.meta.dirname, 'games/peche_game');

export default defineConfig({
  root: racine,
  base: './',
  resolve: { alias: { three: resolve(racine, 'assets/three.module.js') } },
  publicDir: false,
  build: {
    outDir: resolve(import.meta.dirname, 'dist/peche_game'),
    emptyOutDir: true,
    assetsDir: 'bundle',
    target: 'es2022',
    rollupOptions: {
      input: {
        index: resolve(racine, 'index.html'),
        matrice: resolve(racine, 'matrice.html'),
        tailles: resolve(racine, 'tailles.html'),
      },
    },
  },
  plugins: [
    // PWA : installable (Android, iOS, ordinateur), jouable hors ligne.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: "L'étang du Bois Neuf",
        short_name: 'Pêche',
        lang: 'fr',
        start_url: './',
        scope: './',
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'landscape',
        background_color: '#0a1a26',
        theme_color: '#0a1a26',
        icons: [
          { src: 'icons/icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        globIgnores: ['assets/**'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Textures, sons, modèles : mis en cache à la première lecture.
        runtimeCaching: [{
          urlPattern: ({ url }) => /\/assets\//.test(url.pathname),
          handler: 'CacheFirst',
          options: { cacheName: 'peche-assets', expiration: { maxEntries: 200 } },
        }],
      },
    }),
    {
    name: 'copie-assets',
    closeBundle() {
      cpSync(resolve(racine, 'assets'), resolve(import.meta.dirname, 'dist/peche_game/assets'), { recursive: true });
    },
  }],
});
