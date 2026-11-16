// ---------------------------------------------------------------------------
// avion.js — UN PETIT AVION TRAÎNE UNE BANDEROLE DE CONSEILS dans le ciel (demande du joueur 2026-11-16).
//
// « Gardon : 🍞 Pain / flocons, puis 🪱 Ver de terre · jamais 🌽 Maïs » : les 2 meilleures esches et la
// pire, d'après la MATRICE des touches (matriceTouche.conseilsEsches), donc toujours à jour quand on
// change un réglage d'esche. Une espèce par passage, à tour de rôle.
//
// L'avion passe devant la caméra (où que soit le poste), de gauche à droite, à ~60 unités, puis
// disparaît. Premier passage après PREMIER_PASSAGE s, puis toutes les INTERVALLE s de jeu (horloge
// du jeu : rien ne bouge en pause). ⚠ Aucun `rand()` : le monde reproductible n'est pas touché.
// Appelé par vie.js (vie ambiante) : `maj(dt)` à chaque image. `lancerMessage(lignes)` : passage prioritaire
// avec un message donné (conseil pour l'endroit du bouchon quand rien ne mord, conseilLocal.js).
// Modèle 3D : petit avion de tourisme low poly (assets/avion.glb, Vojtěch Balák, CC-BY 3.0, voir CREDITS.txt), chargé avec le GLTFLoader de
// three.js. Tant qu'il n'est pas chargé (ou sans réseau / dans les tests), un petit avion simple le remplace.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { conseilsEsches, calculerResume } from './matriceTouche.js?v=237';

export const PREMIER_PASSAGE = 30;   // s de jeu avant le premier passage
export const INTERVALLE = 90;        // s entre deux passages (fin d'un passage → début du suivant)
export const VITESSE = 11;           // unités / s
export const DEMI_TRAJET = 75;       // l'avion entre et sort juste hors de l'écran (à 60 unités de la caméra)
const DISTANCE = 60;                 // distance devant la caméra
const ALTITUDE = 12;                 // assez bas pour passer sous la barre du haut (téléphone à l’horizontale)
const BANDEROLE_L = 30;
const BANDEROLE_H = 7.5;            // 2 lignes de texte : hauteur des lettres ≈ 30 px à l'écran (1280 × 800)
export const URL_MODELE = './assets/avion.glb';
const TAILLE_MODELE = 6;             // envergure du modèle (unités ≈ 3 m, à 60 unités : bien lisible)
const CAP_MODELE = -Math.PI / 2;     // le nez du modèle pointe vers -z : on le tourne vers +x (sens du vol)

// Texture de la banderole : 2 lignes centrées, police la plus grande qui tient (jamais tronquée).
export function taillePolice(mesurer, lignes, largeur, depart) {
    let taille = depart;
    while (taille > 20 && lignes.some(function (l) { return mesurer(l, taille) > largeur; })) { taille -= 2; }
    return taille;
}

function texturePour(lignes) {
    try {
        const c = document.createElement('canvas');
        c.width = 1024;
        c.height = 256;
        const g = c.getContext('2d');
        if (!g || typeof g.fillText !== 'function') { return null; }
        g.fillStyle = '#fff8e1';
        g.fillRect(0, 0, c.width, c.height);
        g.strokeStyle = '#d9480f';
        g.lineWidth = 8;
        g.strokeRect(4, 4, c.width - 8, c.height - 8);
        g.fillStyle = '#1b2a33';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        const taille = taillePolice(function (l, t) {
            g.font = 'bold ' + t + 'px sans-serif';
            return g.measureText ? g.measureText(l).width : 0;
        }, lignes, c.width - 60, 92);
        g.font = 'bold ' + taille + 'px sans-serif';
        g.fillText(lignes[0], c.width / 2, c.height * 0.32);
        g.fillStyle = '#c92a2a';
        g.fillText(lignes[1], c.width / 2, c.height * 0.72);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
    } catch (erreur) {
        return null;
    }
}

