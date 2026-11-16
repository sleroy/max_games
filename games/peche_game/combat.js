// ---------------------------------------------------------------------------
// combat.js — L'ÉPREUVE DE FORCE : tension du fil, fatigue du poisson, ferrage,
// touche vue de près et gestion de l'accrochage. Extrait de script.js (v145).
//
// L'état partagé passe par etat.js (accesseurs vers les `let` de script.js) ;
// le reste est injecté par `deps`. Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { etat } from './etat.js?v=145';

export function creerCombat(deps) {
    const {
        struggleMarker, REEL_PER_TURN, struggleTimer, catchMessage, fmtPoids, sound,
        BOURRICHE_POS, statusDisplay, castTarget, STRUGGLE_MIN_FACTOR, STRUGGLE_SPAN,
        POND_CENTER, rayonEtang, capaciteBouchon, styleEspece, floatGroup, STRUGGLE_MAX_FACTOR,
        filEquipe, setDragLoosened, strugglePanel, struggleInfo, struggleHint, strugglePortrait,
        SPECIES, dessinerPortrait, fishButton, PROIES_CARNASSIERS, PREDATOR_ATTACK_RADIUS,
        fishes, CARNASSIERS, PREDATOR_ATTACK_ADVANTAGE, flotteurCourant, rand, TOUCHES_PAR_ID,
        choisirTouche, biteOrigine, rodTipVisual, setFloatOpacity, modeQuiver, punishFish,
        dureeTouche, appliquerMouvement, mouvementDeTouche, BITE_VIEW_LINGER, majIndiceSnag,
        fermerPanneauCombat, consumeCrankTurns, vitesseMaxTours, kidCue
    } = deps;

    // ---------------------------------------------------------------------------
    // Épreuve de force (tug-of-war)
    // ---------------------------------------------------------------------------
    function updateStruggleBar() {
        struggleMarker.style.left = (etat.tension * 100) + '%';
    }

    function updateStruggleTimer() {
        // Affiche le temps restant et le nombre de tours de manivelle encore
        // nécessaires : comme un tour ramène REEL_PER_TURN unités, ce nombre est
        // directement proportionnel à la longueur de fil qu'il reste à ramener.
        let text = '⏱ ' + etat.struggleTimeLeft.toFixed(1).replace('.', ',') + ' s';
        if (etat.struggle) {
            const turns = Math.max(0, (etat.struggle.lineLength - etat.struggle.minLength) / REEL_PER_TURN);
            text += ' · encore ~' + Math.ceil(turns) + ' tour' + (turns >= 1.5 ? 's' : '') + ' de manivelle';
        }
        struggleTimer.textContent = text;
        if (etat.struggleTimeLeft <= 1) {
            struggleTimer.classList.add('urgent');
        } else {
            struggleTimer.classList.remove('urgent');
        }
    }


    function showCatchMessage(weight, espece, record, horsNorme) {
        catchMessage.textContent = (etat.modeFacile ? '🎉 BRAVO ! ' : '')
            + (horsNorme ? '✨ HORS NORME — ' : '')
            + (record ? '🏆 RECORD — ' : '')
            + (espece ? espece + ' ! ' : 'Poisson attrapé ! ') + fmtPoids(weight) + ' 🎣';
        catchMessage.classList.toggle('record', !!record);
        catchMessage.classList.toggle('rare', !!horsNorme);
        catchMessage.classList.add('show');
        if (etat.catchMessageTimer) {
            clearTimeout(etat.catchMessageTimer);
        }
        etat.catchMessageTimer = setTimeout(function () {
            catchMessage.classList.remove('show');
        }, 2500);
    }

    // Dernier record battu (affiché à l'écran, exposé aux tests).

    // Annonce un NOUVEAU RECORD pour une espèce : message doré + statut détaillé.
    function annoncerRecord(weight, espece, ancienRecord, horsNorme) {
        sound.playCloche();
        const nom = espece || 'Poisson';
        etat.recordBattu = {
            espece: nom,
            kg: Math.round(weight * 100) / 100,
            ancien: Math.round((ancienRecord || 0) * 100) / 100
        };
        catchMessage.textContent = (horsNorme ? '✨ HORS NORME — ' : '')
            + '🏆 RECORD — ' + nom + ' ! ' + fmtPoids(weight) + ' 🎣';
        catchMessage.classList.add('record', 'show');
        catchMessage.classList.toggle('rare', !!horsNorme);
        etat.spawnFloatingText('🏆 RECORD !', BOURRICHE_POS, '#ffd166');
        if (horsNorme) {
            etat.spawnFloatingText('✨ HORS NORME !', BOURRICHE_POS, '#ffd166');
        }
        statusDisplay.textContent = '🏆 NOUVEAU RECORD de ' + nom + ' : ' + fmtPoids(weight)
            + (horsNorme ? ' — spécimen HORS NORME !' : '')
            + (ancienRecord > 0 ? ' (ancien record : ' + fmtPoids(ancienRecord) + ')' : '') + ' !';
    }

    const struggleDir = new THREE.Vector3();

    // Longueur de fil « de référence » du combat : la distance au sol entre le
    // bout de la canne et le point de lancer.
    function struggleBaseLength() {
        return Math.hypot(castTarget.x - etat.struggleAnchor.x, castTarget.z - etat.struggleAnchor.z);
    }

    // Convertit une longueur de fil sortie en tension affichée sur la barre.
    function lineLengthToTension(length) {
        if (!etat.struggle || etat.struggle.baseLength < 0.001) {
            return 0.5;
        }
        return (length / etat.struggle.baseLength - STRUGGLE_MIN_FACTOR) / STRUGGLE_SPAN;
    }

    // Position du poisson le long de la ligne, d'après la longueur de fil sortie :
    // il « recule » quand il tire (du fil sort) et se rapproche du pêcheur quand
    // le joueur tourne la manivelle.
    function computeStrugglePos() {
        if (!etat.struggle) {
            return;
        }
        struggleDir.set(castTarget.x - etat.struggleAnchor.x, 0, castTarget.z - etat.struggleAnchor.z);
        const baseDist = struggleDir.length();
        if (baseDist < 0.001) {
            etat.strugglePos.set(castTarget.x, 0.1, castTarget.z);
            return;
        }
        struggleDir.normalize();
        const dist = etat.struggle.lineLength;
        let x = etat.struggleAnchor.x + struggleDir.x * dist;
        let z = etat.struggleAnchor.z + struggleDir.z * dist;
        // Écart latéral des tirades : le poisson (et le bouchon) partent de côté.
        const lat = etat.struggle.lateral || 0;
        if (lat) {
            x += -struggleDir.z * lat;
            z += struggleDir.x * lat;
        }
        const dx = x - POND_CENTER.x;
        const dz = z - POND_CENTER.z;
        const d = Math.hypot(dx, dz);
        const maxR = rayonEtang(Math.atan2(dz, dx)) - 3;
        if (d > maxR) {
            x = POND_CENTER.x + (dx / d) * maxR;
            z = POND_CENTER.z + (dz / d) * maxR;
        }
        etat.strugglePos.set(x, 0.1, z);
    }

    function startStruggle(fish, facteurAvantage) {
        // `facteurAvantage` vient du ferrage : < 1 = avantage au joueur (le poisson
        // est proche), > 1 = avantage au poisson (il faut ramener plus de fil).
        const cap = capaciteBouchon();
        // L'avantage laissé au poisson peut être réduit par le bouchon équipé.
        const avantage = ((typeof facteurAvantage === 'number') ? facteurAvantage : 1) * cap.avantage;
        // Instantané du ferrage : le combat fait ensuite évoluer cet avantage.
        etat.avantageFerrage = avantage;
        const size = fish.userData.size;
        const power = fish.userData.power;
        const aggression = fish.userData.aggression;
        // Chaque espèce se bat à SA façon (traction, tirades, endurance, écarts).
        const style = styleEspece(fish.userData.especeId);
        // Une ligne profonde met le poisson dans son élément : il se défend un peu
        // mieux (à choisir : les poissons du fond… ou un combat plus facile).
        const bonusProfondeur = 1 + 0.05 * Math.max(0, etat.profondeurLigne - 2.5);
        // Plus la difficulté est haute, plus les coups brusques sont rapprochés.
        const interval = Math.max(0.6,
            (1.4 - size * 0.25) / aggression / etat.DIFFICULTY * style.intervalle);
        // Longueur de fil de référence : la distance du lancer.
        const baseLength = Math.max(4, struggleBaseLength());
        // Fil déjà rentré pendant la remontée (touche en cours de récupération) :
        // le combat démarre avec ce qu'il reste dehors, sans téléporter le poisson.
        const floatDist = Math.hypot(
            floatGroup.position.x - etat.struggleAnchor.x,
            floatGroup.position.z - etat.struggleAnchor.z
        );
        const startLength = Math.min(baseLength, Math.max(baseLength * 0.5, floatDist)) * avantage;
        etat.struggle = {
            baseLength: baseLength,
            lineLength: startLength,
            minLength: baseLength * STRUGGLE_MIN_FACTOR,
            maxLength: baseLength * (1 + (STRUGGLE_MAX_FACTOR - 1) * filEquipe().resistance),
            // Le poisson se DÉFEND, même petit : on ne le ramène pas « à la vitesse
            // du moulinet ». Il tire sur la ligne en continu, et donne des coups
            // brusques (une petite ablette secoue le bouchon aussi fort qu'une carpe !).
            // `power` = combativité de l'espèce, `aggression` = son ardeur.
            pullSpeed: Math.min(3.8, Math.max(0.7,
                (0.9 + size * 0.9) * power * (0.8 + aggression * 0.3) * etat.DIFFICULTY * style.traction * bonusProfondeur)),
            burstDistance: (0.35 + size * 0.45) * power * (0.8 + aggression * 0.3) * etat.DIFFICULTY * style.coups,
            burstInterval: interval,
            burstTimer: interval,
            // Le poisson se fatigue : ses tirades faiblissent peu à peu (sinon les
            // très gros poissons seraient impossibles à sortir). L'endurance dépend
            // de l'espèce : une carpe tient 14 s, un brochet est cuit en 5 s.
            endurance: style.endurance,
            // Écart latéral des tirades (les fonceurs partent de côté).
            derive: style.derive,
            lateral: 0,
            styleNom: style.nom,
            elapsed: 0,
            fatigueShown: false
        };
        etat.tension = Math.max(0, Math.min(1, lineLengthToTension(etat.struggle.lineLength)));
        // Temps limite : il faut VRAIMENT ramener le poisson (et le chrono se
        // resserre quand la difficulté monte ou quand on a ferré trop tard).
        etat.struggleTimeLeft = Math.min(20, Math.max(6, (baseLength * 0.65) / etat.DIFFICULTY)) * (2 - avantage) * cap.temps;
        updateStruggleTimer();
        computeStrugglePos();
        floatGroup.position.copy(etat.strugglePos);
        etat.fishCaught = true;
        etat.escaped = false;
        etat.hookedFish = fish;
        fish.userData.hooked = true;
        fish.userData.biting = false;
        etat.floatState = 'struggle';
        setDragLoosened(false);
        strugglePanel.classList.add('active');
        strugglePanel.classList.remove('snagging');
        // Panneau volontairement COURT : le portrait (fond transparent) montre
        // déjà quel poisson se bat — nom et poids suffisent (fmtPoids ajoute
        // déjà l'unité « kg », ne pas la doubler).
        struggleInfo.textContent = (fish.userData.espece || 'Poisson') + ' · '
            + fmtPoids(fish.userData.weight);
        struggleHint.hidden = true;
        let portraitEspece = null;
        if (strugglePortrait) {
            for (let i = 0; i < SPECIES.length; i++) {
                if (SPECIES[i].id === fish.userData.especeId) {
                    portraitEspece = SPECIES[i];
                }
            }
            strugglePortrait.hidden = !portraitEspece;
            if (portraitEspece) {
                dessinerPortrait(strugglePortrait.getContext('2d'), portraitEspece,
                    strugglePortrait.width, strugglePortrait.height);
            }
        }
        etat.portraitEspeceCourante = portraitEspece ? portraitEspece.id : null;
        updateStruggleBar();
        fishButton.disabled = true;
        fishButton.hidden = true;
        statusDisplay.textContent = 'Tourne la manivelle !';
    }

    // Cherche un carnassier libre assez proche du bouchon pendant la remontée.
    function attaquePredateurProche(proie) {
        if (!proie || !proie.userData) {
            return null;
        }
        if (PROIES_CARNASSIERS.indexOf(proie.userData.especeId) < 0) {
            return null;
        }
        const px = floatGroup.position.x;
        const pz = floatGroup.position.z;
        let meilleur = null;
        let meilleureDistance = PREDATOR_ATTACK_RADIUS;
        fishes.forEach(function (fish) {
            if (fish === proie || fish === etat.heldFish) {
                return;
            }
            const data = fish.userData;
            if (!data || data.hooked || data.biting) {
                return;
            }
            if (CARNASSIERS.indexOf(data.especeId) < 0) {
                return;
            }
            const d = Math.hypot(fish.position.x - px, fish.position.z - pz);
            if (d < meilleureDistance) {
                meilleureDistance = d;
                meilleur = fish;
            }
        });
        return meilleur;
    }

    // Un carnassier croise la ligne : il attaque, la petite proie s'échappe, et
    // c'est LUI qu'on ramène désormais — avec un avantage au poisson.
    function tenterAttaquePredateur() {
        if (!etat.hookedFish) {
            return false;
        }
        const predateur = attaquePredateurProche(etat.hookedFish);
        if (!predateur) {
            return false;
        }
        const proie = etat.hookedFish;
        const proieNom = proie.userData.espece || 'poisson';
        const predNom = predateur.userData.espece || 'carnassier';
        const predNomMin = predNom.charAt(0).toLowerCase() + predNom.slice(1);
        const proieNomMin = proieNom.charAt(0).toLowerCase() + proieNom.slice(1);
        // 1) La petite proie est libérée et détale.
        proie.userData.hooked = false;
        proie.userData.biting = false;
        proie.userData.targeting = false;
        proie.visible = true;
        const fuiteX = proie.position.x - predateur.position.x;
        const fuiteZ = proie.position.z - predateur.position.z;
        const fuite = Math.hypot(fuiteX, fuiteZ) || 1;
        proie.userData.vx = (fuiteX / fuite) * 3;
        proie.userData.vz = (fuiteZ / fuite) * 3;
        // 2) Le carnassier prend sa place sur la ligne.
        predateur.userData.biting = false;
        predateur.userData.targeting = false;
        predateur.visible = true;
        predateur.position.set(
            floatGroup.position.x + 0.6,
            -1.2,
            floatGroup.position.z + 0.2
        );
        predateur.rotation.y = Math.atan2(
            floatGroup.position.x - predateur.position.x,
            floatGroup.position.z - predateur.position.z
        );
        // 3) Nouveau combat, plus difficile : avantage au carnassier.
        startStruggle(predateur, PREDATOR_ATTACK_ADVANTAGE);
        statusDisplay.textContent = '🐟 Un ' + predNomMin + ' a attaqué ta ligne et remplacé le '
            + proieNomMin + ' ! Combat plus difficile (avantage au poisson).';
        // POPUP 3D au bouchon : indispensable pour que le joueur comprenne
        // immédiatement pourquoi le combat vient de changer de poisson.
        etat.spawnFloatingText('🐟 ' + predNom + ' attaque !', floatGroup.position, '#ff6b57');
        etat.spawnSplash(floatGroup.position);
        etat.spawnRipple(floatGroup.position);
        etat.spawnRipple(floatGroup.position);
        sound.splash();
        etat.shake = 0.18;
        return true;
    }

    function showBiteView(fish) {
        etat.biteFish = fish;
        fish.userData.biting = true;
        fish.visible = false;
        etat.biteViewActive = true;
        etat.bitePhase = 'floating';
        etat.biteViewTimer = 0;
        const flotteur = flotteurCourant();
        const cap = capaciteBouchon(flotteur);
        // Plus le bouchon est sensible, plus la fenêtre de ferrage est longue…
        // …et certains bouchons achetés l'allongent encore (capacité « fenetre »).
        etat.biteFenetre = etat.BITE_WINDOW * flotteur.sensibilite * cap.fenetre;
        // …mais plus il montre de fausses touches ! (« fausses » < 1 = moins de pièges)
        // MODE FACILE : une seule fausse touche, très courte — on apprend sans punir.
        const signauxBase = etat.modeFacile ? 1 : 2 + Math.floor(rand() * 2);   // 2 ou 3 faux signaux AVANT le vrai
        etat.biteSignauxRestants = cap.fausses >= 1
            ? signauxBase
            : Math.max(1, Math.round(signauxBase * cap.fausses));
        // Le poisson a ses habitudes : quelle « touche » aura-t-on cette fois ?
        // Chaque ESPÈCE a ses dessins de bouchon (un brochet emporte l'esche, une
        // tanche la soulève, une ablette la tapote…).
        etat.biteStyle = styleEspece(fish.userData.especeId);
        // Juste après le lancer et à faible profondeur, l'esche peut être prise
        // « à la volée » (le bouchon ne se pose même pas).
        if (etat.depuisLancement < 0.9 && etat.profondeurLigne < 1.6) {
            etat.biteTouche = TOUCHES_PAR_ID.a_la_volee;
            etat.spawnFloatingText('À la volée !', floatGroup.position, '#ffe14d');
        } else {
            etat.biteTouche = choisirTouche(true, fish.userData.size, fish.userData.aggression, etat.biteStyle);
        }
        // Longue attente possible (3 à 8 s) avant le 1er signal, × facteur d'heure et de pression (physique.js).
        // MODE FACILE : le poisson se décide tout de suite (0,7 à 1,3 s).
        etat.biteSinkAt = (etat.modeFacile ? 0.7 + rand() * 0.6 : 3 + rand() * 5)
            * etat.facteurTouche(fish.userData.comp);
        etat.biteSignalTimer = 0;
        etat.biteViewHideTimer = -1; // annule toute fermeture en attente d'une ancienne touche
        etat.strikeQuality = '';
        etat.fightAdvantage = 1;
        floatGroup.position.y = 0.1;
        floatGroup.rotation.z = 0;
        biteOrigine.copy(floatGroup.position);
        etat.spawnRipple(floatGroup.position);
        sound.bite();
        if (etat.techniqueCourante === 'quiver' && capaciteBouchon().sonnette) { sound.playCarillon(); }
        // Vue RÉALISTE : aucun zoom. Un petit message flottant aide simplement à
        // repérer que quelque chose se passe autour du bouchon / du scion.
        const nomMouvement = etat.techniqueCourante === 'quiver' ? 'scion' : 'bouchon';
        etat.spawnFloatingText('Un poisson s’approche…',
            etat.techniqueCourante === 'quiver' ? rodTipVisual : floatGroup.position, '#dff1ff');
        etat.floatState = 'bite';
        statusDisplay.textContent = 'Un poisson s’approche du ' + nomMouvement + '… surveille-le !';
    }

    function hideBiteView() {
        etat.biteViewActive = false;
        etat.cameraMode = 'normal';
        if (kidCue) { kidCue.classList.remove('active'); }
        setFloatOpacity(1);
        floatGroup.rotation.z = 0;
        modeQuiver.reset();
    }

    // Ferrage : le joueur clique. Selon le MOMENT, il obtient un avantage… ou pas !
    function hookFish() {
        if (etat.floatState !== 'bite' || !etat.biteViewActive) {
            return;
        }
        const fish = etat.biteFish;
        if (etat.bitePhase === 'touche') {
            // Pile au bon moment : avantage au joueur (le poisson est tout près).
            etat.strikeQuality = 'parfait';
            etat.fightAdvantage = 0.85;
            etat.biteFish = null;
            etat.consommerEsche();   // une touche ferrée consomme une esche (§15.2)
            if (fish) {
                fish.visible = true;
                sound.reel();
                etat.spawnSplash(floatGroup.position);
                hideBiteView();
                startStruggle(fish, etat.fightAdvantage);
            }
            etat.spawnFloatingText('FERRÉ !', floatGroup.position, '#7ed957');
            statusDisplay.textContent = 'Ferrage parfait ! Tu démarres avec l’avantage.';
            return;
        }
        if (etat.bitePhase === 'fausse' || etat.bitePhase === 'ratee') {
            // Trop tôt (sur une fausse touche) ou trop tard : le poisson a l'avantage.
            // MODE FACILE : le clic reste gagnant, avec très peu de handicap.
            etat.strikeQuality = (etat.bitePhase === 'fausse') ? 'tot' : 'tard';
            etat.fightAdvantage = etat.modeFacile
                ? ((etat.bitePhase === 'fausse') ? 1.0 : 1.05)
                : ((etat.bitePhase === 'fausse') ? 1.15 : 1.3);
            etat.biteFish = null;
            etat.consommerEsche();
            if (fish) {
                fish.visible = true;
                sound.reel();
                etat.spawnSplash(floatGroup.position);
                hideBiteView();
                startStruggle(fish, etat.fightAdvantage);
            }
            etat.spawnFloatingText(etat.strikeQuality === 'tot' ? 'Trop tôt !' : 'Trop tard !',
                floatGroup.position, '#ffb347');
            statusDisplay.textContent = (etat.strikeQuality === 'tot')
                ? 'Trop tôt ! Le poisson a pris de l’avance…'
                : 'Trop tard, mais ferré : le poisson a beaucoup d’avance !';
            return;
        }
        // 'floating' : le bouchon n'a pas bougé → aucun poisson ferré.
        if (etat.biteFish) {
            etat.biteFish.userData.biting = false;
            etat.biteFish.visible = false;
            punishFish(etat.biteFish);
            etat.biteFish = null;
        }
        etat.biteCooldown = 1.0;
        etat.floatState = 'inWater';
        etat.waitTimer = 0;
        etat.spawnFloatingText('Rien ne bougeait…', floatGroup.position, '#cfd8e3');
        statusDisplay.textContent = 'Trop tôt ! Rien ne bougeait encore…';
        hideBiteView();
    }

    function updateBiteView(dt) {
        if (!etat.biteViewActive) {
            return;
        }
        // Fermeture différée (après une touche ratée) : on referme seulement si une
        // nouvelle touche n'a pas commencé entre-temps.
        if (etat.biteViewHideTimer > 0) {
            etat.biteViewHideTimer -= dt;
            if (etat.biteViewHideTimer <= 0) {
                etat.biteViewHideTimer = -1;
                if (etat.floatState !== 'bite') {
                    hideBiteView();
                }
            }
        }
        etat.biteViewTimer += dt;
        const flotteur = flotteurCourant();
        if (etat.bitePhase === 'floating') {
            // Le bouchon est posé sur l'eau : il ne gigote pas, il monte et descend à
            // peine au rythme de la houle. C'est long, et c'est voulu : patience !
            floatGroup.rotation.z *= 0.9;
            floatGroup.position.y = 0.1 + Math.sin(etat.biteViewTimer * 1.6) * 0.02;
            setFloatOpacity(1);
            if (etat.biteViewTimer >= etat.biteSinkAt) {
                if (etat.biteSignauxRestants > 0) {
                    // FAUSSE touche : le bouchon bouge, mais ce n'est pas LE moment.
                    etat.biteSignauxRestants -= 1;
                    etat.bitePhase = 'fausse';
                    etat.biteSignalTimer = 0;
                    // Quelle fausse touche ? (elle change à chaque fois)
                    const profil = etat.biteFish ? etat.biteFish.userData : { size: 0.5, aggression: 1 };
                    etat.biteFauxTouche = choisirTouche(false, profil.size, profil.aggression, etat.biteStyle);
                    etat.biteSignalDuree = dureeTouche(etat.biteFauxTouche);
                    biteOrigine.copy(floatGroup.position);
                    // AUCUN texte ici : le joueur doit lire le mouvement du bouchon.
                    // Le seul message d'approche autorisé est « Un poisson s'approche… »
                    // (affiché au début de la touche, dans showBiteView).
                    // Deux ronds sur l'eau : le mouvement se repère de loin.
                    etat.spawnRipple(floatGroup.position);
                    etat.spawnRipple(floatGroup.position);
                } else {
                    // LA vraie touche : c'est maintenant qu'il faut ferrer.
                    etat.bitePhase = 'touche';
                    etat.biteSignalTimer = 0;
                    biteOrigine.copy(floatGroup.position);
                    // Un « ploc » et des ronds sur l'eau : c'est au joueur de VOIR.
                    sound.splash();
                    etat.spawnRipple(floatGroup.position);
                    etat.spawnRipple(floatGroup.position);
                }
            }
        } else if (etat.bitePhase === 'fausse') {
            etat.biteSignalTimer += dt;
            // Le mouvement vient du CATALOGUE : chaque fausse touche a son dessin
            // propre (frémissement, tapotement, fausse remontée, dérive, tour…).
            const toucheFausse = etat.biteFauxTouche || TOUCHES_PAR_ID.enfonce_partiel;
            const p = Math.min(1, etat.biteSignalTimer / etat.biteSignalDuree);
            appliquerMouvement(mouvementDeTouche(toucheFausse, p, flotteur.remontee === 'couche'));
            setFloatOpacity(1);
            if (etat.biteSignalTimer >= etat.biteSignalDuree) {
                etat.bitePhase = 'floating';
                etat.biteViewTimer = 0;
                // La pause peut être longue (2 à 8 s) avant le signal suivant (même facteur que le premier).
                // MODE FACILE : 0,5 à 1,1 s seulement.
                etat.biteSinkAt = (etat.modeFacile ? 0.5 + rand() * 0.6 : 2 + rand() * 6)
                    * etat.facteurTouche(etat.biteFish ? etat.biteFish.userData.comp : null);
                floatGroup.rotation.z = 0;
                floatGroup.position.set(biteOrigine.x, 0.1, biteOrigine.z);
            }
        } else if (etat.bitePhase === 'touche') {
            etat.biteSignalTimer += dt;
            // LA vraie touche : son dessin vient aussi du catalogue (coulée franche,
            // ascenseur, il file sous l'eau, il se couche…).
            const toucheVraie = etat.biteTouche || TOUCHES_PAR_ID.coulee_franche;
            const p = Math.min(1, etat.biteSignalTimer / dureeTouche(toucheVraie));
            const m = mouvementDeTouche(toucheVraie, p, flotteur.remontee === 'couche');
            appliquerMouvement(m);
            // Un bouchon qui coule franchement s'efface peu à peu : « il a disparu ».
            setFloatOpacity(m.y < -0.5 ? Math.max(0.25, 1 + m.y * 0.34) : 1);
            if (etat.biteSignalTimer >= etat.biteFenetre) {
                // La fenêtre de ferrage est passée : dernière chance de cliquer.
                etat.bitePhase = 'ratee';
                etat.biteSignalTimer = 0;
                etat.biteRetourY = floatGroup.position.y;      // pour remonter en douceur
                etat.biteRetourRot = floatGroup.rotation.z;
                statusDisplay.textContent = 'Trop tard… clique encore pour tenter !';
            }
        } else if (etat.bitePhase === 'ratee') {
            etat.biteSignalTimer += dt;
            // Le poisson recrache : le bouchon REMONTE en douceur jusqu'à sa place
            // (pas de saut d'un coup, comme quand la ligne se détend).
            const k = Math.min(1, etat.biteSignalTimer / 0.45);
            const doux = 1 - Math.pow(1 - k, 3);
            floatGroup.position.y = etat.biteRetourY + (0.1 - etat.biteRetourY) * doux;
            floatGroup.rotation.z = etat.biteRetourRot * (1 - doux);
            setFloatOpacity(1);
            if (etat.biteSignalTimer >= 0.45) {
                // Le poisson recrache l'hameçon : la ligne revient. On passe dans une
                // phase TERMINÉE pour ne pas rejouer ce bloc à chaque image.
                etat.bitePhase = 'termine';
                if (etat.biteFish) {
                    etat.biteFish.userData.biting = false;
                    etat.biteFish.visible = false;
                    punishFish(etat.biteFish);
                    etat.biteFish = null;
                }
                etat.biteCooldown = 1.0;
                etat.floatState = 'inWater';
                etat.waitTimer = 0;
                statusDisplay.textContent = 'Trop tard ! Le poisson a recraché l’hameçon.';
                // TOUCHE RATÉE : un message flottant + des ronds rouges qui s'écartent
                // du bouchon (bien visibles depuis la vue réaliste).
                etat.spawnFloatingText('Raté ! Il a recraché…', floatGroup.position, '#ff6b6b');
                etat.signalerToucheRatee(floatGroup.position);
                etat.biteViewHideTimer = BITE_VIEW_LINGER;
            }
        }
        // MODE FACILE : gros panneau « FERRER ! » pendant LA vraie touche.
        // Mis à jour APRÈS les transitions de phase : c'est ce même appel qui
        // vient de passer en « touche ». C'est le seul moment où il faut cliquer :
        // les enfants n'ont pas à reconnaître un dessin de bouchon pour réussir.
        if (kidCue) {
            kidCue.classList.toggle('active',
                !!etat.modeFacile && etat.floatState === 'bite' && etat.bitePhase === 'touche');
        }
    }

    // Déclencher un poisson/une ligne accrochée : le clic ne sert QUE à sortir d'un
    // accrochage (nénuphars ou vase). Pendant l'épreuve de force, seul le moulinet
    // (la manivelle) fait revenir le poisson.
    // Un clic UTILE : la ligne se détend d'un cran. La vase ne peut en encaisser
    // qu'un toutes les clickCooldown secondes (0 côté nénuphars).
    function appliquerClicUtile() {
        if (!etat.snag) { return; }
        etat.tension = Math.max(0, etat.tension - etat.snag.clickPower);
        etat.snag.lastClick = etat.snag.elapsed;
        etat.snag.clicsUtiles += 1;
    }

    function snagPret() {
        if (!etat.snag) { return false; }
        return etat.snag.clickCooldown <= 0
            || (etat.snag.elapsed - etat.snag.lastClick) >= etat.snag.clickCooldown;
    }

    function reelClick() {
        if (etat.floatState === 'snag' && etat.snag) {
            etat.snag.clics += 1;
            // LA VASE EST TENACE : un clic n'est efficace qu'après un temps de
            // récupération (la ligne doit se détendre). Les nénuphars, eux, n'ont
            // pas de temps de récupération (clickCooldown = 0).
            // Un clic arrivé un poil trop tôt n'est plus PERDU : il est mis en
            // attente et s'appliquera dès que la ligne est prête (voir updateSnag).
            // Sans ça, un enfant qui cliquait au bon rythme voyait ses clics
            // ignorés et perdait sa ligne.
            if (snagPret()) {
                appliquerClicUtile();
            } else {
                etat.snag.enAttente = true;
            }
            etat.shake = 0.06;
            sound.reel();
            updateStruggleBar();
            majIndiceSnag();
        }
    }

    function endStruggle(success, timedOut) {
        fermerPanneauCombat();
        setDragLoosened(false);
        fishButton.disabled = false;
        fishButton.hidden = true;
        etat.struggle = null;
        if (success) {
            etat.fishCaught = true;
            etat.caughtWeight = etat.hookedFish ? etat.hookedFish.userData.weight : 0;
            // Le poisson est sorti de l'eau : il redevient toujours visible, même
            // s'il était en train de « plonger » au moment où on l'a ramené.
            if (etat.hookedFish) {
                etat.hookedFish.visible = true;
            }
            statusDisplay.textContent = 'Poisson ferré ! On le ramène…';
        } else {
            etat.fishCaught = false;
            etat.escaped = true;
            etat.timeoutEscape = !!timedOut;
            if (etat.hookedFish) {
                etat.hookedFish.userData.hooked = false;
                etat.hookedFish.visible = false;   // il replonge et disparaît
                punishFish(etat.hookedFish);
                etat.hookedFish = null;
            }
            statusDisplay.textContent = timedOut ? 'Temps écoulé ! Le poisson s’est décroché.' : 'Fil trop tendu : le poisson s’est décroché !';
        }
        etat.floatState = 'reeling';
    }

    function updateStruggle(dt) {
        if (etat.floatState !== 'struggle' || !etat.struggle) {
            return;
        }
        // 1) Le joueur tourne la manivelle : chaque tour ramène REEL_PER_TURN
        //    unités de fil (un tour ≈ 1 m), donc un long lancer demande plus de tours.
        const reeled = consumeCrankTurns() * REEL_PER_TURN;
        if (reeled > 0) {
            etat.struggle.lineLength -= reeled;
        }
        // 2) Le poisson tire : il reprend du fil, la ligne (et donc la distance)
        //    recule. Il donne aussi des coups brusques de temps en temps.
        //    MAIS il se fatigue : ses tirades faiblissent jusqu'à 40 % après ~7 s.
        etat.struggle.elapsed += dt;
        const endurance = etat.struggle.endurance || 7;
        const essouffle = 1 - 0.6 * Math.min(1, etat.struggle.elapsed / endurance);
        etat.struggle.lineLength += etat.struggle.pullSpeed * essouffle * dt;
        etat.struggle.burstTimer -= dt;
        if (etat.struggle.burstTimer <= 0) {
            etat.struggle.lineLength += etat.struggle.burstDistance * essouffle;
            etat.struggle.burstTimer = etat.struggle.burstInterval * (0.7 + rand() * 0.6);
            // Les « fonceurs » partent de côté, les poissons lourds tirent droit.
            etat.struggle.lateral = (etat.struggle.derive || 0) * (rand() * 2 - 1) * essouffle;
            etat.shake = 0.14;
        }
        // L'écart latéral revient doucement sur l'axe de la ligne.
        etat.struggle.lateral = (etat.struggle.lateral || 0) * Math.max(0, 1 - dt * 1.6);
        if (!etat.struggle.fatigueShown && etat.struggle.elapsed > Math.min(2.5, endurance * 0.35)) {
            etat.struggle.fatigueShown = true;
            // Conseil HONNÊTE : inutile de dire « tourne plus vite » à qui tient un
            // gros poisson, sa vitesse maximale est basse (la ligne patinerait).
            statusDisplay.textContent = vitesseMaxTours() < etat.VITESSE_MANIVELLE_MAX
                ? 'Le poisson fatigue, mais ne force pas : remonte régulièrement.'
                : 'Le poisson fatigue. Tourne plus vite !';
        }
        // 3) La barre et la position du poisson suivent la longueur de fil sortie.
        // 3) Frein : si on lâche du fil, le poisson reprend de la distance mais la
        //    ligne ne casse pas (le frein patine).
        if (etat.dragLoosened) {
            etat.struggle.lineLength += 3.5 * dt;
        }
        etat.tension = Math.max(0, Math.min(1, lineLengthToTension(etat.struggle.lineLength)));
        if (etat.dragLoosened) {
            etat.tension = Math.min(0.72, etat.tension);
        }
        // Si le fil est trop tendu, le poisson se décroche, sauf si le frein patine.
        if (!etat.dragLoosened && etat.struggle.lineLength >= etat.struggle.maxLength) {
            etat.tension = 1;
            computeStrugglePos();
            updateStruggleBar();
            endStruggle(false);
            return;
        }
        // Poisson ramené au bord de la canne : gagné !
        if (etat.struggle.lineLength <= etat.struggle.minLength) {
            etat.tension = 0;
            computeStrugglePos();
            updateStruggleBar();
            endStruggle(true);
            return;
        }
        // Temps limité : sinon le poisson finit par se décrocher.
        etat.struggleTimeLeft -= dt;
        if (etat.struggleTimeLeft <= 0) {
            etat.struggleTimeLeft = 0;
            updateStruggleTimer();
            endStruggle(false, true);
            return;
        }
        updateStruggleTimer();
        computeStrugglePos();
        updateStruggleBar();
    }

    return {
        updateStruggleBar, showCatchMessage, annoncerRecord, tenterAttaquePredateur,
        showBiteView, hideBiteView, hookFish, updateBiteView, appliquerClicUtile, snagPret,
        reelClick, updateStruggle
    };
}
