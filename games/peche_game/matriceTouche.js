// ---------------------------------------------------------------------------
// matriceTouche.js — LA MATRICE DE LA CHANCE DE TOUCHE : grille de situations, règles à respecter et
// points à surveiller. Module PUR, partagé par le test (tests/scenario-matrice-touche.mjs) et par la
// page de visualisation (matrice.html) : les deux lisent exactement les mêmes calculs.
//
//  - REGLES   : ce qui doit TOUJOURS être vrai (le test échoue sinon) ;
//  - SURVEILLER : déséquilibres possibles, à décider par un humain (affichés, jamais bloquants).
// Toutes les chances viennent de evaluerTouche (chanceTouche.js), la règle unique du jeu.
// ---------------------------------------------------------------------------
import { SPECIES } from './especes.js?v=227';
import { ESCHES, SEUIL_FACILE, acceptationFacile } from './esches.js?v=227';
import { evaluerTouche, RAISONS } from './chanceTouche.js?v=227';

export const SUBSTRATS_MATRICE = ['sable', 'gravier', 'vase', 'roche', 'herbier'];
export const EAUX = [1.5, 3, 4.5, 6, 8];              // profondeur d'eau (unités : 2 = 1 m), bord → fosse
export const LIGNES = [0.75, 1.5, 2.5, 3.5, 5, 7];    // longueur de ligne (unités)
export const TEMPERATURES = [5, 15, 24];              // hiver, eau brassée, été (thermocline)
export const ESCHES_MATRICE = ESCHES.map(function (e) { return e.id; }).concat([null]);   // null = hameçon nu
export const ESPECES_DE_FOSSE = ['silure', 'anguille', 'sandre'];
export const PORTEE_BORD = 4.5;                       // ≈ eau au plus loin d'un lancer du bord (2,2 m)
export const SEUIL_PECHABLE = 0.5;                    // une espèce doit atteindre au moins cette chance
export const SEUIL_BORD = 0.3;                        // … et celle-ci depuis le bord (hors fosses)
export const SEUIL_ESCHE_REINE = 0.7;                 // en dessous : aucune esche n'est vraiment faite pour elle

export function taillesDe(espece) {
    return [espece.cm[0], Math.round((espece.cm[0] + espece.cm[1]) / 2), espece.cm[1]];
}
export function nomEsche(id) {
    const e = ESCHES.find(function (x) { return x.id === id; });
    return e ? e.nom : 'Hameçon nu';
}

/** Parcourt toute la grille et appelle rappel(contexte, résultat). Quiver : une seule ligne (posée au fond). */
export function parcourir(rappel, options) {
    const o = options || {};
    SPECIES.forEach(function (e) {
        taillesDe(e).forEach(function (cm) {
            ESCHES_MATRICE.forEach(function (esche) {
                EAUX.forEach(function (eau) {
                    SUBSTRATS_MATRICE.forEach(function (substrat) {
                        (o.temperatures || TEMPERATURES).forEach(function (temperature) {
                            const base = { especeId: e.id, longueurCm: cm, esche: esche, profondeurEau: eau,
                                substrat: substrat, temperature: temperature, mode: o.mode };
                            LIGNES.forEach(function (ligne) {
                                const ctx = Object.assign({ profondeurLigne: ligne }, base);
                                rappel(ctx, evaluerTouche(ctx));
                            });
                            const q = Object.assign({ quiver: true, profondeurLigne: 0 }, base);
                            rappel(q, evaluerTouche(q));
                        });
                    });
                });
            });
        });
    });
}

/** Résumé à 15 °C : meilleure chance par espèce, par espèce × esche, et depuis le bord. */
export function calculerResume(temperature) {
    const t = temperature === undefined ? 15 : temperature;
    const meilleur = {};
    const parEsche = {};
    const duBord = {};
    let cas = 0;
    parcourir(function (ctx, r) {
        cas++;
        const cle = ctx.especeId + '|' + (ctx.esche || 'nu');
        const pe = parEsche[cle] || (parEsche[cle] = { max: 0, possibles: 0, total: 0, ctx: null, raisons: {} });
        pe.total++;
        if (r.possible) { pe.possibles++; } else { pe.raisons[r.raison] = (pe.raisons[r.raison] || 0) + 1; }
        if (r.chance > pe.max) { pe.max = r.chance; pe.ctx = ctx; }
        const m = meilleur[ctx.especeId];
        if (!m || r.chance > m.chance) { meilleur[ctx.especeId] = { chance: r.chance, ctx: ctx }; }
        if (ctx.profondeurEau <= PORTEE_BORD) { duBord[ctx.especeId] = Math.max(duBord[ctx.especeId] || 0, r.chance); }
    }, { temperatures: [t] });
    return { meilleur: meilleur, parEsche: parEsche, duBord: duBord, cas: cas };
}

