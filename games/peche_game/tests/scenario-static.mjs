// ---------------------------------------------------------------------------
// Scénario 1 : intégrité « statique » du jeu (aucun code exécuté).
// Vérifie les fichiers, la cohérence index.html <-> script.js et le cache.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import { GAME_DIR, group, check, checkEqual } from './harness.mjs';

function read(name) {
    return fs.readFileSync(path.join(GAME_DIR, name), 'utf8');
}

export function run() {
    group('1) Fichiers du jeu');
    ['index.html', 'style.css', 'script.js', 'sound.js', 'README.md',
        'assets/three.module.js', 'assets/CREDITS.txt'].forEach(name => {
        check(name + ' présent', fs.existsSync(path.join(GAME_DIR, name)));
    });

    const html = read('index.html');
    const script = read('script.js');
    const css = read('style.css');

    group('2) Cohérence entre index.html et script.js');
    const demanded = [...new Set(
        [...script.matchAll(/getElementById\('([^']+)'\)/g)].map(m => m[1])
    )];
    check('le script réclame des éléments du DOM', demanded.length >= 10, demanded.length + ' identifiants');
    demanded.forEach(id => {
        check('id "' + id + '" présent dans index.html', html.includes('id="' + id + '"'));
    });

    group('3) Version de cache (style.css / script.js)');
    const cssVersion = html.match(/href="style\.css\?v=(\d+)"/);
    const jsVersion = html.match(/src="script\.js\?v=(\d+)"/);
    check('style.css versionné (?v=)', !!cssVersion, cssVersion ? cssVersion[1] : 'absent');
    check('script.js versionné (?v=)', !!jsVersion, jsVersion ? jsVersion[1] : 'absent');
    if (cssVersion && jsVersion) {
        checkEqual('même version de cache pour le CSS et le JS', jsVersion[1], cssVersion[1]);
    }

    group('4) Chargement de three.js');
    check('importmap déclaré', html.includes('type="importmap"'));
    check('« three » -> ./assets/three.module.js', html.includes('"./assets/three.module.js"'));
    check("script.js importe 'three'", script.includes("from 'three'"));
    check('script.js est un module', html.includes('type="module"'));

    group('4b) Compatible mobile / tactile');
    check('viewport adapté au mobile (largeur + pas de zoom)',
        html.includes('width=device-width') && html.includes('user-scalable=no'),
        'meta viewport');
    check('prise en charge des encoches (viewport-fit=cover)',
        html.includes('viewport-fit=cover'));
    check('couleur de la barre du navigateur (theme-color)',
        html.includes('theme-color'));
    check('bouton plein écran présent', html.includes('id="fullscreenButton"'));
    check('invite à passer en paysage', html.includes('id="rotateHint"'));
    check("l'interface respecte les zones sûres (safe-area)",
        css.includes('env(safe-area-inset'));
    check('pas de défilement / zoom accidentel au doigt',
        css.includes('touch-action: none') && css.includes('overscroll-behavior: none'));
    check('boutons adaptés au doigt (media query tactile)',
        css.includes('(pointer: coarse)'));
    check('invite affichée en portrait', css.includes('orientation: portrait'));
    check('pas de menu contextuel sur appui long (tactile)',
        script.includes("addEventListener('contextmenu'"));
    check('capture du pointeur pour un relâchement fiable',
        script.includes('setPointerCapture') && script.includes('releasePointerCapture'));
    check('adaptation du rendu au mobile (résolution limitée)',
        script.includes('isMobileDevice'));
}

export default run;
