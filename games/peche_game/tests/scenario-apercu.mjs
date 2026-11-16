// ---------------------------------------------------------------------------
// Scénario : APERÇU 3D D'UN POISSON (apercuPoisson.js, v203).
//
// Le rendu WebGL n'existe pas dans Node (le harnais remplace WebGLRenderer par
// un stub inerte). On vérifie donc le CONTRAT :
//  - le module est importable sans navigateur et ne fabrique rien au chargement ;
//  - création paresseuse du moteur ;
//  - sans document ou sans canvas 2D utilisable : `rendre` renvoie null, sans exception ;
//  - avec un faux canvas : data URL renvoyée, cache par `id:cm`, `liberer` vide le cache ;
//  - la fiche « Espèces » (fiches.js) et la galerie (tailles.js) passent par ce module.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import { group, check, checkEqual, moduleCopie, GAME_DIR } from './harness.mjs';

export async function run() {
    group('82) Aperçu 3D d’un poisson (apercuPoisson.js)');
    const A = await import(moduleCopie('apercuPoisson.js'));
    const E = await import(moduleCopie('especes.js'));
    const espece = E.SPECIES[0];
    const moyenne = (espece.cm[0] + espece.cm[1]) / 2;

    checkEqual('API : creerApercuPoisson est une fonction', typeof A.creerApercuPoisson, 'function');
    checkEqual('API : apercuPartage est une fonction', typeof A.apercuPartage, 'function');
    check('apercuPartage renvoie toujours la même instance (un seul contexte WebGL)',
        A.apercuPartage() === A.apercuPartage());
    const documentInitial = globalThis.document;

    try {
        // --- Création paresseuse : aucun élément DOM tant qu'on ne rend rien -------
        let creations = 0;
        const original = documentInitial;
        let pngs = 0;
        function fauxDocument() {
            return {
                ...original,
                createElement(tag) {
                    creations++;
                    const element = original.createElement(tag);
                    if (tag === 'canvas') {
                        element.toDataURL = function () { pngs++; return 'data:image/png;base64,' + pngs; };
                        const getContext = element.getContext;
                        element.getContext = function (genre, options) {
                            const contexte = getContext.call(element, genre, options);
                            if (contexte) {
                                contexte.drawImage = function () {};
                                contexte.getImageData = function (x, y, l, h) {
                                    const data = new Uint8ClampedArray(l * h * 4);
                                    data[((5 * l) + 5) * 4 + 3] = 255;   // un pixel visible
                                    return { data: data };
                                };
                            }
                            return contexte;
                        };
                    }
                    return element;
                }
            };
        }

        globalThis.document = fauxDocument();
        const apercu = A.creerApercuPoisson({ largeur: 64, hauteur: 32 });
        checkEqual('création paresseuse : rien de fabriqué avant le premier rendu', creations, 0);
        checkEqual('API : rendre / disponible / liberer',
            ['rendre', 'disponible', 'liberer'].every(function (n) { return typeof apercu[n] === 'function'; }), true);

        // --- Rendu, cache, libération ---------------------------------------------
        const url = apercu.rendre(espece, moyenne);
        check('rendre renvoie un data URL PNG', typeof url === 'string' && url.indexOf('data:image/png') === 0, String(url));
        check('le moteur est créé au premier rendu', creations > 0, creations + ' éléments');
        checkEqual('disponible() vrai quand le rendu fonctionne', apercu.disponible(), true);
        const apresPremier = pngs;
        checkEqual('même espèce, même taille : réponse du cache', apercu.rendre(espece, moyenne), url);
        checkEqual('le cache n’a pas relancé de rendu', pngs, apresPremier);
        const autre = apercu.rendre(espece, espece.cm[1]);
        check('une autre taille fabrique une nouvelle image', autre !== url && pngs === apresPremier + 1,
            String(autre));
        checkEqual('entrées invalides : null sans exception',
            [apercu.rendre(null, 10), apercu.rendre(espece, NaN)].join('|'), '|');
        apercu.liberer();
        apercu.rendre(espece, moyenne);
        checkEqual('liberer() vide le cache (le rendu est refait)', pngs, apresPremier + 2);
        apercu.liberer();

        // --- Sans canvas 2D utilisable (faux DOM du harnais) ------------------------
        globalThis.document = original;
        const sans2d = A.creerApercuPoisson({ largeur: 64, hauteur: 32 });
        let resultat = 'pas appelé';
        let erreur = null;
        try { resultat = sans2d.rendre(espece, moyenne); } catch (e) { erreur = e; }
        checkEqual('rendu impossible : aucune exception', erreur, null);
        check('rendu impossible : rendre renvoie null', resultat === null, String(resultat));

        // --- Sans document (module importable hors navigateur) ------------------------
        delete globalThis.document;
        const sansDocument = A.creerApercuPoisson();
        checkEqual('sans document : disponible() faux', sansDocument.disponible(), false);
        checkEqual('sans document : rendre renvoie null', sansDocument.rendre(espece, moyenne), null);
        sansDocument.liberer();
    } finally {
        globalThis.document = documentInitial;
    }

    // --- Branchements -----------------------------------------------------------
    const lire = function (f) { return fs.readFileSync(path.join(GAME_DIR, f), 'utf8'); };
    const code = lire('apercuPoisson.js').replace(/\/\/.*$/gm, '');
    check('apercuPoisson.js n’accède pas à window', !/\bwindow\b/.test(code));
    check('tailles.js utilise le module partagé', /from '\.\/apercuPoisson\.js\?v=\d+'/.test(lire('tailles.js'))
        && !/new THREE\.WebGLRenderer/.test(lire('tailles.js')));
    const fiches = lire('fiches.js');
    check('fiches.js utilise le module partagé', /from '\.\/apercuPoisson\.js\?v=\d+'/.test(fiches));
    check('fiches.js et combat.js partagent la même instance (apercuPartage)',
        /apercuPartage\(/.test(fiches) && /apercuPartage\(/.test(lire('combat.js'))
        && !/creerApercuPoisson\(/.test(fiches));
    check('combat.js : repli sur le portrait 2D quand le rendu 3D est impossible',
        /dessinerPortrait\(/.test(lire('combat.js')) && /apercuPartage\(\)\.rendre\(/.test(lire('combat.js')));
    check('fiches.js : aperçu 3D + photo réelle dans la fiche',
        fiches.includes('espece-apercu') && fiches.includes('espece-photo') && fiches.includes('photos.json'));
    check('style.css : classes de l’aperçu et de la photo',
        /\.espece-apercu\b/.test(lire('style.css')) && /\.espece-photo\b/.test(lire('style.css')));
}

export default run;
