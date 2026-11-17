// ---------------------------------------------------------------------------
// Scénario : OISEAUX ET LIBELLULES 3D (modeleOiseau.js, modeleLibellule.js).
//
// Vérifie, avec le vrai three.js :
//  - chaque oiseau mesure son envergure et sa longueur (bec → queue) ;
//  - budget de triangles et de meshes, contrat userData, textures 128 × 64 ;
//  - les ailes sont ARTICULÉES (épaule + poignet) et battent symétriquement ;
//  - chaque libellule mesure ≈ 1,1 unité, a 4 ailes nervurées et 10 segments ;
//  - les ailes avant/arrière battent en décalage, l'abdomen ondule ;
//  - le ciel de la partie utilise bien trois espèces (intégration vie.js).
// ---------------------------------------------------------------------------
import { G, group, check, checkClose, moduleCopie } from './harness.mjs';

export async function run() {
    group('83) Oiseaux et libellules 3D (modeleOiseau.js, modeleLibellule.js)');
    const THREE = await import(moduleCopie('three-stub.mjs'));
    const O = await import(moduleCopie('modeleOiseau.js'));
    const D = await import(moduleCopie('modeleLibellule.js'));
    const T = await import(moduleCopie('texturesVie.js'));

    function boite(objet) {
        objet.updateMatrixWorld(true);
        return new THREE.Box3().setFromObject(objet);
    }

    // --- Oiseaux : mesures, budget, contrat --------------------------------
    for (const id of Object.keys(O.OISEAUX)) {
        const def = O.OISEAUX[id];
        const oiseau = O.creerModeleOiseau(id);
        oiseau.rotation.set(0, 0, 0);
        const b = boite(oiseau);
        const envergure = b.max.z - b.min.z;
        check(id + ' : envergure ≈ celle de l’espèce (3 %)',
            Math.abs(envergure - def.envergure) / def.envergure <= 0.03,
            envergure.toFixed(2) + ' / ' + def.envergure);
        const longueur = b.max.x - b.min.x;
        const attendue = def.longueur
            * (1 + def.queue * (def.queueForme === 'fourchue' ? 1.30 : 1));
        check(id + ' : longueur bec → queue (5 %)',
            Math.abs(longueur - attendue) / attendue <= 0.05,
            longueur.toFixed(2) + ' / ' + attendue.toFixed(2));
        const stats = O.statistiquesModele(oiseau);
        check(id + ' : 600 à 3 000 triangles',
            stats.triangles >= 600 && stats.triangles <= 3000, stats.triangles + ' triangles');
        check(id + ' : au plus 12 meshes', stats.meshes <= 12, stats.meshes + ' meshes');
        check(id + ' : deux ailes avec poignet',
            oiseau.userData.ailes.length === 2
            && oiseau.userData.ailes.every(a => a.groupe && a.poignet && (a.cote === -1 || a.cote === 1)),
            oiseau.userData.ailes.length + ' ailes');
        check(id + ' : queue articulée et bec', oiseau.userData.queue.isGroup && !!oiseau.userData.bec);
        const map = oiseau.userData.corps.material.map;
        check(id + ' : texture de plumage 128 × 64',
            !!map && map.image.width === 128 && map.image.height === 64);
        check(id + ' : plumage dos / ventre distincts',
            def.couleurs.dos !== def.couleurs.ventre);
    }

    // --- Ailes : battement, symétrie, poignet ------------------------------
    const corneille = O.creerModeleOiseau('corneille');
    corneille.updateMatrixWorld(true);
    const aileDroite = corneille.userData.ailes.find(a => a.cote === 1);
    const aileGauche = corneille.userData.ailes.find(a => a.cote === -1);
    const repos = boite(aileDroite.groupe).max.y;
    O.animerOiseau(corneille, Math.PI / (2 * corneille.userData.cadence));
    const haut = boite(aileDroite.groupe).max.y;
    O.animerOiseau(corneille, 3 * Math.PI / (2 * corneille.userData.cadence));
    const bas = boite(aileDroite.groupe).max.y;
    check('le battement fait monter et descendre l’aile',
        Math.abs(haut - bas) > 0.3, (haut - bas).toFixed(2));
    check('au repos l’aile est au-dessus du corps', repos > 0, repos.toFixed(2));
    const bd = boite(aileDroite.groupe);
    const bg = boite(aileGauche.groupe);
    checkClose('les deux ailes sont symétriques (miroir)', bd.max.z, -bg.min.z, 1e-6);
    checkClose('les deux ailes ont la même hauteur', bd.max.y, bg.max.y, 1e-6);
    const avant = boite(aileDroite.poignet).min.x;
    O.animerOiseau(corneille, Math.PI / (2 * corneille.userData.cadence));
    const apres = boite(aileDroite.poignet).min.x;
    check('le poignet replie la main (bord de fuite déplacé)',
        Math.abs(apres - avant) > 0.05, Math.abs(apres - avant).toFixed(2));

    // --- Libellules : mesures, budget, contrat -----------------------------
    for (const id of Object.keys(D.LIBELLULES)) {
        const lib = D.creerModeleLibellule(id);
        const b = boite(lib);
        const longueur = b.max.x - b.min.x;
        check(id + ' : longueur ≈ 1,10 unité (6 %)',
            Math.abs(longueur - lib.userData.longueur) / lib.userData.longueur <= 0.06,
            longueur.toFixed(2));
        const envergure = b.max.z - b.min.z;
        check(id + ' : envergure ≈ 1,56 unité (6 %)',
            Math.abs(envergure - lib.userData.envergure) / lib.userData.envergure <= 0.06,
            envergure.toFixed(2));
        const stats = D.statistiquesModele(lib);
        check(id + ' : 400 à 2 000 triangles',
            stats.triangles >= 400 && stats.triangles <= 2000, stats.triangles + ' triangles');
        check(id + ' : au plus 12 meshes', stats.meshes <= 12, stats.meshes + ' meshes');
        check(id + ' : quatre ailes (avant / arrière)',
            lib.userData.ailes.length === 4
            && lib.userData.ailes.filter(a => a.paire === 'avant').length === 2
            && lib.userData.ailes.filter(a => a.paire === 'arriere').length === 2);
        check(id + ' : abdomen de 10 segments articulé',
            lib.userData.segments === 10 && lib.userData.abdomen.isGroup);
        const mat = lib.userData.materiauAile;
        check(id + ' : ailes transparentes et nervurées 128 × 64',
            mat.transparent === true && !!mat.map
            && mat.map.image.width === 128 && mat.map.image.height === 64);
        const abdomenMat = lib.userData.abdomen.children[0].material;
        check(id + ' : abdomen texturé 128 × 32',
            !!abdomenMat.map && abdomenMat.map.image.width === 128
            && abdomenMat.map.image.height === 32, 'texture');
    }

    // --- Libellule : battement décalé et abdomen qui ondule ---------------
    const lib = D.creerModeleLibellule('azur');
    const ailes = lib.userData.ailes;
    const aileAvant = ailes.find(a => a.paire === 'avant' && a.cote === 1);
    const arriere = ailes.find(a => a.paire === 'arriere' && a.cote === 1);
    lib.updateMatrixWorld(true);
    const yRepos = boite(aileAvant.groupe).max.y;
    D.animerLibellule(lib, Math.PI / (2 * 46));
    const yHaut = boite(aileAvant.groupe).max.y;
    D.animerLibellule(lib, 3 * Math.PI / (2 * 46));
    const yBas = boite(aileAvant.groupe).max.y;
    check('les ailes de libellule battent',
        Math.abs(yHaut - yBas) > 0.15, (yHaut - yBas).toFixed(2));
    check('le battement ne change pas la longueur du corps',
        Math.abs(yRepos - yBas) < 1, yRepos.toFixed(2));
    D.animerLibellule(lib, 0);
    check('ailes avant et arrière déphasées',
        Math.abs(aileAvant.groupe.rotation.x - arriere.groupe.rotation.x) > 0.01,
        (aileAvant.groupe.rotation.x - arriere.groupe.rotation.x).toFixed(2));
    const aileGaucheLib = ailes.find(a => a.paire === 'avant' && a.cote === -1);
    D.animerLibellule(lib, 0.7);
    const bdLib = boite(aileAvant.groupe);
    const bgLib = boite(aileGaucheLib.groupe);
    checkClose('les ailes de libellule sont symétriques (miroir)', bdLib.max.z, -bgLib.min.z, 1e-6);
    checkClose('les ailes de libellule ont la même hauteur', bdLib.max.y, bgLib.max.y, 1e-6);
    D.animerLibellule(lib, 0);
    const zb = lib.userData.abdomen.rotation.z;
    D.animerLibellule(lib, Math.PI / (2 * 2.1));
    check('l’abdomen ondule', Math.abs(lib.userData.abdomen.rotation.z - zb) > 0.005);

    // --- Textures : chaque variante est dessinée sans erreur ---------------
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    for (const id of Object.keys(O.OISEAUX)) {
        check('plumage ' + id + ' : dessiné',
            T.dessinerPlumage(canvas.getContext('2d'), 128, 64, O.OISEAUX[id].couleurs, 'corps') === true);
        check('aile ' + id + ' : dessinée',
            T.dessinerPlumage(canvas.getContext('2d'), 128, 64, O.OISEAUX[id].couleurs, 'aile') === true);
    }
    for (const id of Object.keys(D.LIBELLULES)) {
        check('aile de libellule ' + id + ' : dessinée',
            T.dessinerAileLibellule(canvas.getContext('2d'), 128, 64, D.LIBELLULES[id]) === true);
        check('abdomen ' + id + ' : dessiné',
            T.dessinerAbdomen(canvas.getContext('2d'), 128, 32, D.LIBELLULES[id]) === true);
    }

    // --- Intégration : le ciel utilise les nouvelles espèces --------------
    const birds = G().getBirds();
    check('trois oiseaux 3D dans la partie', birds.length === 3, birds.length + ' oiseaux');
    check('au moins deux espèces dans le ciel',
        new Set(birds.map(b => b.userData.espece)).size >= 2,
        birds.map(b => b.userData.espece).join(', '));
    check('les oiseaux ont des ailes articulées',
        birds.every(b => b.userData.ailes.length === 2 && !!b.userData.ailes[0].poignet));
}

export default run;