// Agrandissement de la banderole selon la hauteur de l'écran (px CSS) : sur un téléphone à l'horizontale
// (≈ 390 px), le texte resterait trop petit (≈ 9 px) ; ×1,8 au plus (≈ 17 px, comme sur un ordinateur).
export function echelleBanderole(hauteurEcran) {
    return Math.min(1.8, Math.max(1, 700 / (hauteurEcran || 800)));
}

export function creerAvion(deps) {
    const { scene, camera } = deps;   // camera : fonction (la caméra est créée après vie.js)
    const hauteurEcran = deps.hauteurEcran || function () { return 800; };
    let echelle = 1;

    const groupe = new THREE.Group();
    const secours = new THREE.Group();     // avion simple, en attendant le vrai modèle
    groupe.add(secours);
    const peinture = new THREE.MeshStandardMaterial({ color: 0xe03131, roughness: 0.6 });
    const blanc = new THREE.MeshStandardMaterial({ color: 0xf1f3f5, roughness: 0.6 });
    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.3, 5, 10), peinture);
    fuselage.rotation.z = Math.PI / 2;                       // le nez vers +x
    secours.add(fuselage);
    const ailes = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 7), blanc);
    ailes.position.x = 0.6;
    secours.add(ailes);
    const derive = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.1), peinture);
    derive.position.set(-2.2, 0.6, 0);
    secours.add(derive);
    const helice = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2, 0.2), blanc);
    helice.position.x = 2.6;
    secours.add(helice);
    groupe.visible = false;
    scene.add(groupe);
    let heliceModele = null;

    // Le vrai modèle (chargement asynchrone, import dynamique : sans fichier, l'avion simple reste).
    import('./assets/GLTFLoader.js').then(function (m) {
        new m.GLTFLoader().load(URL_MODELE, function (gltf) {
            const modele = gltf.scene;
            const inutiles = [];
            modele.traverse(function (o) { if (o.isLight || o.isCamera) { inutiles.push(o); } });
            inutiles.forEach(function (o) { o.parent.remove(o); });
            const boite = new THREE.Box3().setFromObject(modele);
            const taille = boite.getSize(new THREE.Vector3());
            const centre = boite.getCenter(new THREE.Vector3());
            const echelle = TAILLE_MODELE / Math.max(taille.x, taille.y, taille.z, 0.001);
            const pivot = new THREE.Group();
            modele.position.sub(centre);
            pivot.add(modele);
            pivot.scale.setScalar(echelle);
            pivot.rotation.y = CAP_MODELE;
            modele.traverse(function (o) {
                if (o.isMesh) { o.castShadow = false; }
                if (!heliceModele && /propeller/i.test(o.name || '')) { heliceModele = o.isMesh && o.parent && /propeller/i.test(o.parent.name || '') ? o.parent : o; }
            });
            groupe.add(pivot);
            secours.visible = false;
        }, undefined, function () { /* fichier absent : l'avion simple reste */ });
    }).catch(function () { /* tests (Node) ou navigateur sans module : l'avion simple reste */ });

    const toile = new THREE.MeshBasicMaterial({ color: 0xfff8e1, side: THREE.DoubleSide, fog: false });
    const banderole = new THREE.Mesh(new THREE.PlaneGeometry(BANDEROLE_L, BANDEROLE_H), toile);
    banderole.visible = false;
    scene.add(banderole);
    // Le câble de remorquage, de la queue de l'avion au bord avant de la banderole.
    const cablePoints = new Float32Array(6);
    const cableGeo = new THREE.BufferGeometry();
    cableGeo.setAttribute('position', new THREE.BufferAttribute(cablePoints, 3));
    const cable = new THREE.Line(cableGeo, new THREE.LineBasicMaterial({ color: 0x333333 }));
    cable.frustumCulled = false;
    cable.visible = false;
    scene.add(cable);

    let resume = null;            // la matrice (≈ 50 ms), calculée au premier passage, une seule fois
    let conseils = null;          // conseils des espèces du biotope (refaits si le biotope change)
    let cleConseils = null;
    let rang = 0;
    let attente = PREMIER_PASSAGE;
    let vol = null;               // { depart, droite, t, duree, conseil }
    const _avant = new THREE.Vector3();
    const _droite = new THREE.Vector3();
    const _p = new THREE.Vector3();

    // Passage « conseil général » : l'espèce suivante, à tour de rôle.
    function lancer() {
        if (!camera()) { return null; }
        // Seules les espèces PRÉSENTES dans le biotope (deps.especesIds, défaut : toutes) ont une banderole.
        const ids = deps.especesIds ? deps.especesIds() : undefined;
        const cle = ids ? ids.join(',') : '';
        if (!conseils || cle !== cleConseils) {
            resume = resume || calculerResume(15);
            conseils = conseilsEsches(resume, ids);
            cleConseils = cle;
            rang = 0;
        }
        const conseil = conseils[rang % conseils.length];
        rang++;
        return voler(conseil);
    }

    // Passage avec un message donné (conseil pour l'endroit du bouchon, conseilLocal.js). Il passe en
    // priorité : un passage en cours est remplacé.
    function lancerMessage(lignes, cle) {
        return voler({ especeId: null, cle: cle || 'message', lignes: lignes, texte: lignes.join(' — ') });
    }

    function voler(conseil) {
        const cam = camera();
        if (!cam) { return null; }
        cam.getWorldDirection(_avant);
        _avant.y = 0;
        if (_avant.lengthSq() < 1e-6) { _avant.set(0, 0, -1); }
        _avant.normalize();
        _droite.set(-_avant.z, 0, _avant.x);                 // à droite de l'écran
        const centre = cam.position.clone().addScaledVector(_avant, DISTANCE);
        centre.y = ALTITUDE;
        vol = { depart: centre.addScaledVector(_droite, -DEMI_TRAJET), droite: _droite.clone(), t: 0,
            duree: (2 * DEMI_TRAJET) / VITESSE, conseil: conseil };
        if (toile.map) { toile.map.dispose(); }
        toile.map = texturePour(conseil.lignes);
        echelle = echelleBanderole(hauteurEcran());
        banderole.scale.set(echelle, echelle, 1);
        toile.color.set(toile.map ? 0xffffff : 0xfff8e1);
        toile.needsUpdate = true;
        groupe.rotation.set(0, Math.atan2(-vol.droite.z, vol.droite.x), 0);
        groupe.visible = true;
        banderole.visible = true;
        cable.visible = true;
        placer();
        return conseil;
    }

    function placer() {
        _p.copy(vol.depart).addScaledVector(vol.droite, vol.t * VITESSE);
        _p.y += Math.sin(vol.t * 0.8) * 0.6;                  // léger tangage
        groupe.position.copy(_p);
        groupe.rotation.x = Math.sin(vol.t * 0.8) * 0.06;
        helice.rotation.x += 0.9;
        if (heliceModele) { heliceModele.rotation.z += 0.9; }   // l'hélice tourne autour de l'axe du nez (z du modèle)
        // La banderole suit l'avion (derrière lui) et fait face à la caméra : le texte se lit toujours.
        banderole.position.copy(_p).addScaledVector(vol.droite, -(BANDEROLE_L * echelle / 2 + 4));
        banderole.position.y -= 0.6 + (echelle - 1) * BANDEROLE_H * 0.3;
        const cam = camera();
        if (cam) { banderole.lookAt(cam.position.x, banderole.position.y, cam.position.z); }
        const queue = _p.clone().addScaledVector(vol.droite, -TAILLE_MODELE * 0.45);
        const avant = banderole.position.clone().addScaledVector(vol.droite, BANDEROLE_L * echelle / 2);
        cablePoints.set([queue.x, queue.y, queue.z, avant.x, avant.y + BANDEROLE_H * echelle * 0.3, avant.z]);
        cableGeo.attributes.position.needsUpdate = true;
    }

    function maj(dt) {
        if (vol) {
            vol.t += dt;
            if (vol.t >= vol.duree) {
                vol = null;
                groupe.visible = false;
                banderole.visible = false;
                cable.visible = false;
                attente = INTERVALLE;
                return;
            }
            placer();
            return;
        }
        attente -= dt;
        if (attente <= 0) { lancer(); }
    }

    return {
        maj, lancer, lancerMessage, groupe, banderole,
        enVol: function () { return !!vol; },
        conseilCourant: function () { return vol ? vol.conseil : null; },
        attente: function () { return attente; }
    };
}
