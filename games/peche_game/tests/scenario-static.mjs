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
}

export default run;
