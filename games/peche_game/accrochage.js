// ---------------------------------------------------------------------------
// accrochage.js — ACCROCHAGE dans les nénuphars : détection, accroc, dégagement du fil. Extrait de script.js (v165).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=228';

export function creerAccrochage(deps) {
    const {
        lilyPads, obstacles, strugglePanel, sound, struggleInfo, strugglePortrait, struggleTimer,
        struggleHint, updateStruggleBar, fishButton, statusDisplay, fermerPanneauCombat,
        debiterLigne, perdreLeBouchon, totalLignes, terminerPartie, snagPret, appliquerClicUtile,
        rand
    } = deps;

    // ---------------------------------------------------------------------------
    // Accrochage dans les nénuphars
    // ---------------------------------------------------------------------------
    // Renvoie `true` pour un nénuphar, l'OBSTACLE (ponton, souche, roches…) qui retient
    // l'hameçon, ou false. startSnag(obstacle) lit sa difficulté et son message.
    function isSnagged(point) {
        const obstacle = obstacles.accrocheEn(point);
        if (obstacle) {
            return obstacle;
        }
        for (let i = 0; i < lilyPads.length; i++) {
            const pad = lilyPads[i];
            const dx = point.x - pad.x;
            const dz = point.z - pad.z;
            const r = pad.radius + 0.5;
            if (dx * dx + dz * dz < r * r) {
                return true;
            }
        }
        return false;
    }

    function startSnag(mode) {
        etat.floatState = 'snag';
        const obstacle = mode && typeof mode === 'object' ? mode : null;
        const profil = obstacle ? obstacle.profil : null;
        const dansLaVase = mode === 'fond';
        etat.tension = profil ? profil.tensionDepart : (dansLaVase ? 0.55 : 0.5);
        // Deux accrochages, deux difficultés :
        //  - NÉNUPHARS : on clique vite, c'est facile (clickCooldown = 0).
        //  - VASE : elle ASPIRE. Un clic n'est utile que toutes les 0,32 s ; il faut
        //    tenir un rythme (~3 clics/s) pendant plusieurs secondes, sinon la
        //    tension monte et la ligne casse.
        // OBSTACLES (obstacles.js) : chacun a SA difficulté et SON message (ACCROCHAGES).
        etat.snag = profil ? {
            dansLaVase: false,
            obstacle: obstacle.type,
            rythme: profil.clickCooldown > 0,
            message: profil.message,
            pullRate: profil.pullRate,
            burstStrength: profil.burstStrength,
            burstInterval: profil.burstInterval,
            burstTimer: profil.burstInterval,
            clickPower: profil.clickPower,
            clickCooldown: profil.clickCooldown,
            enAttente: false,
            elapsed: 0,
            lastClick: -1,
            clics: 0,
            clicsUtiles: 0
        } : dansLaVase ? {
            dansLaVase: true,
            rythme: true,
            // La vase tire un peu moins fort qu'avant : ses à-coups rendaient la
            // sortie injuste (on pouvait perdre la ligne en cliquant correctement).
            pullRate: 0.08,
            burstStrength: 0.08,
            burstInterval: 0.9,
            burstTimer: 0.9,
            // Chaque clic utile détend un peu plus la ligne qu'avant : la sortie de
            // vase dure ~3 s de clics réguliers au lieu de ~4 s.
            clickPower: 0.12,
            clickCooldown: 0.32,
            enAttente: false,       // clic arrivé trop tôt : gardé, pas perdu
            elapsed: 0,
            lastClick: -1,
            clics: 0,
            clicsUtiles: 0
        } : {
            dansLaVase: false,
            rythme: false,
            pullRate: 0.12,
            burstStrength: 0.10,
            burstInterval: 1.1,
            burstTimer: 1.1,
            clickPower: 0.10,
            clickCooldown: 0,
            enAttente: false,
            elapsed: 0,
            lastClick: -1,
            clics: 0,
            clicsUtiles: 0
        };
        snagIndicePret = null;
        strugglePanel.classList.add('active');
        strugglePanel.classList.add('snagging');
        sound.snag();
        // Bruit du fond (sons déjà crédités) : cailloux pour la roche, bulle pour la vase.
        const sonFond = obstacle ? obstacle.son : (dansLaVase ? ['plouf', 0.45] : null);
        if (sonFond && sound.jouerSample) { sound.jouerSample(sonFond[0], sonFond[1]); }
        struggleInfo.textContent = profil ? profil.message
            : dansLaVase ? 'Hameçon accroché dans la vase' : 'Ligne accrochée aux nénuphars';
        if (strugglePortrait) { strugglePortrait.hidden = true; }
        etat.portraitEspeceCourante = null;
        struggleTimer.textContent = '';
        struggleTimer.classList.remove('urgent');
        struggleHint.textContent = profil ? indiceObstacle(profil)
            : dansLaVase
                ? 'La vase aspire : clique en rythme (environ 3 fois par seconde) !'
                : 'Clique vite pour dégager la ligne !';
        struggleHint.hidden = false;
        majIndiceSnag();
        updateStruggleBar();
        fishButton.disabled = false;
        fishButton.textContent = 'Dégager !';
        fishButton.hidden = false;
        statusDisplay.textContent = profil
            ? profil.message + (profil.clickCooldown > 0
                ? ' Clique en rythme (≈ 3 clics/s) pour la dégager.' : ' Clique vite pour la dégager.')
            : dansLaVase
            ? 'Ton hameçon s’est enfoncé dans la vase ! Tire en rythme (≈ 3 clics/s) pour le dégager, puis règle une ligne moins profonde.'
            : 'La ligne s’est accrochée aux nénuphars ! Clique pour la dégager.';
    }

    function indiceObstacle(profil) {
        return profil.clickCooldown > 0
            ? 'Clique en rythme (environ 3 fois par seconde) pour dégager la ligne !'
            : 'Clique vite pour dégager la ligne !';
    }

    // Indique au joueur s'il peut cliquer (vase) ou s'il doit laisser le fil se
    // détendre. N'affiche rien pour les nénuphars (pas de temps de récupération).
    let snagIndicePret = null;
    function majIndiceSnag() {
        if (!etat.snag || !etat.snag.rythme) {
            return;
        }
        const pret = (etat.snag.elapsed - etat.snag.lastClick) >= etat.snag.clickCooldown;
        if (pret === snagIndicePret) {
            return;
        }
        snagIndicePret = pret;
        // Le clic n'est jamais perdu (il attend son tour) : on encourage au lieu de
        // gronder le joueur.
        struggleHint.textContent = pret
            ? (etat.snag.obstacle ? 'Clique en rythme (environ 3 fois par seconde) pour dégager la ligne !'
                : 'La vase aspire : clique en rythme (environ 3 fois par seconde) !')
            : 'La ligne se détend… ton clic est gardé, continue !';
        if (fishButton.classList) {
            fishButton.classList.toggle('cooldown', !pret);
        }
    }

    function endSnag(freed) {
        fermerPanneauCombat();
        fishButton.hidden = true;
        if (fishButton.classList) {
            fishButton.classList.remove('cooldown');
        }
        etat.snag = null;
        snagIndicePret = null;
        if (freed) {
            etat.snagFreed = true;
            statusDisplay.textContent = 'Ligne dégagée ! On la ramène.';
            etat.floatState = 'reeling';
        } else {
            debiterLigne();
            sound.lineBreak();
            etat.floatGroup.visible = false;
            etat.lineBrokenTimer = 1.2;
            etat.floatState = 'broken';
            // Le bouchon part avec la ligne : s'il avait été acheté, il est PERDU.
            const perdu = perdreLeBouchon();
            if (perdu) {
                statusDisplay.textContent = 'La ligne a cassé ! Ton bouchon « ' + perdu.nom
                    + ' » est perdu… tu repêches avec le bouchon de départ.';
                etat.spawnFloatingText('Bouchon perdu !', etat.floatGroup.position, '#ff6b6b');
            } else {
                statusDisplay.textContent = 'La ligne a cassé ! Le bouchon est perdu… (un bouchon de départ : sans regret).';
            }
        }
        if (!freed && totalLignes() === 0) { terminerPartie(); }
    }

    function updateSnag(dt) {
        if (etat.floatState !== 'snag' || !etat.snag) {
            return;
        }
        etat.snag.elapsed += dt;
        // Clic mis en attente : il part dès que la ligne a eu le temps de se
        // détendre. Le rythme (~3 clics/s) reste obligatoire, mais plus aucun clic
        // n'est perdu.
        if (etat.snag.enAttente && snagPret()) {
            etat.snag.enAttente = false;
            appliquerClicUtile();
        }
        if (etat.tension <= 0) {
            etat.tension = 0;
            updateStruggleBar();
            endSnag(true);
            return;
        }
        etat.tension += etat.snag.pullRate * dt;
        etat.snag.burstTimer -= dt;
        if (etat.snag.burstTimer <= 0) {
            etat.tension += etat.snag.burstStrength;
            etat.snag.burstTimer = etat.snag.burstInterval * (0.7 + rand() * 0.6);
            etat.shake = 0.12;
        }
        if (etat.tension >= 1) {
            etat.tension = 1;
            updateStruggleBar();
            endSnag(false);
            return;
        }
        majIndiceSnag();
        updateStruggleBar();
    }

    return {
        isSnagged, startSnag, majIndiceSnag, updateSnag
    };
}
