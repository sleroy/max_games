// ---------------------------------------------------------------------------
// matriceTouche.js — LA MATRICE DE LA CHANCE DE TOUCHE : grille de situations, règles à respecter et
// points à surveiller. Module PUR, partagé par le test (tests/scenario-matrice-touche.mjs) et par la
// page de visualisation (matrice.html) : les deux lisent exactement les mêmes calculs.
//
//  - REGLES   : ce qui doit TOUJOURS être vrai (le test échoue sinon) ;
//  - SURVEILLER : déséquilibres possibles, à décider par un humain (affichés, jamais bloquants).
// Toutes les chances viennent de evaluerTouche (chanceTouche.js), la règle unique du jeu.
// ---------------------------------------------------------------------------
import { SPECIES, COMPORTEMENTS } from './especes.js?v=239';
import { ESCHES, SEUIL_FACILE, acceptationFacile, chanceMaximaleEsche, tropPetitPourEsche } from './esches.js?v=239';
import { evaluerTouche, RAISONS, ligneIdeale } from './chanceTouche.js?v=239';
import { MILIEUX, milieuParId, especesPresentes, tailleMaxEspece } from './milieux.js?v=239';

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

// Longueurs de ligne essayées pour trouver la profondeur idéale (pas de 0,25 unité, comme le réglage du jeu).
export const LIGNES_FINES = (function () { const l = []; for (let u = 0.5; u <= 7 + 1e-9; u += 0.25) { l.push(u); } return l; }());

/** Les trois tailles testées : minimum, milieu, maximum (cm). `cmMax` : le maximum du biotope (défaut : cm[1]). */
export function taillesDe(espece, cmMax) {
    const haut = cmMax === undefined ? espece.cm[1] : Math.round(cmMax);
    return [espece.cm[0], Math.round((espece.cm[0] + haut) / 2), haut];
}
export function nomEsche(id) {
    const e = ESCHES.find(function (x) { return x.id === id; });
    return e ? e.nom : 'Hameçon nu';
}

/**
 * Parcourt toute la grille et appelle rappel(contexte, résultat). Quiver : une seule ligne (posée au fond).
 * Options : `mode`, `temperatures`, et pour un biotope `especes` (espèces présentes) et `cmMax(espece)`.
 */
