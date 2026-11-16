// ---------------------------------------------------------------------------
// touches.js — CATALOGUE DES TOUCHES : comment bouge un vrai bouchon (durées, mouvements, tirage). Extrait de script.js (v163).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=238';

export function creerTouches(deps) {
    const {
        modeQuiver, wind, biteOrigine, TOUCHES_PAR_ID, rand, TOUCHES
    } = deps;

    // CATALOGUE DES TOUCHES — comment bouge un VRAI bouchon
    // ---------------------------------------------------------------------------
    // Comme au bord de l'eau, le bouchon est plombé : seule sa tige dépasse. Un
    // poisson qui SOULÈVE l'appât fait monter le bouchon (« ascenseur ») ; un poisson
    // qui tire vers le fond ou de côté le fait plonger ou partir. Tant qu'il ne fait
    // que renifler, tapoter ou frôler la ligne, le bouchon ne fait que frémir :
    // CE N'EST PAS LE MOMENT de ferrer. Tout le jeu est de reconnaître le dessin…
    //
    //   forme  : dessin du mouvement (voir mouvementDeTouche)
    //   a      : amplitude (unités ; le bouchon mesure ~3,5 unités avec sa tige)
    //   duree  : durée du mouvement (s) — long = poisson calme, court = poisson vif
    //   rot    : inclinaison maximale (radians ; 1,35 ≈ couché sur le côté)
    //   derive : déplacement latéral (unités)
    //   vrai   : faut-il FERRER quand on voit ça ?
    //   famille: 'enfoncement' | 'remontee' | 'couchage' | 'derive' | 'fausse'
    //   qui    : quels poissons font ça ('tous' | 'petit' | 'gros' | 'vif')


    // Vitesse globale des touches : réglage unique qui accélère (ou ralentit) TOUS
    // les mouvements du bouchon. < 1 = plus rapide. Les dessins restent les mêmes.
    // 0.32 : le bouchon RÉAGIT COMME EN VRAI — une touche se joue en 0,1 à 0,25 s,
    // un simple tapotement en un demi-seconde. C'est la PAUSE entre deux mouvements
    // qui est longue (jusqu'à 8 s), pas le mouvement lui-même.
    etat.VITESSE_TOUCHES = 0.32;

    function dureeTouche(touche) {
        // Plancher très bas : une vraie touche doit pouvoir se jouer en ~0,1 s,
        // exactement comme un bouchon qui disparaît sous l'eau.
        return Math.max(0.1, (touche.duree || 1) * etat.VITESSE_TOUCHES);
    }

    // Dessine le mouvement d'une touche : `p` va de 0 (début) à 1 (fin).
    // Renvoie un déplacement { y, rot, dx, dz }. Tout est LISSE : aucun à-coup.
    //   lisse = 0 → 1 → 0 (le bouchon revient)   tenue = 0 → 1 (il reste)
    function mouvementDeTouche(touche, p, bouchonCourt) {
        const a = touche.a || 0;
        const rot = touche.rot || 0;
        const der = touche.derive || 0;
        const lisse = Math.sin(Math.PI * p);
        const tenue = Math.sin(Math.PI * 0.5 * p);
        const coups = touche.coups || 3;
        // « Sautillement » : les petits coups secs sur l'eau (fréquence élevée). Chaque
        // touche a SA fréquence, SON inclinaison et SA dérive : impossible de les
        // confondre à l'œil.
        const sautille = Math.abs(Math.sin(Math.PI * coups * p));
        switch (touche.forme) {
            case 'frisson':
                // Vibration serrée : le bouchon tremble sans s'enfoncer.
                return { y: -a * sautille * Math.min(1, p * 5) * Math.min(1, (1 - p) * 5),
                    rot: rot * sautille * 0.6 };
            case 'pulse':
                return { y: -a * sautille * lisse, rot: rot * sautille * lisse };
            case 'sinus':
                return { y: -a * lisse };
            case 'double':
                return { y: -a * Math.abs(Math.sin(Math.PI * 2 * p)) * lisse,
                    rot: rot * Math.abs(Math.sin(Math.PI * 2 * p)) * lisse };
            case 'hesitation':
                return { y: -a * lisse * (0.65 + 0.35 * Math.sin(Math.PI * 3 * p)),
                    rot: rot * lisse };
            case 'derive':
                return { y: -a * lisse, dx: der * lisse, dz: der * 0.35 * lisse, rot: rot * lisse };
            case 'tourner':
                return { y: -a * lisse, dx: der * Math.sin(2 * Math.PI * p),
                    dz: der * (1 - Math.cos(2 * Math.PI * p)) * 0.5,
                    rot: rot * Math.sin(2 * Math.PI * p) };
            case 'couchage_retour':
                return { y: a * 0.3 * lisse, rot: rot * lisse };
            case 'couchage':
                return { y: a * tenue, rot: rot * tenue };
            case 'montee':
                if (bouchonCourt) {
                    // Un bouchon court ne peut pas « sortir sa tige » : il se couche.
                    return { y: a * 0.25 * tenue, rot: Math.min(1.35, 1.2 * tenue) };
                }
                return { y: a * tenue, rot: rot * tenue };
            case 'montee_retour':
                if (bouchonCourt) {
                    return { y: a * 0.2 * lisse, rot: 1.1 * lisse };
                }
                return { y: a * lisse };
            case 'descente_lente':
                // Il s'enfonce de plus en plus vite : le gros poisson part avec l'esche.
                return { y: -a * p * p, rot: rot * p };
            case 'file':
                return { y: -a * tenue, dx: der * tenue, dz: der * 0.4 * tenue, rot: rot * tenue };
            case 'descente':
            default:
                return { y: -a * tenue, rot: rot * tenue };
        }
    }

    // Applique un mouvement au bouchon (hauteur, inclinaison, dérive avec le vent).
    function appliquerMouvement(m) {
        // QUIVER : le mouvement du poisson se lit sur le scion, pas sur un bouchon.
        if (etat.techniqueCourante === 'quiver') {
            modeQuiver.appliquer(m);
            return;
        }
        etat.floatGroup.position.y = 0.1 + (m.y || 0);
        etat.floatGroup.rotation.z = m.rot || 0;
        if (m.dx || m.dz) {
            const c = Math.cos(wind.dir);
            const s = Math.sin(wind.dir);
            etat.floatGroup.position.x = biteOrigine.x + (m.dx || 0) * c - (m.dz || 0) * s;
            etat.floatGroup.position.z = biteOrigine.z + (m.dx || 0) * s + (m.dz || 0) * c;
        }
    }

    // Chaque poisson a ses habitudes : un petit poisson « tapote », un gros « coule »
    // lentement ou se couche, un poisson vif emporte l'esche.
    function profilPoisson(taille, agressivite) {
        if (taille < 0.55) {
            return 'petit';
        }
        return (agressivite > 1.05) ? 'vif' : 'gros';
    }

    // Tire une touche du catalogue : vraie ou fausse, selon le poisson.
    function choisirTouche(vrai, taille, agressivite, style) {
        // 1) Les touches PROPRES À L'ESPÈCE : un brochet emporte l'esche d'un coup,
        //    une tanche la soulève, une ablette la tapote, une carpe la coule
        //    lentement… C'est ce qui rend chaque poisson reconnaissable.
        if (style) {
            const ids = vrai ? style.touchesVraies : style.touchesFausses;
            const poolEspece = ids.map(function (id) {
                return TOUCHES_PAR_ID[id];
            }).filter(function (t) {
                return t && t.vrai === vrai;
            });
            if (poolEspece.length) {
                return poolEspece[Math.floor(rand() * poolEspece.length)];
            }
        }
        // 2) Sinon, le profil générique de taille / agressivité.
        const profil = profilPoisson(taille, agressivite);
        let pool = TOUCHES.filter(function (t) {
            // « explicite » : cette touche n'est jouée que dans son cas particulier
            // (la touche à la volée, juste après le lancer).
            return t.vrai === vrai && !t.explicite && (t.qui === 'tous' || t.qui === profil);
        });
        if (!pool.length) {
            pool = TOUCHES.filter(function (t) { return t.vrai === vrai; });
        }
        return pool[Math.floor(rand() * pool.length)];
    }

    return {
        dureeTouche, mouvementDeTouche, appliquerMouvement, choisirTouche
    };
}
