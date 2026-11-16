// ---------------------------------------------------------------------------
// Instantané du monde de la PLAINE (étang d'origine) : tout ce qui doit rester IDENTIQUE, au bit près, quand le jeu
// gagne des formes d'eau (canal, rivière, lac). Sans import : ce fichier est aussi exécuté sur l'ancien code
// (v239, origin/main 43cc298) pour produire la référence de `scenario-formes-eau.mjs`.
//
//   node games/peche_game/tests/instantane-plaine.mjs     (depuis un dossier du jeu, avec le harnais voisin)
// ---------------------------------------------------------------------------

// Empreinte FNV-1a d'une chaîne (32 bits, en hexadécimal) : deux mondes identiques donnent la même.
export function empreinteTexte(texte) {
    let h = 2166136261;
    for (let i = 0; i < texte.length; i++) { h = Math.imul(h ^ texte.charCodeAt(i), 16777619) >>> 0; }
    return h.toString(16);
}

// Empreinte FNV-1a des OCTETS d'un tableau de nombres (Float32Array, Float64Array ou liste) : sensible au dernier bit.
export function empreinteNombres(valeurs) {
    const tampon = new DataView(new ArrayBuffer(8));
    let h = 2166136261;
    for (let i = 0; i < valeurs.length; i++) {
        tampon.setFloat64(0, valeurs[i]);
        for (let k = 0; k < 8; k++) { h = Math.imul(h ^ tampon.getUint8(k), 16777619) >>> 0; }
    }
    return h.toString(16);
}

/** Instantané de la plaine vu par l'API de test du jeu (`G()` = window.__game). */
export function instantane(Z) {
    const angles = [];
    for (let k = 0; k < 720; k++) { angles.push((k / 720) * Math.PI * 2); }
    const contour = angles.map(function (a) { return Z.getRayonEtang(a); });
    const info = Z.getEtangInfo();
    const monde = Z.getMonde();
    const centre = Z.getPondCenter();
    const attributs = function (maillage, nom) { return Array.from(maillage.geometry.attributes[nom].array); };
    return {
        contour720: empreinteNombres(contour),
        contourSud: contour[180],
        centre: centre.x + ',' + centre.z,
        fosses: JSON.stringify(info.fosses),
        rayon: monde.rayon,
        rayonMax: monde.rayonMax,
        surfaceHa: info.surfaceHa,
        profondeurMax: info.profondeurMax,
        rayonCadre: info.rayonCadre,
        porteeLancer: monde.porteeLancer,
        porteeAmorce: monde.porteeAmorce,
        cameraFar: monde.cameraFar,
        brume: monde.brume.proche + ',' + monde.brume.loin,
        ciel: monde.ciel,
        monde3D: monde.monde3D,
        pasBateauMarge: monde.pasBateauMarge,
        relief: empreinteNombres([[0, -40], [-20, -90], [30, -55], [4, -123], [-60, -20], [20, 10]]
            .map(function (p) { return Z.profondeurLocale(p[0], p[1]); })),
        decor: empreinteTexte(JSON.stringify([Z.decor.arbres, Z.decor.lilyPads, Z.decor.roseaux, Z.decor.rochers])),
        decorCompte: [Z.decor.arbres.length, Z.decor.lilyPads.length, Z.decor.roseaux.length, Z.decor.rochers.length].join(','),
        obstacles: empreinteTexte(Z.obstacles.empreinte()),
        obstaclesCompte: Z.obstacles.liste.length,
        fonds: Z.substrats.empreinte(),
        fondsGrille: Z.substrats.taille + 'x' + Z.substrats.taille + ' pas ' + Z.substrats.cellule + ' côté ' + Z.substrats.cote,
        eau: empreinteNombres(attributs(Z.water, 'position')),
        eauProfondeur: empreinteNombres(attributs(Z.water, 'aDepth')),
        fond: empreinteNombres(attributs(Z.getFondMesh(), 'position')),
        fondUV: empreinteNombres(attributs(Z.getFondMesh(), 'uv')),
        rive: empreinteNombres(attributs(Z.getShoreMesh(), 'position')),
        pecheur: Z.angler.position.x + ',' + Z.angler.position.z
    };
}

// Exécuté directement : imprime l'instantané du monde que le harnais voisin vient de charger.
if (process.argv[1] && process.argv[1].endsWith('instantane-plaine.mjs')) {
    const { installEnvironment, loadGame, cleanup, G } = await import('./harness.mjs');
    installEnvironment();
    await loadGame();
    console.log(JSON.stringify(instantane(G()), null, 4));
    cleanup();
}
