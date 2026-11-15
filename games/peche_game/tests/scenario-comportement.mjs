// ---------------------------------------------------------------------------
// Scénario 67 : poissons réalistes, quiver au fond, accueil sans boutons de poste.
//   - le quiver pose l'hameçon au FOND (le bouchon garde sa profondeur réglée) ;
//   - plus de boutons Sud/Est/Nord/Ouest dans l'accueil ;
//   - chaque espèce a sa couche, son banc, sa vitesse, sa zone de vie ;
//   - les poissons restent dans leur zone de vie (presque) tout le temps ;
//   - la vue dépend de l'espèce, de la nuit et du champ de vision.
// ---------------------------------------------------------------------------
import { readFileSync } from 'node:fs';
import {
    group, check, checkEqual,
    G, resetToIdle, castTo, step, stepFor
} from './harness.mjs';
import { SPECIES, COMPORTEMENTS } from '../especes.js';

export function run() {
    group('67) Poissons réalistes, quiver au fond, accueil épuré');

    // 1) Accueil sans boutons de poste.
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    check('plus de bouton Sud/Est/Nord/Ouest dans l’accueil',
        !/id="poste(Sud|Est|Nord|Ouest)"/.test(html));

    // 2) Données : chaque espèce a un comportement complet et cohérent.
    SPECIES.forEach(function (esp) {
        const c = COMPORTEMENTS[esp.id];
        check('comportement défini : ' + esp.id, !!c);
        if (!c) { return; }
        check(esp.id + ' : vitesses cohérentes', c.croisiere > 0 && c.pointe > c.croisiere);
        check(esp.id + ' : banc valide', c.banc[0] >= 1 && c.banc[1] >= c.banc[0]);
    });
    checkEqual('le brochet est solitaire', COMPORTEMENTS.brochet.banc[1], 1);
    check('l’ablette nage en plus gros banc que la tanche',
        COMPORTEMENTS.ablette.banc[1] > COMPORTEMENTS.tanche.banc[1]);
    check('le brochet a une pointe bien plus rapide que sa croisière',
        COMPORTEMENTS.brochet.pointe > 10 * COMPORTEMENTS.brochet.croisiere);
    checkEqual('la carpe vit au fond', COMPORTEMENTS.carpe.couche, 'fond');

    // 3) Les poissons de l'étang ont leurs caractéristiques et forment des bancs.
    G().demarrerJeu();
    resetToIdle();
    G().repeuplerEtang();   // étang neuf : peuplement d'origine, en bancs
    const poissons = G().fishes;
    check('tous les poissons ont un comportement', poissons.every(f => !!f.userData.comp));
    const groupes = {};
    poissons.forEach(function (f) {
        if (f.userData.groupeId !== undefined) {
            (groupes[f.userData.groupeId] = groupes[f.userData.groupeId] || []).push(f);
        }
    });
    const nbGroupes = Object.keys(groupes).length;
    check('l’étang compte des bancs', nbGroupes >= 2, String(nbGroupes));
    check('un banc ne mélange qu’une espèce', Object.values(groupes).every(function (g) {
        return g.every(f => f.userData.especeId === g[0].userData.especeId);
    }));

    // 4) Simulation : 4 minutes de vie, les poissons restent dans leur zone.
    let total = 0;
    let dehors = 0;
    let tropRapide = 0;
    let dispersionBanc = 0;
    let mesuresBanc = 0;
    for (let t = 0; t < 240; t += 0.25) {
        stepFor(0.25, 0.05);
        poissons.forEach(function (f) {
            const d = f.userData;
            const dist = Math.hypot(f.position.x - d.homeX, f.position.z - d.homeZ);
            total++;
            if (dist > d.homeRadius * 1.3) { dehors++; }
            if (Math.hypot(d.vx, d.vz) > d.comp.pointe * 1.05 + 0.01) { tropRapide++; }
        });
        Object.values(groupes).forEach(function (g) {
            let cx = 0, cz = 0;
            g.forEach(f => { cx += f.position.x; cz += f.position.z; });
            cx /= g.length; cz /= g.length;
            g.forEach(f => {
                dispersionBanc += Math.hypot(f.position.x - cx, f.position.z - cz);
                mesuresBanc++;
            });
        });
    }
    const pctDehors = (100 * dehors) / total;
    check('les poissons restent dans leur zone de vie (≥ 98 % du temps)',
        pctDehors < 2, pctDehors.toFixed(2) + ' % dehors');
    checkEqual('aucun poisson ne dépasse la vitesse de pointe de son espèce', tropRapide, 0);
    const dispMoy = mesuresBanc ? dispersionBanc / mesuresBanc : 0;
    check('les bancs restent groupés (écart moyen au centre < 6)', dispMoy < 6,
        dispMoy.toFixed(2));
    const fondants = poissons.filter(f => f.userData.couche === 'fond');
    check('les espèces de fond nagent près du relief', fondants.every(function (f) {
        return f.position.y + f.userData.topOffset - G().fondY(f.position.x, f.position.z) < 1.4;
    }));

    // 5) Quiver : l'hameçon est posé au fond ; le bouchon garde sa profondeur.
    G().setTangleChance(0);
    G().lilyPads.length = 0;
    resetToIdle();
    const reglage = G().getHookDepth();
    G().setTechnique('quiver');
    castTo(0, -25);
    const fond = G().fondY(G().floatGroup.position.x, G().floatGroup.position.z);
    const ecart = G().getHookDepth() - fond;
    check('quiver : l’hameçon est posé au fond (≤ 0,7 au-dessus du relief)',
        ecart > 0 && ecart < 0.7, ecart.toFixed(2));
    resetToIdle();
    G().setTechnique('bouchon');
    step(0.1);
    checkEqual('retour au bouchon : la profondeur réglée revient', G().getHookDepth(), reglage);

    // 6) Non-régression : le shader de l'eau déclare tous les uniforms qu'il utilise
    // (un « uNormalsOn » oublié rendait l'eau invisible en ligne).
    const src = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
    check('le shader d’eau déclare uNormalsOn', /uniform float uNormalsOn;/.test(src));
}
