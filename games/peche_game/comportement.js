// ---------------------------------------------------------------------------
// comportement.js — COMPORTEMENT DES POISSONS : vue, zone de vie, banc, vitesse,
// humeur, morsure et nage, propres à chaque espèce (COMPORTEMENTS, especes.js).
// Extrait de script.js (v146).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { COMPORTEMENTS } from './especes.js?v=234';
import { etat } from './etat.js?v=234';
import { rayonVue, rayonRemous as rayonRemousPur, dansCouche, profondeurHamecon, RAYON_VUE_FACILE } from './chanceTouche.js?v=234';
import { heureDeJeu } from './physique.js?v=234';

export function creerComportement(deps) {
    const {
        floatGroup, fondY, comportementRand, POND_CENTER, rayonEtang,
        fishes, animateFishMesh, camera, spawnBubbles, CHUM_ATTRACT_ACCEL, BITE_APPROACH_ACCEL,
        ripples, spawnRipple, CAST_DURATION, fishButton, castTarget, sound, isSnagged, startSnag,
        risqueEmmelement, rand, demarrerEmmElement, modeQuiver, poserHameconAuFond,
        verdictFond, accrochageDe, majCoupeProfondeur, statusDisplay, castStart, wind, waterWaveHeightAt,
        nibbleRand, MAX_WAIT, consumeCrankTurns, startReel, findBitingFish, showBiteView,
        floatIdle, tenterAttaquePredateur, REEL_PER_TURN, angler,
        startHoldingFish, endCast, updateCrankVisibility, rodTipVisual, LINE_SEGMENTS,
        linePositions, lineGeometry
    } = deps;

    // MODE FACILE (enfant) : les poissons repèrent l'hameçon de très loin et
    // nagent droit dessus, quelle que soit leur zone de vie ou leur couche d'eau.
    const MODE_FACILE_RAYON = RAYON_VUE_FACILE;   // unités (l'étang fait ~90 de rayon) — chanceTouche.js
    const MODE_FACILE_VITESSE = 9;     // approche (BITE_APPROACH_ACCEL = 4.5)

    // ---------------------------------------------------------------------------
    // COMPORTEMENT DES POISSONS : vue, zone de vie, banc, vitesse et humeur propres
    // à chaque espèce (voir COMPORTEMENTS dans especes.js).
    // ---------------------------------------------------------------------------
    // Distance à laquelle le poisson repère l'appât (unités) : règle unique de chanceTouche.js.
    function rayonVueEspece(data) {
        return rayonVue(data.comp, heureDeJeu(etat.dayPhase), etat.weatherPluie);
    }

    // L'appât est-il devant ou sur le côté du poisson (±120°) ?
    function dansChampDeVision(data, bx, bz, bd) {
        const sp = Math.hypot(data.vx, data.vz);
        if (sp < 0.02 || bd < 0.001) { return true; }
        return (data.vx * bx + data.vz * bz) / (sp * bd) > -0.5;
    }

    // Le poisson ne quitte (presque) pas sa zone de vie : un appât trop loin d'elle
    // ne l'intéresse pas.
    function baitDansDomaine(data) {
        if (data.homeX === undefined) { return true; }
        const d = Math.hypot(floatGroup.position.x - data.homeX, floatGroup.position.z - data.homeZ);
        return d < data.homeRadius * 1.25 + 1;
    }

    // L'hameçon est-il dans la couche d'eau de l'espèce ? Une espèce « de fond » mord
    // si l'hameçon est posé près du relief, quelle que soit la profondeur de l'étang.
    // Règle unique de chanceTouche.js (fond, thermocline) : le jeu et la matrice de tests la partagent.
    function hameconDansZone(data, zone) {
        return dansCouche(data.couche, zone, etat.HOOK_DEPTH, fondY(floatGroup.position.x, floatGroup.position.z), etat.thermocline);
    }

    // §15.1 (physique.js) : la thermocline et la chaleur gardent le poisson au-dessus de l'eau froide ;
    // l'eau froide le ralentit. Hors saison chaude, ces trois fonctions ne changent rien.
    function plancherPoisson(y) { return etat.plancherPoisson ? etat.plancherPoisson(y) : y; }
    function vitaliteEau(c) { return etat.vitaliteEau ? etat.vitaliteEau(c) : 1; }
    function ajusterCouche(data, dt) {
        if (!etat.profondeurPhysique) { return; }
        const ref = data.profNat === undefined ? data.depth : data.profNat;
        const voulue = etat.profondeurPhysique(ref);
        if (data.profNat === undefined) {
            if (Math.abs(voulue - data.depth) < 1e-6) { return; }       // rien à changer : on ne touche à rien
            data.profNat = data.depth;                                  // on garde la profondeur naturelle
        }
        data.depth += (voulue - data.depth) * Math.min(1, dt * 1.5);
        if (voulue === data.profNat && Math.abs(data.depth - data.profNat) < 0.01) {
            data.depth = data.profNat;                                   // l'eau est brassée : il retrouve sa couche
            data.profNat = undefined;
        }
    }

    // ---------------------------------------------------------------------------
    // PETIT COUP DE MOULINET (§14.9) : un léger mouvement de la manivelle fait bouger
    // l'esche sur place et crée un remous ; les poissons déjà TOUT PROCHES s'y
    // intéressent. Ce n'est pas un aimant : rayon ≈ 3 unités (vue ≈ 7, chanceTouche.js),
    // effet qui retombe en REMOUS_DUREE secondes, plafonné à 1. Un geste franc
    // (≥ GESTE_RAPPEL_TOURS) ramène la ligne, comme avant. L'intensité vit dans
    // etat.remous (0 → 1) ; elle n'existe que bouchon à l'eau, sans combat ni accrochage.
    // ---------------------------------------------------------------------------
    const REMOUS_DUREE = 3;           // secondes pour retomber de 1 à 0
    const REMOUS_GAIN = 10;           // intensité gagnée par tour de manivelle (1 tour = 1 geste franc)
    const GESTE_RAPPEL_TOURS = 0.3;   // au-delà (cumulé sur un même geste), on ramène la ligne
    const GESTE_PAUSE = 0.5;          // secondes sans manivelle : le geste est terminé
    etat.remous = 0;
    etat.moulinetGeste = 0;
    etat.moulinetRepos = 0;
    etat.remousRond = 0;

    // Distance à laquelle CE poisson sent le remous en ce moment (0 = rien) : chanceTouche.js.
    function rayonRemous(data) {
        return rayonRemousPur(etat.remous, data.aggression, data.comp && data.comp.humeur);
    }

    // Appelé à chaque image bouchon à l'eau, avec les tours de manivelle de l'image.
    // Renvoie true quand le geste est franc : il faut ramener la ligne.
    function dandiner(dt, tours) {
        etat.remous = Math.max(0, etat.remous - dt / REMOUS_DUREE);
        etat.remousRond -= dt;
        if (tours <= 0) {
            etat.moulinetRepos += dt;
            if (etat.moulinetRepos > GESTE_PAUSE) { etat.moulinetGeste = 0; }
            return false;
        }
        etat.moulinetRepos = 0;
        etat.moulinetGeste += tours;
        if (etat.moulinetGeste >= GESTE_RAPPEL_TOURS) {
            etat.moulinetGeste = 0;
            etat.remous = 0;
            return true;
        }
        etat.remous = Math.min(1, etat.remous + tours * REMOUS_GAIN);
        if (etat.remousRond <= 0 && ripples.length < 10) {
            etat.remousRond = 0.5;
            spawnRipple(floatGroup.position);
        }
        return false;
    }

    const etatsGroupes = {};

    // Humeur : l'espèce alterne ses phases (le brochet guette puis bondit, la tanche
    // fouille le fond, le gardon nage presque sans arrêt). Un banc partage son humeur.
    function humeurCourante(data, dt, time) {
        const c = data.comp;
        const porteur = data.groupeId !== undefined
            ? (etatsGroupes[data.groupeId] || (etatsGroupes[data.groupeId] = { t: 0, etat: 'nage', vu: -1 }))
            : data;
        if (porteur.vu === time) { return porteur.etat || 'nage'; }
        porteur.vu = time;
        porteur.t = (porteur.t === undefined ? 0 : porteur.t) - dt;
        if (porteur.t <= 0 || porteur.etat === undefined) {
            const r = comportementRand();
            if (c.humeur === 'embuscade') {
                if (porteur.etat === 'guet') { porteur.etat = 'bond'; porteur.t = 0.7 + r * 0.6; }
                else { porteur.etat = 'guet'; porteur.t = 4 + r * 6; }
            } else if (c.humeur === 'fouille') {
                if (porteur.etat === 'fouille') { porteur.etat = 'nage'; porteur.t = 3 + r * 4; }
                else { porteur.etat = 'fouille'; porteur.t = 2 + r * 4; }
            } else if (r < 0.12) {
                porteur.etat = 'repos'; porteur.t = 1 + comportementRand() * 2;
            } else {
                porteur.etat = 'nage'; porteur.t = 4 + r * 8;
            }
        }
        return porteur.etat;
    }

    function angleEntre(a, b) {
        let d = b - a;
        while (d > Math.PI) { d -= Math.PI * 2; }
        while (d < -Math.PI) { d += Math.PI * 2; }
        return d;
    }

    function nageNaturelle(fish, data, dt, time) {
        const c = data.comp;
        if (!c) { return; }
        const etat = humeurCourante(data, dt, time);
        // Vitesse visée selon l'humeur.
        let vitCible = c.croisiere;
        if (etat === 'guet') { vitCible = 0.04; }
        else if (etat === 'bond') { vitCible = c.pointe * 0.75; }
        else if (etat === 'fouille') { vitCible = c.croisiere * 0.2; }
        else if (etat === 'repos') { vitCible = c.croisiere * 0.35; }
        vitCible *= vitaliteEau(c);          // eau froide : léthargie (physique.js)
        // Un poisson ferré puis perdu reste nerveux (voir punishFish) : il se calme peu à peu.
        const sp = Math.hypot(data.vx, data.vz);
        let cap = sp > 0.01 ? Math.atan2(data.vz, data.vx) : (data.cap || 0);
        // Direction souhaitée = cap + dérive douce + attirances.
        cap += (Math.sin(time * 0.9 + data.phase * 3) * 0.6 + Math.sin(time * 2.3 + data.phase) * 0.4)
            * c.virage * 0.35 * dt;
        let ux = Math.cos(cap);
        let uz = Math.sin(cap);
        const g = data.groupeId !== undefined ? groupesFrame[data.groupeId] : null;
        if (g && g.n > 1 && c.cohesion > 0) {
            const gx = g.x / g.n - fish.position.x;
            const gz = g.z / g.n - fish.position.z;
            const gd = Math.hypot(gx, gz);
            // Trop loin du banc : on le rejoint ; très près : on s'écarte un peu.
            if (gd > 1.6) {
                const w = Math.min(1.5, (gd - 1.6) * 0.5) * c.cohesion;
                ux += (gx / gd) * w; uz += (gz / gd) * w;
            } else if (gd < 0.5 && gd > 0.001) {
                ux -= (gx / gd) * 0.3; uz -= (gz / gd) * 0.3;
            }
            // Même direction que ses voisins.
            const gv = Math.hypot(g.vx, g.vz);
            if (gv > 0.01) {
                ux += (g.vx / gv) * 0.5 * c.cohesion;
                uz += (g.vz / gv) * 0.5 * c.cohesion;
            }
            // Nage à l'allure du banc.
            vitCible += ((gv / g.n) - vitCible) * 0.4 * c.cohesion;
        }
        // Zone de vie : rappel de plus en plus fort près de la limite.
        const hx = data.homeX - fish.position.x;
        const hz = data.homeZ - fish.position.z;
        const hd = Math.hypot(hx, hz);
        const limite = data.homeRadius;
        if (hd > limite * 0.6 && hd > 0.001) {
            const w = Math.min(4, ((hd - limite * 0.6) / (limite * 0.4)) * 2);
            ux += (hx / hd) * w; uz += (hz / hd) * w;
        }
        // Évitement du bord de l'étang : on vire AVANT de toucher la rive.
        const ex = fish.position.x - POND_CENTER.x;
        const ez = fish.position.z - POND_CENTER.z;
        const ed = Math.hypot(ex, ez);
        const bordLocal = rayonEtang(Math.atan2(ez, ex)) - 5;
        if (ed > bordLocal - 4 && ed > 0.001) {
            const w = Math.min(3, (ed - (bordLocal - 4)) * 0.8);
            ux -= (ex / ed) * w; uz -= (ez / ed) * w;
        }
        // Virage limité par l'agilité de l'espèce (un brochet ne vire pas sur place).
        const voulu = Math.atan2(uz, ux);
        const maxTurn = c.virage * (etat === 'bond' ? 1.6 : 1) * dt;
        cap += Math.max(-maxTurn, Math.min(maxTurn, angleEntre(cap, voulu)));
        // Près de la limite de sa zone, le poisson fait demi-tour franchement.
        if (hd > limite * 1.1 && hd > 0.001) {
            cap += angleEntre(cap, Math.atan2(hz, hx)) * Math.min(1, dt * 3);
        }
        data.cap = cap;
        const nouvelle = sp + (vitCible - sp) * Math.min(1, dt * (etat === 'bond' ? 6 : 1.6));
        const v = Math.min(c.pointe, Math.max(0, nouvelle));
        data.vx = Math.cos(cap) * v;
        data.vz = Math.sin(cap) * v;
        // Un poisson « de fond » suit le relief ; les autres gardent leur tranche d'eau.
        if (data.couche === 'fond') {
            const cibleY = plancherPoisson(fondY(fish.position.x, fish.position.z) + 0.45);
            // Suivi du relief : 3 par seconde (1,5 avant). Les bords des fosses ont des
            // pentes de 30 % ; à 1,5 un poisson lancé à 4 unités/s décollait de > 1,4.
            data.depth += (cibleY - data.depth) * Math.min(1, dt * 3);
        } else {
            ajusterCouche(data, dt);
        }
    }

    // Barycentre et direction moyenne de chaque banc, recalculés à chaque image.
    const groupesFrame = {};
    function majGroupes() {
        for (const id in groupesFrame) { groupesFrame[id].n = 0; }
        fishes.forEach(function (f) {
            const d = f.userData;
            if (d.groupeId === undefined || d.hooked || d.biting) { return; }
            const g = groupesFrame[d.groupeId]
                || (groupesFrame[d.groupeId] = { x: 0, z: 0, vx: 0, vz: 0, n: 0 });
            if (g.n === 0) { g.x = 0; g.z = 0; g.vx = 0; g.vz = 0; }
            g.x += f.position.x; g.z += f.position.z;
            g.vx += d.vx; g.vz += d.vz; g.n++;
        });
    }

    function updateFish(dt, time) {
        etat.baitInterest = false;
        majGroupes();
        fishes.forEach(fish => {
            const data = fish.userData;
            if (fish === etat.heldFish) {
                animateFishMesh(data, time * 15 + data.phase, 0.08);
                return; // le poisson en main est posé par le joueur
            }
            data.details.visible = fish.position.distanceToSquared(camera.position) < 1089;
            if (data.biting) {
                fish.position.x = floatGroup.position.x + Math.sin(time * 20) * 0.12;
                fish.position.z = floatGroup.position.z + Math.cos(time * 18) * 0.12;
                fish.position.y = etat.HOOK_DEPTH - data.topOffset + Math.sin(time * 20) * 0.05;
                fish.rotation.y = Math.sin(time * 18) * 0.4;
                if (fish.visible) { animateFishMesh(data, time * 22, 0.18); }
                return;
            }
            if (data.hooked) {
                if (etat.floatState === 'reeling') {
                    fish.visible = true;   // combat gagné : le poisson est bien visible
                    animateFishMesh(data, time * 12 + data.phase, 0.11);
                    return; // position gérée par la remontée
                }
                // Épreuve de force : le poisson remonte par intermittence puis
                // replonge et redevient invisible (seules les bulles le trahissent).
                data.surfacePhase = (data.surfacePhase || 0) + dt;
                const houle = Math.sin(data.surfacePhase * 1.6);
                const profondeur = -0.15 - (1 - houle) * 1.1;
                fish.visible = profondeur > -0.85;
                fish.position.x = etat.strugglePos.x + Math.sin(time * 30) * 0.15;
                fish.position.z = etat.strugglePos.z + Math.cos(time * 25) * 0.15;
                fish.position.y = profondeur - data.topOffset;
                fish.rotation.y = Math.sin(time * 15) * 0.5;
                if (fish.visible) { animateFishMesh(data, time * 25, 0.23); }
                if (!fish.visible) {
                    data.diveBubbleTimer = (data.diveBubbleTimer || 0) - dt;
                    if (data.diveBubbleTimer <= 0) {
                        data.diveBubbleTimer = 0.6;
                        spawnBubbles(fish.position, 2);
                    }
                }
                return;
            }
            data.targeting = false;
            data.attire = false;
            // L'amorce attire les poissons vers la SPHÈRE de miettes (§17.4).
            if (etat.chum && etat.chum.strength > 0) {
                const R = etat.chum.radius;                       // rayon de la sphère (6 u)
                const detect = etat.chum.detect || R * 3;          // où le poisson la sent
                const cx = etat.chum.position.x - fish.position.x;
                const cz = etat.chum.position.z - fish.position.z;
                const cd = Math.hypot(cx, cz);                     // distance au CENTRE
                if (cd < detect && cd > 0.001) {
                    // L'amorçage n'attire que les poissons de SA couche d'eau.
                    if (Math.abs(data.depth - etat.chum.position.y) > 1.6) {
                        return;
                    }
                    data.attire = true;
                    // HORS de la sphère : on y va. DEDANS : on FOUILLE — le poisson tourne
                    // dans le nuage, et vise l'hameçon s'il est dans la sphère ET qu'il le
                    // VOIT (portée de vue de son espèce, déjà réaliste et réduite la nuit).
                    let cible = etat.chum.position;
                    if (cd <= R) {
                        const t = time || 0;
                        if (!data.chumCible || t >= data.chumCible.t) {
                            const comp = COMPORTEMENTS[data.especeId] || {};
                            const vue = Math.min(R, comp.vue || 5);
                            const fl = floatGroup.position;
                            const dHookCentre = Math.hypot(fl.x - etat.chum.position.x, fl.z - etat.chum.position.z);
                            const hookDansSph = dHookCentre <= R;
                            const voit = hookDansSph
                                && Math.hypot(fl.x - fish.position.x, fl.z - fish.position.z) <= vue;
                            // Priorité dégressive : plein au cœur (≤ 2 u), nul au bord (R).
                            const p = Math.max(0, Math.min(1, (R - dHookCentre) / Math.max(0.001, R - 2)));
                            if (voit && comportementRand() < p * 0.5) {
                                data.chumCible = { x: fl.x, y: etat.HOOK_DEPTH, z: fl.z, t: t + 2.5 };
                            } else {
                                const a = comportementRand() * Math.PI * 2;
                                const r = Math.sqrt(comportementRand()) * R * 0.9;
                                data.chumCible = {
                                    x: etat.chum.position.x + Math.cos(a) * r,
                                    y: etat.chum.position.y + (comportementRand() * 2 - 1) * 1.2,
                                    z: etat.chum.position.z + Math.sin(a) * r,
                                    t: t + 2 + comportementRand() * 2
                                };
                            }
                        }
                        cible = data.chumCible;
                    }
                    // Un poisson ne quitte JAMAIS sa tranche d'eau : on borne la
                    // profondeur visée à sa zone (rotengle et brème restaient sinon
                    // coincés sous la surface en fouillant le nuage).
                    const zoneEsp = data.profondeurZone;
                    let profCible = cible.y;
                    if (zoneEsp && zoneEsp.length === 2) {
                        profCible = Math.max(zoneEsp[0], Math.min(zoneEsp[1], profCible));
                    }
                    const tx = cible.x - fish.position.x;
                    const tz = cible.z - fish.position.z;
                    const td = Math.hypot(tx, tz) || 1;
                    const accel = CHUM_ATTRACT_ACCEL * etat.chum.strength * dt;
                    data.vx += (tx / td) * accel;
                    data.vz += (tz / td) * accel;
                    // Le poisson descend vers sa cible (nuage ou hameçon), dans SA tranche.
                    data.depth += (profCible - data.depth) * Math.min(1, dt * 1.5);
                    // Tout près de sa cible, il ralentit et picore.
                    if (td < 0.6) {
                        data.vx *= 0.94;
                        data.vz *= 0.94;
                    }
                    // Vitesse bornée pour rester crédible.
                    const sp = Math.hypot(data.vx, data.vz);
                    const maxSp = 4.5;
                    if (sp > maxSp) {
                        data.vx = (data.vx / sp) * maxSp;
                        data.vz = (data.vz / sp) * maxSp;
                    }
                }
            }
            // Un poisson qui passe près du bouchon vient renifler l'hameçon : il s'en
            // approche et remonte vers la surface. C'est ce qui rend la touche visible.
            // Le poisson s'intéresse au bouchon tant qu'il est à l'eau — y compris
            // pendant la remontée de la ligne (s'il n'y a pas déjà un poisson ferré).
            if (!etat.fishCaught && !etat.hookedFish
                && (etat.floatState === 'inWater' || etat.floatState === 'reeling')) {
                const bx = floatGroup.position.x - fish.position.x;
                const bz = floatGroup.position.z - fish.position.z;
                const bd = Math.hypot(bx, bz);
                // VUE RÉALISTE : chaque espèce repère l'appât à SA distance, réduite la nuit
                // (sauf les chasseurs nocturnes) et par eau trouble (pluie). Le poisson
                // voit devant et sur les côtés, pas dans son dos : derrière lui, il ne
                // sent l'appât que de très près (ligne latérale, odorat, barbillons).
                const zoneEsp = data.profondeurZone;
                const zoneOk = hameconDansZone(data, zoneEsp) && baitDansDomaine(data);
                const refus = etat.refuseLEsche(data);   // il a refusé l'esche pendant ce lancer : il s'en désintéresse
                // MODE FACILE : aimant à poissons. L'hameçon est repéré de très loin,
                // sans refus d'esche, sans zone de vie ni couche d'eau : le poisson
                // nage droit sur lui (c'est le mode « pêche ludique » pour enfants). Seule une esche
                // sous le seuil (esches.js, SEUIL_FACILE) est ignorée : le poisson ne vient pas.
                const facile = !!etat.modeFacile;
                const vu = facile
                    ? bd < MODE_FACILE_RAYON && !etat.escheSansEspoir(data)
                    : !refus && bd < rayonVueEspece(data) && zoneOk && !etat.hameconDansLaVase
                        && (bd < 2.2 || dansChampDeVision(data, bx, bz, bd)) && !etat.escheSansEspoir(data);
                // Remous d'un petit coup de moulinet : il ravive l'intérêt d'un poisson tout proche (même dans
                // son dos), sans le sortir de sa zone de vie ni de sa couche d'eau (seul `vu` change sa profondeur).
                const senti = !vu && !refus && zoneOk && etat.floatState === 'inWater' && bd < rayonRemous(data)
                    && !etat.hameconDansLaVase && !etat.escheSansEspoir(data);   // vase, esche immangeable : il ignore
                if (vu || senti) {
                    etat.patienceEsche(data, dt);   // trop longtemps sans mordre : il se lasse (esches.js)
                    etat.baitInterest = true;
                    data.targeting = true;
                    const inv = bd > 0.001 ? 1 / bd : 0;
                    const wanted = Math.min(facile ? MODE_FACILE_VITESSE : BITE_APPROACH_ACCEL,
                        bd * (facile ? 3 : 2.2));
                    const k = Math.min(1, dt * 4);
                    data.vx += (bx * inv * wanted - data.vx) * k;
                    data.vz += (bz * inv * wanted - data.vz) * k;
                    if (vu) {
                        data.depth += (etat.HOOK_DEPTH - data.depth) * Math.min(1, dt * (facile ? 4 : 2.5));
                    }
                }
            }
            // Nage naturelle (cap, vitesse, banc, pauses, domaine vital) tant que le
            // poisson ne poursuit ni l'appât ni l'amorce.
            if (!data.targeting && !data.attire) {
                nageNaturelle(fish, data, dt, time);
            }
            fish.position.x += data.vx * dt;
            fish.position.z += data.vz * dt;

            const dx = fish.position.x - POND_CENTER.x;
            const dz = fish.position.z - POND_CENTER.z;
            const dist = Math.hypot(dx, dz);
            // Un poisson qui vise l'hameçon peut venir jusqu'au bord : le bouchon
            // peut être posé tout près de la rive. La limite suit le bord LOCAL.
            const rayonLocal = rayonEtang(Math.atan2(dz, dx));
            const limit = data.targeting ? rayonLocal - 0.5 : rayonLocal - 5;
            if (dist > limit) {
                const nx = dx / dist;
                const nz = dz / dist;
                const dot = data.vx * nx + data.vz * nz;
                data.vx -= 2 * dot * nx;
                data.vz -= 2 * dot * nz;
                fish.position.x = POND_CENTER.x + nx * limit;
                fish.position.z = POND_CENTER.z + nz * limit;
            }

            // Nage : ondulation du corps, inclinaison dans les virages, queue.
            const yaw = Math.atan2(-data.vz, data.vx);
            let yawDelta = yaw - (data.prevYaw === undefined ? yaw : data.prevYaw);
            while (yawDelta > Math.PI) yawDelta -= Math.PI * 2;
            while (yawDelta < -Math.PI) yawDelta += Math.PI * 2;
            data.prevYaw = yaw;
            fish.rotation.y = yaw;
            fish.rotation.z = Math.max(-0.45, Math.min(0.45, yawDelta * 5))
                + Math.sin(time * 2 + data.phase) * 0.05;
            // position.y = profondeur du dos − hauteur du poisson : il reste sous l'eau,
            // seuls les gros poissons montrent leur dorsale près de la surface.
            // Le poisson reste toujours au-dessus du relief (le fond est un bassin).
            const yBas = fondY(fish.position.x, fish.position.z) + 0.3;
            fish.position.y = Math.max(yBas,
                data.depth - data.topOffset + Math.sin(time * 2 + data.phase) * 0.12);
            // Poisson caché sous l'eau : seules ses bulles et son sillage le trahissent.
            fish.visible = false;
            if (data.bubbleTimer === undefined) {
                data.bubbleTimer = 1.5 + (data.phase % 4);
            }
            data.bubbleTimer -= dt;
            if (data.bubbleTimer <= 0) {
                data.bubbleTimer = 4 + ((data.phase * 5) % 5);
                spawnBubbles(fish.position, 3);
            }
            // Sillage : une petite ondulation quand le poisson nage près de la surface.
            if (data.wakeTimer === undefined) {
                data.wakeTimer = 1 + (data.phase % 2.5);
            }
            data.wakeTimer -= dt;
            if (data.wakeTimer <= 0) {
                data.wakeTimer = 2.5 + ((data.phase * 7) % 3);
                if (data.depth > -1.8 && ripples.length < 10) {
                    spawnRipple(fish.position);
                }
            }
        });
    }

    // ---------------------------------------------------------------------------
    // FOND SOUS LE BOUCHON (§14.8). Le verdict « hameçon dans la vase » se calcule
    // avec verdictFond à la position du bouchon (jamais au point visé) : à l'arrivée,
    // puis à CHAQUE image tant que le bouchon flotte, donc aussi après une dérive au
    // vent. Le schéma de coupe (ligne.js) utilise la même fonction.
    // Renvoie true si l'hameçon vient de s'accrocher dans la vase (transition
    // « pas dans la vase → dans la vase » : jamais de nouvel accrochage à chaque image).
    // ---------------------------------------------------------------------------
    function jugerFond() {
        const pos = floatGroup.position;
        const verdict = verdictFond(pos.x, pos.z, etat.profondeurLigne, modeQuiver.estActif());
        // Sur le sable ou le gravier, un hameçon trop long REPOSE sur le fond (§14.3) : sa
        // profondeur utile (touche, poissons de fond) est celle du fond, pas celle de la ligne.
        // Au quiver, poserHameconAuFond règle déjà la profondeur : on n'y touche pas.
        if (!modeQuiver.estActif()) {
            etat.HOOK_DEPTH = profondeurHamecon(etat.profondeurLigne, verdict.profondeurEau, verdict.surLeFond, verdict.dansLaVase);
        }
        const avant = etat.hameconDansLaVase;
        etat.hameconDansLaVase = verdict.dansLaVase;
        if (verdict.dansLaVase) { etat.fondPris = verdict.dans; }   // « dans la vase », « pris dans l’herbier »…
        if (verdict.dansLaVase === avant) { return false; }
        if (!verdict.dansLaVase) {
            floatGroup.rotation.z = 0;   // le bouchon se redresse
            majCoupeProfondeur();
            return false;
        }
        // Pas d'accrochage pendant un combat, un accrochage déjà en cours, un
        // emmêlement, une touche ou un poisson ferré.
        if (etat.floatState !== 'inWater' || etat.snag || etat.struggle
            || etat.hookedFish || etat.fishCaught || etat.biteFish) {
            majCoupeProfondeur();
            return false;
        }
        // La ligne accrochée reste là où le bouchon est vraiment.
        castTarget.x = pos.x;
        castTarget.z = pos.z;
        // Selon le fond : vase (aspire), herbier (comme les nénuphars) ou roche (court).
        startSnag(accrochageDe(verdict.substrat));
        majCoupeProfondeur();
        return true;
    }

    function updateFloat(dt, time) {
        if (etat.floatState !== 'inWater') {
            etat.remous = 0;            // pas de remous en combat, accrochage, emmêlement…
            etat.moulinetGeste = 0;
        }
        if (etat.floatState === 'flying') {
            etat.castT += dt / CAST_DURATION;
            if (etat.castT >= 1) {
                etat.castT = 1;
                fishButton.disabled = true;
                fishButton.hidden = true;
                floatGroup.position.copy(castTarget);
                spawnRipple(castTarget);
                sound.splash();
                const accroc = isSnagged(castTarget);
                if (accroc) {
                    startSnag(accroc === true ? undefined : accroc);   // nénuphar, ou obstacle
                } else if (!etat.ligneTendue && risqueEmmelement() > 0 && rand() < risqueEmmelement()) {
                    // La ligne n'a pas été tendue : elle s'est emmêlée en touchant
                    // l'eau. Pas de pêche tant que le mini-jeu n'est pas résolu.
                    demarrerEmmElement();
                    return;
                } else {
                    etat.floatState = 'inWater';
                    etat.waitTimer = 0;
                    etat.depuisLancement = 0;
                    etat.hameconDansLaVase = false;
                    consumeCrankTurns();   // les tours donnés avant l'arrivée du bouchon sont perdus
                    if (modeQuiver.estActif()) { poserHameconAuFond(); }
                    // Verdict du fond SOUS LE BOUCHON, à son arrivée (§14.8) : trop
                    // profond pour l'eau d'ici, l'hameçon s'enfonce dans la vase et
                    // s'y accroche, comme dans les nénuphars (il faut le dégager).
                    if (jugerFond()) { return; }
                    statusDisplay.textContent = etat.techniqueCourante === 'quiver'
                        ? 'Surveille le scion.'
                        : 'Surveille le bouchon.';
                    majCoupeProfondeur();
                }
            } else {
                const x = THREE.MathUtils.lerp(castStart.x, castTarget.x, etat.castT);
                const z = THREE.MathUtils.lerp(castStart.z, castTarget.z, etat.castT);
                const y = THREE.MathUtils.lerp(castStart.y, castTarget.y, etat.castT) + Math.sin(Math.PI * etat.castT) * 6;
                floatGroup.position.set(x, y, z);
            }
        } else if (etat.floatState === 'inWater') {
            // Le bouchon flotte sur la houle (la même que la surface de l'eau) : il ne
            // bouge PAS tout seul. Comme en vrai, il reste presque immobile et il faut
            // de la patience avant qu'un poisson s'intéresse à l'appât.
            floatGroup.position.x += Math.cos(wind.dir) * wind.strength * 0.6 * dt;
            floatGroup.position.z += Math.sin(wind.dir) * wind.strength * 0.6 * dt;
            // Le vent fait dériver le bouchon… mais la ligne est TENUE : il ne peut
            // pas s'en aller à l'autre bout de l'étang (2 m maximum autour du posé).
            const deriveX = floatGroup.position.x - castTarget.x;
            const deriveZ = floatGroup.position.z - castTarget.z;
            const derive = Math.hypot(deriveX, deriveZ);
            if (derive > 4) {
                floatGroup.position.x = castTarget.x + (deriveX / derive) * 4;
                floatGroup.position.z = castTarget.z + (deriveZ / derive) * 4;
            }
            const houle = waterWaveHeightAt(floatGroup.position.x, floatGroup.position.z, time);
            // Un petit coup de moulinet fait trembler l'esche (le remous s'éteint en 3 s).
            floatGroup.position.y = 0.1 + houle - 0.04 * etat.remous * Math.abs(Math.sin(time * 16));
            // Le bouchon a dérivé : le fond n'est plus forcément le même sous lui.
            if (jugerFond()) { return; }
            etat.depuisLancement += dt;
            if (etat.hameconDansLaVase) {
                // L'hameçon est dans la vase : le bouchon se couche et rien ne mord.
                floatGroup.rotation.z = 1.45;
            }
            // Un poisson qui renifle l'appât fait « mordiller » le bouchon de temps
            // en temps. Les ondulations sont ALÉATOIRES (intervalles, durée et
            // amplitude varient) : impossible de chronométrer le clic. On utilise un
            // petit générateur LOCAL pour ne pas décaler le hasard du monde.
            if (etat.baitInterest) {
                if (!etat.nibbleInteretAvant) {
                    // Nouvelle approche : nouvelle séquence, dérivée de l'instant.
                    etat.nibbleRngState = ((Math.floor(time * 1000) ^ 0x9e3779b9) >>> 0) || 1;
                    etat.nibbleSuivant = 0.2 + nibbleRand() * 0.9;
                    etat.nibbleDebut = -1;
                    etat.nibblePhase = 0;
                }
                etat.nibbleInteretAvant = true;
                if (etat.nibbleDebut < 0) {
                    etat.nibbleSuivant -= dt;
                    if (etat.nibbleSuivant <= 0) {
                        etat.nibbleDebut = time;
                        etat.nibbleDuree = 0.2 + nibbleRand() * 0.55;
                        etat.nibbleAmplitude = 0.03 + nibbleRand() * 0.06;
                        spawnRipple(floatGroup.position);
                    }
                } else {
                    const avancement = (time - etat.nibbleDebut) / etat.nibbleDuree;
                    if (avancement >= 1) {
                        etat.nibbleDebut = -1;
                        etat.nibblePhase = 0;
                        // Parfois un deuxième rond juste après le mordillement.
                        if (nibbleRand() < 0.3) {
                            spawnRipple(floatGroup.position);
                        }
                        // Intervalle ALÉATOIRE avant le prochain mordillement.
                        etat.nibbleSuivant = nibbleRand() < 0.25
                            ? 0.12 + nibbleRand() * 0.35   // parfois deux coups rapprochés
                            : 0.6 + nibbleRand() * 2.4;    // sinon 0,6 à 3,0 s
                    } else {
                        etat.nibblePhase = Math.sin(Math.PI * avancement);
                        floatGroup.position.y -= etat.nibbleAmplitude * etat.nibblePhase;
                    }
                }
            } else {
                etat.nibbleInteretAvant = false;
                etat.nibbleDebut = -1;
                etat.nibbleSuivant = 0;
                etat.nibblePhase = 0;
            }
            // Un poisson qui renifle l'esche fait patienter plus longtemps.
            if (etat.baitInterest) {
                etat.waitTimer = Math.min(etat.waitTimer, MAX_WAIT - 6);
            }
            etat.waitTimer += dt;
            // Un tour de manivelle pendant l'attente : on ramène la ligne (pour
            // relancer ailleurs). La manivelle est le SEUL moyen de ramener la
            // ligne : ni le clic ni le clavier ne le font (voir pointerdown).
            // Petit coup : remous (§14.9) ; geste franc : on ramène la ligne.
            if (dandiner(dt, consumeCrankTurns())) {
                startReel();
                return;
            }
            if (etat.biteCooldown > 0) {
                etat.biteCooldown -= dt;
            } else if (!etat.hameconDansLaVase) {
                const fish = findBitingFish();
                if (fish) {
                    showBiteView(fish);
                }
            }
        } else if (etat.floatState === 'bite') {
            // Filet de sécurité : si la touche s'est terminée (fermeture différée
            // d'une touche ratée), on rend la main au lieu de rester bloqué.
            if (!etat.biteViewActive) {
                etat.floatState = 'inWater';
                etat.waitTimer = 0;
                etat.biteCooldown = 1.0;
                statusDisplay.textContent = 'Le poisson est reparti… clique sur l’eau pour relancer.';
            }
        } else if (etat.floatState === 'struggle') {
            floatGroup.position.x = etat.strugglePos.x + Math.sin(time * 30) * 0.08;
            floatGroup.position.z = etat.strugglePos.z + Math.cos(time * 25) * 0.08;
            floatGroup.position.y = 0.1 + Math.sin(time * 20) * 0.05;
        } else if (etat.floatState === 'snag') {
            floatGroup.position.x = castTarget.x + Math.sin(time * 25) * 0.05;
            floatGroup.position.z = castTarget.z + Math.cos(time * 22) * 0.05;
            floatGroup.position.y = 0.1 + Math.sin(time * 18) * 0.04;
        } else if (etat.floatState === 'broken') {
            etat.lineBrokenTimer -= dt;
            if (etat.lineBrokenTimer <= 0) {
                floatGroup.visible = true;
                floatGroup.position.copy(floatIdle);
                etat.floatState = 'idle';
                fishButton.disabled = false;
            }
        } else if (etat.floatState === 'reeling') {
            // On ramène la ligne… mais le bouchon est TOUJOURS dans l'eau : un poisson
            // peut encore mordre ! (Sauf si on ramène déjà un poisson ferré.)
            if (!etat.hookedFish) {
                if (etat.biteCooldown > 0) {
                    etat.biteCooldown -= dt;
                } else {
                    const fish = findBitingFish();
                    if (fish) {
                        showBiteView(fish);
                        return;
                    }
                }
            }
            // Un carnassier peut intercepter la petite proie qu'on ramène.
            if (etat.hookedFish && tenterAttaquePredateur()) {
                return;
            }
            // Le fil se rembobine UNIQUEMENT en tournant la manivelle : un tour
            // complet ramène REEL_PER_TURN unités (≈ 1 m). Si le joueur s'arrête,
            // la ligne reste exactement où elle est : il peut pêcher sur place,
            // puis reprendre la remontée (ou continuer jusqu'à la berge).
            const tours = consumeCrankTurns();
            const step = tours * REEL_PER_TURN;
            // Le poisson est ramené jusqu'aux pieds du pêcheur.
            const shoreX = angler.position.x;
            const shoreZ = angler.position.z - 2.5;
            const dx = shoreX - floatGroup.position.x;
            const dz = shoreZ - floatGroup.position.z;
            const distXZ = Math.hypot(dx, dz);
            if (distXZ > 1.0) {
                const move = Math.min(step, distXZ);
                floatGroup.position.x += (dx / distXZ) * move;
                floatGroup.position.z += (dz / distXZ) * move;
                floatGroup.position.y = 0.1 + Math.sin(time * 6) * 0.03;
                if (etat.hookedFish) {
                    etat.hookedFish.position.x = floatGroup.position.x;
                    etat.hookedFish.position.z = floatGroup.position.z;
                    etat.hookedFish.position.y = -0.3 - (etat.hookedFish.userData.topOffset || 0);
                    etat.hookedFish.rotation.y = Math.atan2(-dz, dx);
                }
            } else {
                if (etat.hookedFish) {
                    // Poisson amené au bord : on le garde en main, il faudra le
                    // lancer dans la bourriche pour le ranger.
                    startHoldingFish(etat.hookedFish);
                } else {
                    floatGroup.position.copy(floatIdle);
                    etat.floatState = 'idle';
                    fishButton.disabled = false;
                    endCast();
                    if (etat.revelerEscheVolee) { etat.revelerEscheVolee(); }   // mode Dur : esche volée découverte au bord
                }
            }
        }
        // La manivelle est disponible dès que la ligne est à l'eau (on peut ramener
        // la ligne et relancer quand on veut) et pendant le combat / la remontée.
        updateCrankVisibility();
    }

    function updateLine() {
        const start = rodTipVisual;
        const end = floatGroup.position;
        // La ligne pend, mais se raidit quand le fil est tendu.
        const sag = 0.8 * (1 - Math.min(1, Math.max(0, etat.tension)) * 0.65);
        for (let i = 0; i <= LINE_SEGMENTS; i++) {
            const t = i / LINE_SEGMENTS;
            const o = i * 3;
            linePositions[o] = start.x + (end.x - start.x) * t;
            linePositions[o + 1] = start.y + (end.y - start.y) * t - Math.sin(Math.PI * t) * sag;
            linePositions[o + 2] = start.z + (end.z - start.z) * t;
        }
        lineGeometry.attributes.position.needsUpdate = true;
    }

    return {
        hameconDansZone, updateFish, updateFloat, updateLine
    };
}
