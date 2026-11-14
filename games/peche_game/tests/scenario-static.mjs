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
        'assets/three.module.js', 'assets/CREDITS.txt',
        'assets/sol-herbe.jpg', 'assets/ecorce.jpg', 'assets/vase.jpg', 'assets/eau-normales.jpg'].forEach(name => {
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

    group('3b) Modules importés versionnés (anti-cache)');
    const soundImport = script.match(/from '\.\/sound\.js\?v=(\d+)'/);
    check("script.js importe sound.js avec une version (?v=)", !!soundImport,
        soundImport ? soundImport[1] : 'absent');
    if (jsVersion && soundImport) {
        checkEqual('même version pour sound.js et index.html', soundImport[1], jsVersion[1]);
    }

    group('3c) Interface du carnet (onglets + largeur)');
    check('le panneau du carnet est assez LARGE', /\.panel\s*\{[^}]*width:\s*min\(94vw,\s*900px\)/.test(css),
        (css.match(/\.panel\s*\{[^}]*width:\s*min\(([^)]*)\)/) || [])[1] || '?');
    check('le panneau a une hauteur FIXE (fin du long défilement)',
        /\.panel\s*\{[^}]*height:\s*min\(88vh,\s*760px\)[^}]*overflow:\s*hidden/.test(css));
    check('seul l’onglet actif défile', /\.tabpage\s*\{[^}]*overflow-y:\s*auto/.test(css));
    check('les onglets masquent les pages inactives',
        /\.tabpage\s*\{\s*display:\s*none/.test(css));
    check('la page « duo » passe en deux colonnes', css.includes('.tabpage.duo.active'));
    check('la boutique s’affiche en grille', /\.shop-list\s*\{[^}]*grid-template-columns/.test(css));
    check('la fiche des touches s’affiche en grille',
        /\.journal-touches\s*\{[^}]*grid-template-columns/.test(css));

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

    group('5) Profondeur : des boutons GROS et explicites');
    check('les deux boutons de profondeur sont présents',
        html.includes('id="depthMinus"') && html.includes('id="depthPlus"'));
    check('les boutons disent ce qu’ils font (des mots, pas juste + / −)',
        /id="depthMinus"[\s\S]{0,200}Moins profond/.test(html)
        && /id="depthPlus"[\s\S]{0,200}Plus profond/.test(html));
    check('les boutons sont décrits pour l’accessibilité',
        html.indexOf('aria-label="Moins profond') >= 0
        && html.indexOf('aria-label="Plus profond') >= 0);
    const hauteurs = [...css.matchAll(/\.depth-btn\s*\{[^}]*min-height:\s*(\d+)px/g)]
        .map(m => parseInt(m[1], 10));
    check('les boutons sont hauts partout (≥ 40 px)',
        hauteurs.length > 0 && hauteurs.every(h => h >= 40), hauteurs.join(' / ') + ' px');
    const tactileBtn = css.match(/@media \(pointer: coarse\)[^{]*\{[\s\S]*?\.depth-btn\s*\{[^}]*min-height:\s*(\d+)px/);
    check('sur mobile / tablette, les boutons font ≥ 48 px',
        !!tactileBtn && parseInt(tactileBtn[1], 10) >= 48,
        tactileBtn ? tactileBtn[1] + ' px' : 'règle tactile absente');
    check('le panneau de profondeur a un titre clair', html.indexOf('🌊 Profondeur') >= 0);
    check('les textures sont chargées en local (aucun CDN)',
        script.includes("chargerTexture('ecorce.jpg'") && script.includes("chargerTexture('eau-normales.jpg'")
        && !/https?:\/\/[^'"]+\.(jpg|png)/.test(script));

    group('6) Soleil directionnel (idee 2)');
    check('l’azimut du soleil est une constante (225° = sud-ouest)',
        script.includes('const SUN_AZIMUT = 225'));
    check('le shader d’eau reçoit la direction du soleil (uniforme uSunDir)',
        script.includes('uniform vec3 uSunDir') && script.includes('viewDir + uSunDir'));
    check('plus aucune direction solaire codée en dur dans le shader',
        !script.includes('normalize(vec3(0.4, 1.0, -0.6))'));

    group('7) Étang généré (idee 3)');
    check('le contour vient d’un bruit radial déterministe',
        script.includes('function rayonEtang') && script.includes('const BRUIT_ETANG'));
    check('la rive et l’eau suivent ce contour',
        script.includes('makeShoreGeometry') && script.includes('rayonEtang(a)'));
    check('la carte du carnet affiche le contour généré',
        script.includes('contour-etang'));

    group('8) Choix libre de l’emplacement (carte vue de dessus)');
    check('la carte de placement est présente dans l’accueil',
        html.includes('id="cartePlacement"'));
    check('la carte est cliquable (pointer-events + touch-action)',
        /\.carte-placement\s*\{[^}]*pointer-events:\s*auto[^}]*touch-action:\s*none/.test(css));
    check('la couronne de placement est dessinée',
        script.includes('zone-placement') && script.includes('PLACEMENT_MARGE_MIN'));
    check('le clic et le glisser sont branchés sur la carte',
        script.includes("addEventListener('pointerdown'")
        && script.includes('emplacementDepuisCarte'));

    group('9) La vase est tenace');
    check('la vase impose un temps de récupération entre deux clics',
        script.includes('clickCooldown: 0.32'));
    check('les nénuphars restent sans temps de récupération',
        script.includes('clickCooldown: 0'));
    check('le bouton signale le temps de récupération',
        css.includes('#fishButton.cooldown'));

    group('10) Ondulations avant la touche : aléatoires');
    check('les mordillements utilisent un générateur local',
        script.includes('function nibbleRand') && script.includes('nibbleRngState'));
    check('plus de cycle périodique de 4 s',
        !script.includes('const cycle = time % 4'));
    check('plus de rond toutes les 1,8 s',
        !script.includes('nibbleRippleTimer = 1.8'));

    group('11) Geste de lancer');
    check('le geste de lancer a une animation dédiée',
        script.includes('function updateCastAnimation'));
    check('la canne s’arme puis fouette',
        script.includes('CAST_SWING_CHARGE') && script.includes('CAST_SWING_RELEASE'));
    check('le pêcheur et la canne visent la cible',
        script.includes('angleLocalCanne') && script.includes('castYawRod'));
    check('l’animation tourne avant le bras et la canne',
        script.includes('updateCastAnimation(dt);'));

    group('12) JOUER réinitialise la partie');
    check('JOUER déclenche une partie neuve',
        script.includes('function reinitialiserPartie')
        && script.includes('recommencerPartie();'));
    check('score et bourriche de partie sont remis à zéro',
        script.includes('score = 0') && script.includes('bourricheCount = 0'));
    check('le carnet et l’XP ne sont pas effacés',
        !script.includes('journal.total = 0')
        && !script.includes('journal.experience = 0'));

}

export default run;
