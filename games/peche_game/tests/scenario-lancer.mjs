// ---------------------------------------------------------------------------
// Scénario 59 : GESTE DE LANCER réaliste.
// Pendant la charge, le pêcheur s'oriente vers le point visé et la canne s'arme
// en arrière. Au lâcher, la canne fouette vers l'avant, le bras suit, puis tout
// revient au repos en restant pointé vers le bouchon.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual, checkClose,
    G, el, resetToIdle, clearLilyPads, step, stepFor, stepUntil, state
} from './harness.mjs';

function ecartAngle(a, b) {
    const deuxPi = Math.PI * 2;
    const d = Math.abs(a - b) % deuxPi;
    return Math.min(d, deuxPi - d);
}

function theta(base, cible) {
    return Math.atan2(cible.z - base.z, cible.x - base.x);
}

function distance3D(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function run() {
    group('59) Geste de lancer : armé, fouetté et orienté vers le bouchon');
    G().recommencerPartie();
    resetToIdle();
    clearLilyPads();
    G().placerAuPoste(0);
    G().afficherAccueil();
    step(1 / 60);

    const repos = G().getCastAnimation();
    const brasRepos = G().getArmPose();
    const tipRepos = G().getRodTipVisual();
    checkClose('au repos, la canne n’est pas armée', repos.swing, 0, 0.02);
    checkClose('au repos, aucun écart de lacet', repos.offsetRod, 0, 0.02);

    // --- Charge vers une cible LATÉRALE (à droite) ---
    const cible = { x: 18, y: 0, z: -20 };
    G().startCastCharge(cible);
    stepFor(0.5);
    const charge = G().getCastAnimation();
    checkEqual('la charge est en cours', charge.castState, 'charging');
    check('la canne s’arme en arrière', charge.swing > 0.25,
        charge.swing.toFixed(2) + ' rad');
    const tipCharge = G().getRodTipVisual();
    check('le bout de la canne bouge vraiment',
        distance3D(tipRepos, tipCharge) > 0.3,
        distance3D(tipRepos, tipCharge).toFixed(2) + ' unités');

    // La canne pointe vers la cible (repère du talon de canne).
    const talon = G().getRodBase();
    const thetaCibleCanne = theta(talon, cible);
    const thetaCanne = theta(talon, tipCharge);
    check('la canne vise la cible visée',
        ecartAngle(thetaCanne, thetaCibleCanne) < 0.25,
        (ecartAngle(thetaCanne, thetaCibleCanne) * 180 / Math.PI).toFixed(1) + '° d’écart');

    // Le corps s'oriente aussi vers la cible.
    const pecheur = G().angler.position;
    const thetaCibleCorps = theta(pecheur, cible);
    const thetaCorps = Math.PI / 2 - charge.yawAngler;
    check('le pêcheur s’oriente vers la cible',
        ecartAngle(thetaCorps, thetaCibleCorps) < 0.35,
        (ecartAngle(thetaCorps, thetaCibleCorps) * 180 / Math.PI).toFixed(1) + '° d’écart');

    const brasCharge = G().getArmPose();
    check('le bras accompagne le geste',
        Math.abs(brasCharge.rz - brasRepos.rz) > 0.1
        || Math.abs(brasCharge.rx - brasRepos.rx) > 0.1,
        'rz ' + brasCharge.rz.toFixed(2) + ' / rx ' + brasCharge.rx.toFixed(2));

    // --- Lâcher : fouetté vers l'avant ---
    G().setCastPower(G().getCastTargetPower());
    G().releaseCast();
    stepFor(0.13);
    const vol = G().getCastAnimation();
    checkEqual('la ligne est en vol', vol.floatState, 'flying');
    check('la canne fouette vers l’avant', vol.swing < -0.1,
        vol.swing.toFixed(2) + ' rad');
    const tipVol = G().getRodTipVisual();
    const thetaCibleVol = theta(talon, vol.cible);
    const thetaCanneVol = theta(talon, tipVol);
    check('en vol, la canne suit la cible réelle (vent compris)',
        ecartAngle(thetaCanneVol, thetaCibleVol) < 0.3,
        (ecartAngle(thetaCanneVol, thetaCibleVol) * 180 / Math.PI).toFixed(1) + '° d’écart');

    // --- À l'eau : la canne reste pointée vers le bouchon ---
    check('le bouchon tombe à l’eau', stepUntil(() => state() === 'inWater', 2),
        state());
    const eau = G().getCastAnimation();
    const tipEau = G().getRodTipVisual();
    const bouchon = G().floatGroup.position;
    const thetaBouchon = theta(talon, bouchon);
    const thetaCanneEau = theta(talon, tipEau);
    check('à l’eau, la canne pointe vers le bouchon',
        ecartAngle(thetaCanneEau, thetaBouchon) < 0.35,
        (ecartAngle(thetaCanneEau, thetaBouchon) * 180 / Math.PI).toFixed(1) + '° d’écart');
    check('le bouchon est bien dans l’étang',
        Math.hypot(bouchon.x, bouchon.z + 40) < 70,
        bouchon.x.toFixed(1) + ' / ' + bouchon.z.toFixed(1));

    stepFor(0.8);
    checkClose('la canne revient au repos après le lancer',
        G().getCastAnimation().swing, 0, 0.05);

    // --- Retour au repos complet ---
    resetToIdle();
    stepFor(1);
    const fin = G().getCastAnimation();
    checkClose('le geste est terminé', fin.swing, 0, 0.02);
    checkClose('le corps revient à son orientation de poste', fin.offsetAngler, 0, 0.05);
    checkClose('la canne revient à son orientation de poste', fin.offsetRod, 0, 0.05);

    // --- Même chose de l'autre côté : l'orientation suit le signe ---
    clearLilyPads();
    const cibleGauche = { x: -14, y: 0, z: -18 };
    G().startCastCharge(cibleGauche);
    stepFor(0.5);
    const gauche = G().getCastAnimation();
    const tipGauche = G().getRodTipVisual();
    const thetaCibleGauche = theta(talon, cibleGauche);
    const thetaCanneGauche = theta(talon, tipGauche);
    check('la canne vise aussi une cible à gauche',
        ecartAngle(thetaCanneGauche, thetaCibleGauche) < 0.25,
        (ecartAngle(thetaCanneGauche, thetaCibleGauche) * 180 / Math.PI).toFixed(1) + '° d’écart');
    check('l’orientation suit une cible différente',
        Math.abs(gauche.offsetRod - charge.offsetRod) > 0.3,
        charge.offsetRod.toFixed(2) + ' -> ' + gauche.offsetRod.toFixed(2));
    G().cancelCast();
    resetToIdle();
    G().demarrerJeu();
}

export default run;