export function parcourir(rappel, options) {
    const o = options || {};
    (o.especes || SPECIES).forEach(function (e) {
        taillesDe(e, o.cmMax ? o.cmMax(e) : undefined).forEach(function (cm) {
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
    // Mode facile : la chance de touche est 1 ou 0, et vaut 1 si le PLAFOND de l'esche (toutes couches
    // d'hameçon, règle acceptationFacile) dépasse SEUIL_FACILE. Le tableau espèce × esche applique en
    // plus la couche d'eau de l'espèce : il est donc ≤ ce plafond (invariant vérifié ci-dessous).
    const res = calculerResume(15);
    const faciles = [];
    parcourir(function (ctx, r) {
        cas++;
        const fautif = r.possible !== (r.raison === null) || (r.possible && r.chance !== 1) || (!r.possible && r.chance !== 0);
        let divergent = false;
        if (r.raison !== 'accroche') {
            const cle = ctx.especeId + '/' + (ctx.esche || 'nu');
            // 1) le jeu doit suivre exactement acceptationFacile (raison « taille » comprise) ;
            divergent = r.possible !== (acceptationFacile(ctx.esche, ctx.especeId, ctx.longueurCm) === 1);
            // 2) plafond du jeu ≥ tableau espèce × esche. Non comparable pour un poisson trop petit
            //    (le tableau prend le maximum sur toutes les tailles) : règle unique tropPetitPourEsche.
            const max = res.parEsche[ctx.especeId + '|' + (ctx.esche || 'nu')].max;
            const plafond = chanceMaximaleEsche(ctx.esche, ctx.especeId, ctx.longueurCm);
            if (!tropPetitPourEsche(ctx.esche, ctx.longueurCm)) { divergent = divergent || max > plafond + 1e-9; }
            if (divergent && faciles.length < 5) {
                faciles.push(cle + ' (' + r.raison + ', tableau ' + max + ' / plafond ' + plafond + ')');
            }
        }
        if (fautif && faciles.length < 5) { faciles.push(ctx.especeId + '/' + ctx.esche + ' (' + r.raison + ')'); }
    }, { mode: 'facile', temperatures: [15] });
    regle('coherence', 'chaque cas est cohérent (chance nulle ⇔ une raison connue)', incoherents);
    regle('facile', 'mode facile : chance 1 ou 0, 100 % si le plafond de l’esche (toutes couches) dépasse 60 %, sinon ignorée (hameçon pris au fond à part)', faciles);
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

/**
 * Règles d'UN BIOTOPE (milieux.js) : les poissons y sont plus petits (taille maximale selon l'étang), donc
 * certaines esches (bouillette : 25 cm minimum, vif : 15 cm) peuvent devenir inutilisables. Pour chaque espèce
 * PRÉSENTE, avec ses tailles du biotope (minimum, milieu, cmMax) :
 *   - « pechable » : au moins une façon de la pêcher à ≥ 50 % (meilleur réglage, 15 °C, toutes esches) ;
 *   - « esche-viable » : au moins une esche (hors hameçon nu) lui est possible à sa taille maximale.
 * `perdues` liste (à titre indicatif) les esches inutilisables pour une espèce à sa taille maximale du biotope
 * (trop petite pour la bouillette ou le vif).
 * Renvoie { id, nom, ok, regles: [{ id, nom, ok, detail }], perdues: [{ espece, esche }], cas }.
 */
export function verifierReglesMilieu(milieuId) {
    const m = milieuParId(milieuId);
    const ids = especesPresentes(m);
    const especes = SPECIES.filter(function (e) { return ids.indexOf(e.id) >= 0; });
    const meilleur = {};
    const viables = {};
    const trop = {};
    let cas = 0;
    parcourir(function (ctx, r) {
        cas++;
        meilleur[ctx.especeId] = Math.max(meilleur[ctx.especeId] || 0, r.chance);
        const e = especes.find(function (x) { return x.id === ctx.especeId; });
        if (ctx.longueurCm === Math.round(tailleMaxEspece(e, m)) && ctx.esche) {
            const cle = ctx.especeId + '|' + ctx.esche;
            if (r.possible) { viables[cle] = true; }
            if (r.raison === 'taille') { trop[cle] = true; }
        }
    }, { especes: especes, cmMax: function (e) { return tailleMaxEspece(e, m); }, temperatures: [15] });
    const regles = [];
    function regle(id, nom, fautifs) {
        regles.push({ id: id, nom: nom, ok: fautifs.length === 0, detail: fautifs.join(', ') });
    }
    regle('pechable', 'chaque espèce présente se pêche à ≥ ' + SEUIL_PECHABLE * 100 + ' % au meilleur réglage (avec sa taille maximale du biotope)',
        especes.filter(function (e) { return (meilleur[e.id] || 0) < SEUIL_PECHABLE; }).map(function (e) { return e.id; }));
    regle('esche-viable', 'chaque espèce présente a au moins une esche utilisable à sa taille maximale',
        especes.filter(function (e) {
            return !ESCHES.some(function (x) { return viables[e.id + '|' + x.id]; });
        }).map(function (e) { return e.id; }));
    const perdues = [];
    especes.forEach(function (e) {
        ESCHES.forEach(function (x) { if (trop[e.id + '|' + x.id] && !viables[e.id + '|' + x.id]) { perdues.push({ espece: e.id, esche: x.id }); } });
    });
    return { id: m.id, nom: m.nom, ok: regles.every(function (r) { return r.ok; }), regles: regles, perdues: perdues, cas: cas };
}

/** Les règles de chaque biotope : [{ id, nom, ok, regles, perdues }]. */
export function verifierTousMilieux() {
    return MILIEUX.map(function (m) { return verifierReglesMilieu(m.id); });
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
    // Mode facile : une espèce sans aucune esche au-dessus du seuil (plafond du jeu) ne mord jamais en facile.
    SPECIES.forEach(function (e) {
        const plafonds = ESCHES.map(function (esche) { return chanceMaximaleEsche(esche.id, e.id, e.cm[1]); });
        const meilleur = Math.max.apply(null, plafonds);
        if (meilleur > SEUIL_FACILE + 1e-9) { return; }
        const i = plafonds.indexOf(meilleur);
        liste.push({ espece: e.id, esche: ESCHES[i].id, texte: e.nom + ' : en mode facile, aucune esche n’atteint 100 % (au mieux '
            + Math.round(meilleur * 100) + ' %, le seuil est de ' + Math.round(SEUIL_FACILE * 100) + ' %).' });
    });
    // Mode facile : le tableau espèce × esche applique la couche d'eau de l'espèce, le jeu non. Une esche
    // juste au-dessus du seuil « toutes couches » mais sous 60 % dans le tableau afficherait 100 % en jeu
    // et moins sur la page : à trancher par un humain, jamais bloquant.
    ESCHES.forEach(function (esche) {
        SPECIES.forEach(function (e) {
            const pe = res.parEsche[e.id + '|' + esche.id];
            const plafond = chanceMaximaleEsche(esche.id, e.id, e.cm[1]);
            if (pe && pe.max <= SEUIL_FACILE + 1e-9 && plafond > SEUIL_FACILE + 1e-9) {
                liste.push({ espece: e.id, esche: esche.id, texte: e.nom + ' : en mode facile, ' + esche.nom.toLowerCase()
                    + ' donne 100 % (plafond ' + Math.round(plafond * 100) + ' %), mais le tableau espèce × esche affiche '
                    + Math.round(pe.max * 100) + ' % (couche d’eau de l’espèce).' });
            }
        });
    });
    return liste;
}

/**
 * Conseils d'esche par espèce (bannière de l'avion, vie.js → avion.js) : les 2 meilleures esches
 * et la pire, d'après la matrice (même calcul que le test et la page matrice.html).
 * Renvoie [{ especeId, meilleures: [id, id], pire: id, pireJamais: booléen, texte }].
 */
export function conseilsEsches(resume, especesIds) {
    const res = resume || calculerResume(15);
    // `especesIds` (optionnel) : seulement les espèces du biotope (défaut : toutes).
    return SPECIES.filter(function (e) { return !especesIds || especesIds.indexOf(e.id) >= 0; }).map(function (e) {
        const classees = ESCHES.map(function (x) { return { id: x.id, max: res.parEsche[e.id + '|' + x.id].max }; })
            .sort(function (a, b) { return b.max - a.max; });
        const meilleures = classees.slice(0, 2).filter(function (c) { return c.max > 0; }).map(function (c) { return c.id; });
        const pire = classees[classees.length - 1];
        const icone = function (id) { return ESCHES.find(function (x) { return x.id === id; }).icone + ' ' + nomEsche(id); };
        const texte = e.nom + ' : préfère ' + meilleures.map(icone).join(', puis ')
            + ' — ' + (pire.max <= 0 ? 'jamais ' : 'rarement ') + icone(pire.id);
        // Profondeur idéale du meilleur choix : milieu du plateau où l'espèce mord (eau de 2,25 m, fond de vase),
        // ou « au fond » pour une espèce de fond (sa profondeur suit celle de l'étang).
        const comp = COMPORTEMENTS[e.id];
        let profondeur = 'Au fond';
        if (meilleures.length && !(comp && comp.couche === 'fond')) {
            const r = ligneIdeale(LIGNES_FINES, function (l) {
                return evaluerTouche({ especeId: e.id, longueurCm: e.cm[1], esche: meilleures[0], profondeurLigne: l,
                    profondeurEau: PORTEE_BORD, substrat: 'vase' }).chance;
            });
            profondeur = r.ligne === null ? '' : 'À ' + (Math.round(r.ligne / 2 * 10) / 10).toLocaleString('fr-FR') + ' m';
        }
        // Version courte sur 2 lignes (banderole de l'avion : lisible de loin, même par un enfant).
        const court = function (id) {
            const x = ESCHES.find(function (y) { return y.id === id; });
            return x.icone + ' ' + x.nom.split(' / ')[0].replace(' de terre', '');
        };
        const lignes = [e.nom + ' préfère ' + meilleures.map(court).join(' puis '),
            profondeur + ' · ' + (pire.max <= 0 ? 'jamais ' : 'rarement ') + court(pire.id)];
        return { especeId: e.id, meilleures: meilleures, pire: pire.id, pireJamais: pire.max <= 0, texte: texte, lignes: lignes,
            profondeur: profondeur };
    });
}