/** Les règles qui doivent TOUJOURS tenir : [{ id, nom, ok, detail }]. */
export function verifierRegles() {
    const regles = [];
    function regle(id, nom, fautifs) {
        regles.push({ id: id, nom: nom, ok: fautifs.length === 0, detail: fautifs.join(', ') });
    }
    // Toute la grille, toutes températures, mode normal puis facile.
    const incoherents = [];
    const tailleHors = [];
    let cas = 0;
    parcourir(function (ctx, r) {
        cas++;
        if (r.possible !== (r.raison === null) || (r.possible && !(r.chance > 0 && r.chance <= 1))
            || (!r.possible && r.chance !== 0) || (r.raison && !RAISONS[r.raison])) {
            if (incoherents.length < 5) { incoherents.push(ctx.especeId + '/' + ctx.esche); }
        }
        if (r.raison === 'taille' && ['bouillette', 'vif'].indexOf(ctx.esche) < 0 && tailleHors.length < 5) {
            tailleHors.push(ctx.especeId + '/' + ctx.esche);
        }
    });
    // Mode facile : chance 1 ou 0, 100 % si la meilleure chance de l'esche (mode normal, 15 °C) dépasse 60 %.
    const res = calculerResume(15);
    const faciles = [];
    parcourir(function (ctx, r) {
        cas++;
        const fautif = r.possible !== (r.raison === null) || (r.possible && r.chance !== 1) || (!r.possible && r.chance !== 0);
        let divergent = false;
        if (r.raison !== 'accroche') {
            const esche = ESCHES.find(function (x) { return x.id === ctx.esche; });
            const petit = esche && esche.tailleMin && ctx.longueurCm < esche.tailleMin;
            const max = res.parEsche[ctx.especeId + '|' + (ctx.esche || 'nu')].max;
            const attendu = !petit && max > SEUIL_FACILE + 1e-9;
            divergent = r.possible !== (acceptationFacile(ctx.esche, ctx.especeId, ctx.longueurCm) === 1) || r.possible !== attendu;
        }
        if ((fautif || divergent) && faciles.length < 5) { faciles.push(ctx.especeId + '/' + ctx.esche); }
    }, { mode: 'facile', temperatures: [15] });
    regle('coherence', 'chaque cas est cohérent (chance nulle ⇔ une raison connue)', incoherents);
    regle('facile', 'mode facile : chance 1 ou 0, 100 % si la meilleure chance de l’esche dépasse 60 %, sinon ignorée (hameçon pris au fond à part)', faciles);
    regle('taille', '« trop petit » n’arrive qu’avec la bouillette ou le vif', tailleHors);

    regle('pechable', 'chaque espèce a au moins une vraie façon d’être pêchée (chance ≥ ' + SEUIL_PECHABLE * 100 + ' %)',
        SPECIES.filter(function (e) { return !res.meilleur[e.id] || res.meilleur[e.id].chance < SEUIL_PECHABLE; })
            .map(function (e) { return e.id; }));
    regle('nu', 'l’hameçon nu fait toujours moins bien que la meilleure esche',
        SPECIES.filter(function (e) { return res.parEsche[e.id + '|nu'].max >= res.meilleur[e.id].chance; })
            .map(function (e) { return e.id; }));
    regle('esche-utile', 'chaque esche est la meilleure pour au moins une espèce',
        ESCHES.filter(function (esche) {
            return !SPECIES.some(function (e) { return res.parEsche[e.id + '|' + esche.id].max >= res.meilleur[e.id].chance - 1e-9; });
        }).map(function (e) { return e.id; }));
    regle('fosse', 'les poissons de fosse se pêchent en eau profonde',
        ESPECES_DE_FOSSE.filter(function (id) { return !res.meilleur[id] || res.meilleur[id].chance < SEUIL_PECHABLE; }));
    regle('bord', 'hors fosses, chaque espèce se pêche aussi depuis le bord (eau ≤ 2,25 m, chance ≥ ' + SEUIL_BORD * 100 + ' %)',
        SPECIES.filter(function (e) { return ESPECES_DE_FOSSE.indexOf(e.id) < 0 && (res.duBord[e.id] || 0) < SEUIL_BORD; })
            .map(function (e) { return e.id; }));

    // Délai : heure × pression × tendance × température × espèce, toujours borné.
    const horsBornes = [];
    [0, 3, 6, 9, 12, 15, 18, 21].forEach(function (heure) {
        [[1022, 1], [1013, 0], [998, -1]].forEach(function (p) {
            TEMPERATURES.concat([28]).forEach(function (temperature) {
                SPECIES.forEach(function (e) {
                    cas++;
                    const r = evaluerTouche({ especeId: e.id, longueurCm: e.cm[1], esche: 'ver', profondeurEau: 4, profondeurLigne: 2,
                        substrat: 'sable', heure: heure, pression: p[0], tendance: p[1], temperature: temperature });
                    if (!(r.facteurDelai >= 0.5 && r.facteurDelai <= 3.5) && horsBornes.length < 5) { horsBornes.push(e.id + ' ' + heure + ' h'); }
                });
            });
        });
    });
    regle('delai', 'délai de touche toujours borné (× 0,5 à × 3,5)', horsBornes);
    const neutre = evaluerTouche({ especeId: 'gardon', longueurCm: 20, esche: 'ver', profondeurEau: 4, profondeurLigne: 2, substrat: 'sable' });
    regle('neutre', 'midi, 1013 hPa stable, 15 °C : délai neutre (× 1)',
        Math.abs(neutre.facteurDelai - 1) < 1e-3 ? [] : ['× ' + neutre.facteurDelai.toFixed(3)]);
    return { regles: regles, cas: cas, resume: res };
}

