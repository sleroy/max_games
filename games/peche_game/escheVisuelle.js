// ---------------------------------------------------------------------------
// escheVisuelle.js — l'ESCHE se voit en 3D au bout de la ligne, accrochée à l'hameçon.
//
// Un petit modèle par esche (maïs, ver, pain, bouillette, vif, mouche), en géométries
// simples et partagées. Le modèle suit l'esche équipée (`etat.escheEquipee()`) : on le
// change seulement quand l'esche change (aucune allocation par image). Hameçon nu ou esche
// volée : rien.
//
// API : creerEscheVisuelle({ hook }) → { maj(), escheAffichee(), setOpacite(o) }.
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { etat } from './etat.js?v=254';

// Fabrique les modèles (coordonnées locales de l'hameçon : rayon de l'hameçon ≈ 0,016).
function fabriquer() {
    const mat = function (couleur, options) {
        return new THREE.MeshStandardMaterial(Object.assign({ color: couleur, roughness: 0.6, transparent: true }, options || {}));
    };
    const modeles = {};

    // Maïs : trois grains jaunes enfilés sur l'hameçon.
    const mais = new THREE.Group();
    const grain = new THREE.SphereGeometry(0.014, 8, 6);
    const jaune = mat(0xf2c230, { roughness: 0.35 });
    [-0.018, 0, 0.018].forEach(function (y, i) {
        const g = new THREE.Mesh(grain, jaune);
        g.position.set(i === 1 ? 0.004 : -0.002, y, 0);
        g.scale.set(1, 0.8, 0.75);
        mais.add(g);
    });
    modeles.mais = mais;

    // Ver : un tube rose-brun qui ondule autour de l'hameçon, avec un bout qui pend.
    const courbe = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.012, 0.03, 0), new THREE.Vector3(0.016, 0.012, 0.004),
        new THREE.Vector3(-0.014, -0.006, -0.004), new THREE.Vector3(0.012, -0.026, 0.002),
        new THREE.Vector3(0.002, -0.06, 0)
    ]);
    modeles.ver = new THREE.Mesh(new THREE.TubeGeometry(courbe, 24, 0.006, 6, false), mat(0xb5535a, { roughness: 0.45 }));

    // Pain : une boulette blanche irrégulière.
    const pain = new THREE.Mesh(new THREE.DodecahedronGeometry(0.022, 0), mat(0xf3ead6, { roughness: 0.95 }));
    pain.scale.set(1, 0.85, 0.9);
    modeles.pain = pain;

    // Bouillette : une bille brune bien ronde.
    modeles.bouillette = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), mat(0x7a4a26, { roughness: 0.5 }));

    // Vif : un petit poisson argenté (corps fuselé + queue).
    const vif = new THREE.Group();
    const corps = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), mat(0xc9d3da, { metalness: 0.5, roughness: 0.3 }));
    corps.scale.set(2.6, 1, 0.6);
    vif.add(corps);
    const queue = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.03, 4), mat(0x8fa0aa, { metalness: 0.4 }));
    queue.rotation.z = Math.PI / 2;
    queue.position.x = -0.062;
    vif.add(queue);
    modeles.vif = vif;

    // Mouche : corps sombre et deux ailes claires.
    const mouche = new THREE.Group();
    const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), mat(0x2a2620));
    thorax.scale.set(1.8, 1, 1);
    mouche.add(thorax);
    const aile = new THREE.PlaneGeometry(0.026, 0.012);
    const matAile = mat(0xe8f0f4, { opacity: 0.6, side: THREE.DoubleSide, depthWrite: false });
    [-1, 1].forEach(function (cote) {
        const a = new THREE.Mesh(aile, matAile);
        a.position.set(-0.004, 0.008, cote * 0.01);
        a.rotation.x = cote * 0.5;
        mouche.add(a);
    });
    modeles.mouche = mouche;

    // Chaque modèle se pose sur la courbure de l'hameçon (le bas du « J »).
    Object.keys(modeles).forEach(function (id) {
        modeles[id].name = 'esche-' + id;
        modeles[id].position.y += 0.012;
        modeles[id].visible = false;
    });
    return modeles;
}

export function creerEscheVisuelle(deps) {
    const { hook } = deps;
    const modeles = fabriquer();
    Object.keys(modeles).forEach(function (id) { hook.add(modeles[id]); });
    let affichee = null;

    function idActuel() {
        // Esche volée par un poisson : l'hameçon est nu (on le voit en ramenant la ligne).
        if (etat.escheVolee) { return null; }
        const e = etat.escheEquipee ? etat.escheEquipee() : null;
        if (!e) { return null; }
        const id = typeof e === 'string' ? e : e.id;
        return Object.prototype.hasOwnProperty.call(modeles, id) ? id : null;
    }

    // À appeler à chaque image : ne fait quelque chose que si l'esche a changé.
    function maj() {
        const id = idActuel();
        if (id === affichee) { return; }
        if (affichee) { modeles[affichee].visible = false; }
        if (id) { modeles[id].visible = true; }
        affichee = id;
    }

    // Le bouchon devient transparent (vue sous l'eau, touche) : l'esche suit.
    function setOpacite(opacite) {
        Object.keys(modeles).forEach(function (id) {
            modeles[id].traverse(function (o) {
                if (o.material) { o.material.opacity = o.material.userData.base === undefined
                    ? (o.material.userData.base = o.material.opacity) * opacite
                    : o.material.userData.base * opacite; }
            });
        });
    }

    maj();
    return { maj, setOpacite, escheAffichee: function () { return affichee; } };
}
