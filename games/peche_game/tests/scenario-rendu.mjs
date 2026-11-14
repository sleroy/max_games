// ---------------------------------------------------------------------------
// Scénario 9 : rendu — tampon de profondeur et « voile blanc ».
//
// Le bug corrigé : la cible de rendu de la scène était créée SANS tampon de
// profondeur. Résultat : le tri des objets était perdu et l'eau (transparente,
// dessinée en dernier) passait PAR-DESSUS le pêcheur et la bourriche (opaques,
// pourtant devant elle) → ils semblaient « sous un voile blanc ».
// ---------------------------------------------------------------------------
import { group, check, checkEqual, G } from './harness.mjs';

/** Distance d'un point du monde à la caméra. */
function distanceCamera(p) {
    const c = G().camera.position;
    return Math.hypot(p.x - c.x, p.y - c.y, p.z - c.z);
}

export function run() {
    group('41) Rendu : tampon de profondeur et « voile blanc »');

    // 1) La cible de la SCÈNE doit garder un tampon de profondeur.
    const config = G().getPostConfig();
    checkEqual('la cible de la scène garde un tampon de profondeur',
        config.sceneDepthBuffer, true);
    const cible = G().makeSceneTarget(64, 64);
    checkEqual('une cible de scène créée a bien un depthBuffer', cible.depthBuffer, true);
    check('la cible de scène a une texture de couleur', !!cible.texture);

    // 2) Les cibles du bloom (quads plein écran) n'en ont pas besoin.
    checkEqual('les cibles du bloom n’embarquent pas de profondeur',
        config.bloomDepthBuffer, false);

    // 3) Le pêcheur est DEVANT la surface de l'eau : avec la profondeur, l'eau
    //    (transparente) ne peut plus le recouvrir.
    const centre = G().getPondCenter();
    const rayon = G().getPondRadius();
    const cam = G().camera.position;
    const dx = cam.x - centre.x;
    const dz = cam.z - centre.z;
    const longueur = Math.hypot(dx, dz) || 1;
    const pointEau = {
        x: centre.x + (dx / longueur) * rayon,
        y: 0,
        z: centre.z + (dz / longueur) * rayon
    };
    const dEau = distanceCamera(pointEau);
    const dPecheur = distanceCamera(G().angler.position);
    check('le pêcheur est PLUS PRÈS que la surface de l’eau', dPecheur < dEau,
        'pêcheur ' + dPecheur.toFixed(1) + ' u < eau ' + dEau.toFixed(1) + ' u');

    // 4) Le pêcheur est entièrement OPAQUE (sinon il paraîtrait translucide).
    const translucides = [];
    G().angler.traverse(function (obj) {
        const m = obj.material;
        if (obj.isMesh && m && (m.transparent || m.opacity < 1)) {
            translucides.push(obj.type);
        }
    });
    checkEqual('le pêcheur est entièrement opaque', translucides.length, 0);

    // 5) La bourriche est opaque elle aussi (plus de « gaze » translucide).
    const gazes = [];
    if (G().bourriche) {
        G().bourriche.traverse(function (obj) {
            const m = obj.material;
            if (obj.isMesh && m && (m.transparent || m.opacity < 1)) {
                gazes.push(obj.type);
            }
        });
    }
    checkEqual('la bourriche est opaque (plus de voile)', gazes.length, 0);
    check('la bourriche dépasse de l’eau', G().bourriche.position.y > 0.1,
        'hauteur ' + G().bourriche.position.y.toFixed(2));

    // 6) L'eau reste transparente : c'est voulu (mais désormais correctement triée).
    checkEqual('l’eau reste transparente (voulu)', G().water.material.transparent, true);
}

export default run;
