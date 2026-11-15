// ---------------------------------------------------------------------------
// Scénario : CONTRAT DES MODULES (découpage, prérequis du travail en parallèle).
//
// Vérifie les règles de docs/modules.md :
//  - plafond de lignes par module (800) ;
//  - plafond « cliquet » sur script.js (ne peut que baisser) ;
//  - aucun module n'importe script.js (pas de cycle) ;
//  - chaque module du dossier est documenté dans docs/modules.md ;
//  - les modules exportent bien leur API d'entrée.
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import { GAME_DIR, group, check, checkEqual } from './harness.mjs';

const DOSSIER_JEU = GAME_DIR;
const DOCS = path.join(DOSSIER_JEU, '..', '..', 'docs', 'modules.md');

// Modules extraits (tout ce qui n'est pas l'orchestrateur).
const MODULES = [
    'environnement.js', 'poissons.js', 'bourriche.js', 'decor.js', 'portraits.js', 'demelage.js', 'quiver.js',
    'especes.js', 'classement.js', 'carnet.js', 'sound.js', 'combat.js', 'comportement.js', 'bateau.js', 'lancerPoisson.js', 'carnetUI.js', 'boutique.js', 'fiches.js', 'lancerCanne.js', 'amorcage.js', 'frein.js', 'ligne.js', 'bouchons.js', 'placement.js', 'meteo.js', 'vie.js', 'sonar.js', 'stocks.js', 'journal.js', 'touches.js', 'cycleLigne.js', 'accrochage.js', 'ambiance.js', 'entrees.js', 'cheat.js', 'boucle.js', 'partie.js', 'pecheur.js'
];

const PLAFOND_MODULE = 800;      // lignes max par module
// CLIQUET : plafond de script.js. Il ne peut que BAISSER. À ajuster à la baisse
// après chaque extraction réussie (c'est ce qui empêche le fichier de regonfler).
const PLAFOND_SCRIPT = 3181;

function lignes(fichier) {
    return fs.readFileSync(path.join(DOSSIER_JEU, fichier), 'utf8').split('\n').length;
}

export function run() {
    group('72) Contrat des modules (travail en parallèle)');

    // --- Plafonds de lignes ------------------------------------------------
    MODULES.forEach(function (module) {
        if (!fs.existsSync(path.join(DOSSIER_JEU, module))) { return; }
        const n = lignes(module);
        check('module ' + module + ' sous le plafond (' + PLAFOND_MODULE + ' lignes)',
            n <= PLAFOND_MODULE, n + ' lignes');
    });

    const nScript = lignes('script.js');
    check('script.js sous son plafond cliquet (' + PLAFOND_SCRIPT + ')',
        nScript <= PLAFOND_SCRIPT, nScript + ' lignes');

    // --- Pas de cycle : un module ne doit jamais importer script.js ---------
    MODULES.forEach(function (module) {
        if (!fs.existsSync(path.join(DOSSIER_JEU, module))) { return; }
        const code = fs.readFileSync(path.join(DOSSIER_JEU, module), 'utf8');
        check(module + ' n’importe pas script.js (pas de cycle)',
            !/from\s+['"]\.\/script\.js/.test(code));
        check(module + ' ne passe pas par l’API de jeu (window.__game)',
            !/\bwindow\.__game\b/.test(code.replace(/\/\/.*$/gm, '')),
            module);
    });

    // --- API attendue (le point d'entrée que script.js appelle) ------------
    const attendus = {
        'environnement.js': 'export function ajouterFond(',
        'poissons.js': 'export function creerPoissons(',
        'splashes.js': 'export function creerSplashes(',
        'messages.js': 'export function creerMessages(',
        'ondulations.js': 'export function creerOndulations(',
        'bourriche.js': 'export function creerBourriche(',
        'combat.js': 'export function creerCombat(',
        'pecheur.js': 'export function creerPecheur(',
        'partie.js': 'export function creerPartie(',
        'boucle.js': 'export function creerBoucle(',
        'cheat.js': 'export function creerCheat(',
        'entrees.js': 'export function creerEntrees(',
        'ambiance.js': 'export function creerAmbiance(',
        'accrochage.js': 'export function creerAccrochage(',
        'cycleLigne.js': 'export function creerCycleLigne(',
        'touches.js': 'export function creerTouches(',
        'journal.js': 'export function creerJournal(',
        'stocks.js': 'export function creerStocks(',
        'sonar.js': 'export function creerSonar(',
        'vie.js': 'export function creerVie(',
        'meteo.js': 'export function creerMeteo(',
        'placement.js': 'export function creerPlacement(',
        'bouchons.js': 'export function creerBouchons(',
        'ligne.js': 'export function creerLigne(',
        'frein.js': 'export function creerFrein(',
        'amorcage.js': 'export function creerAmorcage(',
        'lancerCanne.js': 'export function creerLancerCanne(',
        'fiches.js': 'export function creerFiches(',
        'boutique.js': 'export function creerBoutique(',
        'carnetUI.js': 'export function creerCarnetUI(',
        'lancerPoisson.js': 'export function creerLancerPoisson(',
        'bateau.js': 'export function creerBateau(',
        'comportement.js': 'export function creerComportement(',
        'decor.js': 'export function creerDecor(',
        'portraits.js': 'export function dessinerPortrait(',
        'demelage.js': 'export function creerJeuDemelage(',
        'quiver.js': 'export function creerModeQuiver(',
        'carnet.js': 'export function chargerCarnet(',
        'classement.js': 'export function creerClassement('
    };
    Object.keys(attendus).forEach(function (module) {
        const code = fs.readFileSync(path.join(DOSSIER_JEU, module), 'utf8');
        check(module + ' expose son API d’entrée', code.includes(attendus[module]),
            attendus[module]);
    });

    // --- Chaque module est documenté (sinon un agent ne sait pas où écrire) -
    check('docs/modules.md existe', fs.existsSync(DOCS));
    if (fs.existsSync(DOCS)) {
        const doc = fs.readFileSync(DOCS, 'utf8');
        MODULES.forEach(function (module) {
            check('docs/modules.md documente ' + module, doc.includes('`' + module + '`'));
        });
        check('docs/modules.md fixe le plafond de 800 lignes', doc.includes('800'));
    }

    // --- Le décor est bien branché (module réellement utilisé) -------------
    const script = fs.readFileSync(path.join(DOSSIER_JEU, 'script.js'), 'utf8');
    check('script.js importe le module de décor', /from '\.\/decor\.js\?v=\d+'/.test(script));
    check('script.js appelle creerDecor avec ses dépendances',
        script.includes('creerDecor({') && script.includes('lilyPads'),
        'creerDecor');
    checkEqual('le décor ne construit plus les arbres dans script.js',
        script.includes('trunkInst'), false);
    checkEqual('l’étang n’est plus construit dans script.js',
        script.includes('const POND_CENTER = new THREE.Vector3'), false);
    check('script.js importe l’environnement', /from '\.\/environnement\.js\?v=\d+'/.test(script));
    checkEqual('les poissons ne sont plus construits dans script.js',
        script.includes('function makeFish('), false);
    check('script.js importe le module poissons', /from '\.\/poissons\.js\?v=\d+'/.test(script));
}

export default run;
