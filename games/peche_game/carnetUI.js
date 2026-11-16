// ---------------------------------------------------------------------------
// carnetUI.js — ONGLETS DU CARNET (Prises / Boutique / Touches / Options) et carte de l'étang. Extrait de script.js (v149).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=212';

export function creerCarnetUI(deps) {
    const {
        tabPages, journalTabs, pondMap, POND_RADIUS, POND_CENTER, cheminContourEtang, FOND_BORD,
        FOND_CENTRE, FOSSES, PROFONDEUR_MAX, RAYON_CADRE_CARTE, lilyPads, BOURRICHE_POS, angler, floatGroup, SPECIES,
        profondeurLocale, substrats
    } = deps;

    // Les zones de fond (§14.3) viennent de la MÊME grille que la texture du fond et que
    // l'habitat des poissons (substrats.js). Un seul tracé par substrat, calculé une fois
    // (la grille ne change jamais) : des rectangles de la grille, en coordonnées de la carte.
    let tracesFonds = null;
    function tracerFonds(mx, mz, ech) {
        if (tracesFonds) { return tracesFonds; }
        const chemins = {};
        substrats.rectsCarte().forEach(function (r) {
            chemins[r.substrat] = (chemins[r.substrat] || '') + 'M' + mx(r.x).toFixed(1) + ' ' + mz(r.z).toFixed(1)
                + 'h' + (r.w * ech).toFixed(2) + 'v' + (r.h * ech).toFixed(2) + 'h-' + (r.w * ech).toFixed(2) + 'z';
        });
        tracesFonds = chemins;
        return chemins;
    }

    // ---------------------------------------------------------------------------
    // Onglets du carnet : Prises / Boutique / Touches / Options
    // ---------------------------------------------------------------------------
    function montrerOnglet(nom) {
        Object.keys(tabPages).forEach(function (cle) {
            const page = tabPages[cle];
            if (page) {
                page.classList.toggle('active', cle === nom);
                // Masquage infaillible : on force le style en ligne (indépendant du CSS).
                page.style.display = (cle === nom) ? '' : 'none';
                if (cle === nom) {
                    page.scrollTop = 0;   // on ouvre l'onglet en haut
                }
            }
        });
        // L'onglet cliqué est mis en avant (comme un onglet d'inventaire).
        if (journalTabs && journalTabs.querySelectorAll) {
            journalTabs.querySelectorAll('.tab').forEach(function (bouton) {
                bouton.classList.toggle('active', bouton.dataset.tab === nom);
            });
        }
    }

    if (journalTabs) {
        journalTabs.addEventListener('click', function (event) {
            const cible = event.target;
            if (cible && cible.dataset && cible.dataset.tab) {
                montrerOnglet(cible.dataset.tab);
            }
        });
    }

    // ---------------------------------------------------------------------------
    // Carte de l'étang : dessinée d'après le VRAI étang (mêmes positions que la
    // scène 3D : bord, fosses, nénuphars, pêcheur, bourriche et bouchon).
    // ---------------------------------------------------------------------------

    function rendreCarteEtang() {
        if (!pondMap) {
            return;
        }
        const R = POND_RADIUS;
        const cx = 100;
        const cy = 60;
        // Échelle : le cadre (demi-hauteur 58 px) contient le plus grand rayon du
        // contour + la couronne de placement (RAYON_CADRE_CARTE), donc le pêcheur
        // et la bourriche ne sortent jamais de la carte, même à l'extrémité des lobes.
        const ech = 58 / RAYON_CADRE_CARTE;     // unités du monde → pixels du plan
        const mx = function (x) { return cx + (x - POND_CENTER.x) * ech; };
        const mz = function (z) { return cy + (z - POND_CENTER.z) * ech; };
        // Chemin SVG du contour GÉNÉRÉ (facteur 1 = bord de l'eau, < 1 = isobathe).
        const cheminContour = function (facteur) {
            return cheminContourEtang(cx, cy, ech, facteur, 0);
        };
        let svg = '<svg viewBox="0 0 200 120" role="img" aria-label="Carte de l’étang">';
        svg += '<rect x="0" y="0" width="200" height="120" rx="10" fill="#2f6b3f"/>';
        // L'eau : des BANDES DE PROFONDEUR calculées avec le VRAI relief (plus c'est
        // foncé, plus c'est profond) — la carte sert vraiment à choisir où lancer.
        const TEINTES = ['#74c6e0', '#5cb4d2', '#48a2c4', '#3790b3', '#2b7ea1', '#216b8e', '#18597a', '#124a67'];
        // L'eau : le VRAI contour généré (aucun cercle imposé), rempli de la teinte
        // de surface. Les bandes de profondeur et les isobathes suivent ce contour.
        svg += '<path class="contour-etang" d="' + cheminContour(1)
            + '" fill="' + TEINTES[0] + '" stroke="#eaf6ff" stroke-width="0.8" opacity="0.95"/>';
        for (let i = 1; i < TEINTES.length; i++) {
            const prof = FOND_BORD + (i / TEINTES.length) * (FOND_CENTRE - FOND_BORD);
            const frac = (prof - FOND_BORD) / (FOND_CENTRE - FOND_BORD);
            if (frac <= 0.02 || frac >= 0.99) {
                continue;
            }
            svg += '<path d="' + cheminContour(Math.sqrt(1 - frac))
                + '" fill="' + TEINTES[i] + '"/>';
        }
        // FONDS (§14.3) : sable, gravier, vase, roche, herbier, découpés dans le contour de
        // l'eau. Semi-transparents : on lit toujours la profondeur dessous.
        const fonds = tracerFonds(mx, mz, ech);
        svg += '<clipPath id="clip-fonds"><path d="' + cheminContour(1) + '"/></clipPath><g clip-path="url(#clip-fonds)" opacity="0.72">';
        substrats.SUBSTRATS.forEach(function (sub) {
            svg += '<path class="fond-' + sub.id + '" d="' + (fonds[sub.id] || '') + '" fill="' + sub.couleur + '"/>';
        });
        svg += '</g>';
        // ISOBATHES : les courbes de 1 m et 2 m (le 3 m n'existe que dans les fosses,
        // annotées juste après), avec leur valeur écrite.
        [2, 4].forEach(function (unites) {
            const frac = (unites - FOND_BORD) / (FOND_CENTRE - FOND_BORD);
            if (frac <= 0.02 || frac >= 0.99) {
                return;
            }
            const rr = R * Math.sqrt(1 - frac) * ech;
            svg += '<path d="' + cheminContour(Math.sqrt(1 - frac))
                + '" fill="none" stroke="#eaf6ff" stroke-width="0.7" stroke-dasharray="2.5 1.5" opacity="0.9"/>';
            svg += '<text x="' + (cx + rr * 0.7).toFixed(1) + '" y="' + (cy - rr * 0.7 + 2).toFixed(1)
                + '" font-size="6.4" font-weight="bold" fill="#ffffff" stroke="#0d3348" stroke-width="0.5">'
                + (unites / 2) + ' m</text>';
        });
        // Les FOSSES : les points les plus profonds de l'étang (profondeur RÉELLE).
        FOSSES.forEach(function (fosse) {
            svg += '<circle cx="' + mx(fosse.x).toFixed(1) + '" cy="' + mz(fosse.z).toFixed(1)
                + '" r="' + (fosse.rayon * ech).toFixed(1)
                + '" fill="rgba(6, 34, 52, 0.42)" stroke="#bfe6f5" stroke-width="0.5" stroke-dasharray="1.5 1.5"/>';
            svg += '<text x="' + mx(fosse.x).toFixed(1) + '" y="' + (mz(fosse.z) + 2).toFixed(1)
                + '" text-anchor="middle" font-size="4.8" fill="#ffffff">fosse '
                + (profondeurLocale(fosse.x, fosse.z) / 2).toFixed(1).replace('.', ',') + ' m</text>';
        });
        // Les nénuphars, aux VRAIES positions (aléatoires à chaque partie).
        lilyPads.forEach(function (pad) {
            svg += '<circle cx="' + mx(pad.x).toFixed(1) + '" cy="' + mz(pad.z).toFixed(1)
                + '" r="' + Math.max(1.4, pad.radius * ech).toFixed(1) + '" fill="#3f7d4a"/>';
        });
        // La bourriche (jaune) et le pêcheur (blanc), eux aussi à leur vraie place.
        svg += '<circle cx="' + mx(BOURRICHE_POS.x).toFixed(1) + '" cy="' + mz(BOURRICHE_POS.z).toFixed(1)
            + '" r="2.4" fill="#c9a227"/>';
        svg += '<circle cx="' + mx(angler.position.x).toFixed(1) + '" cy="' + mz(angler.position.z).toFixed(1)
            + '" r="3.2" fill="#f2f2f2" stroke="#222222" stroke-width="0.8"/>';
        // Le bouchon, s'il est à l'eau.
        if (etat.floatState !== 'idle') {
            svg += '<circle cx="' + mx(floatGroup.position.x).toFixed(1) + '" cy="'
                + mz(floatGroup.position.z).toFixed(1) + '" r="1.8" fill="#ff5a3c"/>';
        }
        svg += '</svg>';
        // Légende : les espèces de chaque zone, d'après leurs profondeurs RÉELLES.
        // Échelle de profondeur, en clair (c'est ce qui aide à choisir son poste).
        const profMax = PROFONDEUR_MAX;
        let legende = '<div class="map-profondeur">Profondeur : <b>'
            + (FOND_BORD / 2).toFixed(1).replace('.', ',') + ' m</b> au bord → <b>'
            + (FOND_CENTRE / 2).toFixed(1).replace('.', ',') + ' m</b> au centre → <b>'
            + (profMax / 2).toFixed(1).replace('.', ',') + ' m</b> dans les fosses — plus c’est foncé, plus c’est profond.</div>';
        // §15.1 : saison, température et thermocline (le même texte que le widget de profondeur).
        legende += '<div class="map-profondeur" id="carnetEau">' + etat.texteEau() + '</div>';
        legende += '<div class="map-legende">';
        etat.ZONES_CARTE.forEach(function (zone) {
            const noms = SPECIES.filter(function (s) {
                const p = s.profondeur || [-3.4, -0.9];
                const mid = (p[0] + p[1]) / 2;
                return mid >= zone.min && mid < zone.max;
            }).sort(function (a, b) { return b.abondance - a.abondance; })
                .slice(0, 4).map(function (s) { return s.nom; });
            legende += '<div class="map-zone"><span class="map-pastille" style="background:'
                + zone.couleur + '"></span>' + zone.nom + ' : ' + (noms.join(', ') || '—') + '</div>';
        });
        legende += '</div>';
        // Légende des FONDS : couleur, part de l'étang, espèces qui y vivent (COMPORTEMENTS).
        legende += '<div class="map-profondeur">Fonds : chaque poisson vit sur le sien.</div><div class="map-legende map-fonds">';
        substrats.SUBSTRATS.forEach(function (sub) {
            const noms = substrats.especesDe(sub.id).map(function (id) {
                const espece = SPECIES.find(function (s) { return s.id === id; });
                return espece ? espece.nom : id;
            });
            legende += '<div class="map-zone"><span class="map-pastille map-pastille-fond" style="background:' + sub.couleur
                + '"></span><b>' + sub.nom + '</b> (' + Math.round(substrats.parts[sub.id] * 100) + ' %) : '
                + (noms.join(', ') || '—') + '</div>';
        });
        legende += '</div>';
        // Profondeur à l'endroit du bouchon (et profondeur de l'hameçon).
        if (etat.floatState !== 'idle') {
            const profLocale = profondeurLocale(floatGroup.position.x, floatGroup.position.z);
            legende += '<div class="map-zone">🌊 Ici : ' + (profLocale / 2).toFixed(1).replace('.', ',')
                + ' m d’eau · hameçon à ' + (etat.profondeurLigne / 2).toFixed(1).replace('.', ',') + ' m'
                + ' · fond : ' + substrats.SUBSTRATS.find(function (f) {
                    return f.id === (substrats.substratEn(floatGroup.position.x, floatGroup.position.z) || 'vase');
                }).nom.toLowerCase()
                + (etat.hameconDansLaVase ? ' — <b>accroché au fond !</b>' : '') + '</div>';
        }
        pondMap.innerHTML = svg + legende;
    }

    return {
        montrerOnglet, rendreCarteEtang
    };
}
