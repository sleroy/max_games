// ---------------------------------------------------------------------------
// Scénario : MOTEUR DE POISSON 3D PARAMÉTRIQUE (modelePoisson.js, v197).
//
// Vérifie, avec le vrai three.js :
//  - chaque silhouette (FORMES) mesure `longueurRef` du museau au bout de la
//    caudale (THREE.Box3), à 2 % près ;
//  - chaque espèce se construit et mesure sa taille en cm (± 5 %) à ses deux bornes ;
//  - budget : 3 000 à 8 000 triangles, ≤ 25 meshes, texture du corps 256 × 128 ;
//  - contrat `userData` (tailPivot, bodyMat, swimRest, bodyMesh, couleurBase,
//    especeData, details, topOffset, size) ;
//  - chaque motif d'espèce est dessiné par le générateur de texture ;
//  - l'ondulation de nage (ambiance.js) plie la queue et laisse le museau en place.
// ---------------------------------------------------------------------------
import { group, check, checkClose, moduleCopie } from './harness.mjs';

function moyenne(plage) {
    return (plage[0] + plage[1]) / 2;
}

export async function run() {
    group('81) Moteur de poisson 3D paramétrique (modelePoisson.js)');
    const THREE = await import(moduleCopie('three-stub.mjs'));
    const M = await import(moduleCopie('modelePoisson.js'));
    const T = await import(moduleCopie('texturesPoisson.js'));
    const E = await import(moduleCopie('especes.js'));
    const A = await import(moduleCopie('ambiance.js'));

    function longueur(objet) {
        objet.updateMatrixWorld(true);
        const boite = new THREE.Box3().setFromObject(objet);
        return boite.max.x - boite.min.x;
    }

    // --- Silhouettes : longueur réelle = longueurRef --------------------------
    for (const form of Object.keys(E.FORMES)) {
        const poisson = M.creerModelePoisson(1, 1, 1, form, null);
        const L = longueur(poisson);
        const ref = E.FORMES[form].longueurRef;
        check('silhouette ' + form + ' : longueur ≈ longueurRef (2 %)',
            Math.abs(L - ref) / ref <= 0.02, L.toFixed(3) + ' / ' + ref);
        check('silhouette ' + form + ' : profil et anatomie connus',
            !!E.PROFILS[E.FORMES[form].profil] && !!E.ANATOMIES[E.FORMES[form].anatomie]);
    }

    // --- Espèces : taille rendue = cm, budget, contrat --------------------------
    const cles = ['tailPivot', 'bodyMat', 'swimRest', 'bodyMesh', 'couleurBase',
        'especeData', 'details', 'topOffset', 'size'];
    for (const espece of E.SPECIES) {
        const agressivite = moyenne(espece.agressivite);
        const puissance = moyenne(espece.combativite);
        for (const cm of espece.cm) {
            const poisson = M.creerModelePoisson(M.echellePourTaille(cm, espece.form),
                puissance, agressivite, espece.form, espece);
            const rendu = longueur(poisson) * 50;
            check(espece.id + ' ' + cm + ' cm : longueur rendue ≈ cm (5 %)',
                Math.abs(rendu - cm) / cm <= 0.05, rendu.toFixed(1) + ' cm');
        }
        const poisson = M.creerModelePoisson(1, puissance, agressivite, espece.form, espece);
        const stats = M.statistiquesModele(poisson);
        check(espece.id + ' : 3 000 à 8 000 triangles',
            stats.triangles >= 3000 && stats.triangles <= 8000, stats.triangles + ' triangles');
        check(espece.id + ' : au plus 25 meshes', stats.meshes <= 25, stats.meshes + ' meshes');
        check(espece.id + ' : contrat userData complet',
            cles.every(cle => poisson.userData[cle] !== undefined && poisson.userData[cle] !== null),
            cles.filter(cle => poisson.userData[cle] === undefined || poisson.userData[cle] === null).join(','));
        const positions = poisson.userData.bodyMesh.geometry.getAttribute('position');
        check(espece.id + ' : swimRest copie les positions du corps',
            poisson.userData.swimRest.length === positions.array.length
            && poisson.userData.swimRest !== positions.array);
        check(espece.id + ' : corps par sections (≥ 48 × 24 sommets)',
            positions.count >= 48 * 24, positions.count + ' sommets');
        check(espece.id + ' : les détails (yeux, pectorales) sont un groupe à part',
            poisson.userData.details.isGroup && poisson.userData.details.children.length >= 2);
        const carte = poisson.userData.bodyMat.map;
        check(espece.id + ' : texture du corps 256 × 128',
            !!carte && carte.image.width === 256 && carte.image.height === 128);
        check(espece.id + ' : texture partagée par l’espèce (cache)',
            M.creerModelePoisson(1, 1, 1, espece.form, espece).userData.bodyMat.map === carte);
        check(espece.id + ' : le dos reste sous topOffset',
            poisson.userData.topOffset > 0 && poisson.userData.topOffset < 1.5,
            poisson.userData.topOffset.toFixed(3));
    }

    // --- Motifs : chacun est géré par le générateur de texture -------------------
    const motifs = Array.from(new Set(E.SPECIES.map(e => e.motif)));
    for (const motif of motifs) {
        check('motif ' + motif + ' géré par texturesPoisson.js', T.MOTIFS_GERES.includes(motif));
        const canvas = document.createElement('canvas');
        const connu = T.dessinerRobe(canvas.getContext('2d'), 256, 128, { id: 'essai-' + motif, motif: motif, couleur: 0x808060 }, {});
        check('motif ' + motif + ' : dessiné sans erreur', connu === true);
    }

    // --- Les trois espèces calibrées portent leurs mesures ---------------------
    for (const id of ['breme', 'brochet', 'silure']) {
        const espece = E.SPECIES.find(e => e.id === id);
        check(id + ' : profil mesuré propre à l’espèce', Array.isArray(E.PROFILS[espece.profil])
            && E.PROFILS[espece.profil] !== E.PROFILS[E.FORMES[espece.form].profil]);
        check(id + ' : couleurs dos / flanc / ventre échantillonnées',
            espece.dos !== undefined && espece.ventre !== undefined && espece.couleur !== undefined);
    }
    const breme = E.PROFILS.breme;
    const brochet = E.PROFILS.brochet;
    const hMax = p => Math.max.apply(null, p.map(q => q.h));
    check('la brème est bien plus haute que le brochet (profil mesuré)',
        hMax(breme) > 2 * hMax(brochet), hMax(breme) + ' vs ' + hMax(brochet));
    const silure = E.SPECIES.find(e => e.id === 'silure');
    const modeleSilure = M.creerModelePoisson(1, 1, 1.4, 'barbu', silure);
    check('le silure a des barbillons', modeleSilure.userData.details.children.length >= 4);

    // --- Animation de nage (ambiance.js) -----------------------------------------
    const { animateFishMesh } = A.creerAmbiance({});
    const nageur = M.creerModelePoisson(1, 1, 1, 'fusiforme', E.SPECIES[0]);
    const data = nageur.userData;
    animateFishMesh(data, 1 + Math.PI / 2, 0.2);   // sinus maximal au pédoncule (rear = 1)
    const pos = data.bodyMesh.geometry.getAttribute('position');
    let deplacementQueue = 0;
    let deplacementMuseau = 0;
    for (let i = 0; i < pos.count; i++) {
        const x = data.swimRest[i * 3];
        const dz = Math.abs(pos.getZ(i) - data.swimRest[i * 3 + 2]);
        if (x < -data.swimDemi * 0.9) { deplacementQueue = Math.max(deplacementQueue, dz); }
        if (x > 0) { deplacementMuseau = Math.max(deplacementMuseau, dz); }
    }
    check('la nage plie l’arrière du corps', deplacementQueue > 0.05, deplacementQueue.toFixed(3));
    checkClose('la nage laisse la tête en place', deplacementMuseau, 0, 1e-9);
    check('la caudale suit (tailPivot déplacé)', Math.abs(data.tailPivot.position.z) > 0.01,
        data.tailPivot.position.z.toFixed(3));
}

export default run;