/** Déséquilibres à SURVEILLER (décision humaine, jamais bloquants) : [{ espece, esche, texte }]. */
export function aSurveiller(resume) {
    const res = resume || calculerResume(15);
    const liste = [];
    SPECIES.forEach(function (e) {
        const m = res.meilleur[e.id];
        if (m && m.chance < SEUIL_ESCHE_REINE) {
            liste.push({ espece: e.id, esche: m.ctx.esche, texte: e.nom + ' : aucune esche n’est vraiment faite pour cette espèce (au mieux '
                + Math.round(m.chance * 100) + ' % avec ' + nomEsche(m.ctx.esche).toLowerCase() + ').' });
        }
    });
    // Esche « reine » (poids 1) bridée : elle ne donne jamais plus de 90 % pour cette espèce.
    ESCHES.forEach(function (esche) {
        Object.keys(esche.cibles).forEach(function (id) {
            if (esche.cibles[id] < 1) { return; }
            const pe = res.parEsche[id + '|' + esche.id];
            if (pe && pe.max < 0.9) {
                const nom = (SPECIES.find(function (s) { return s.id === id; }) || { nom: id }).nom;
                liste.push({ espece: id, esche: esche.id, texte: nom + ' : ' + esche.nom.toLowerCase() + ' est son esche, mais elle ne dépasse jamais '
                    + Math.round(pe.max * 100) + ' % (couche d’eau ou fond qui la freinent).' });
            }
        });
    });
    // Mode facile : une espèce sans aucune esche à 100 % (meilleure chance ≤ 60 %) ne mord jamais en facile.
    SPECIES.forEach(function (e) {
        const aucune = ESCHES.every(function (esche) {
            const pe = res.parEsche[e.id + '|' + esche.id];
            return !pe || pe.max <= SEUIL_FACILE + 1e-9;
        });
        if (aucune) {
            const m = res.meilleur[e.id];
            liste.push({ espece: e.id, esche: m ? m.ctx.esche : null, texte: e.nom + ' : en mode facile, aucune esche n’atteint 100 % (au mieux '
                + Math.round((m ? m.chance : 0) * 100) + ' %, le seuil est de ' + Math.round(SEUIL_FACILE * 100) + ' %).' });
        }
    });
    return liste;
}
