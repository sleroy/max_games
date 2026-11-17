// ---------------------------------------------------------------------------
// Scénario : la végétation ONDULE au vent (vegetation.js, demande du joueur 2026-11-16).
//  - roseaux et touffes d'herbe reçoivent le shader de vent (greffé sur project_vertex) ;
//  - l'herbe pousse sur la berge, jamais dans l'eau ;
//  - les uniformes suivent le vent (direction, force, temps) ;
//  - le balancement grandit avec le vent et varie d'une plante à l'autre.
// ---------------------------------------------------------------------------
import { group, check, checkEqual, G, moduleCopie } from './harness.mjs';

export async function run() {
    const { TOUFFES, balancement } = await import(moduleCopie('vegetation.js'));
    // Le contour et le centre du JEU (formes tirées d'une graine) : le module copié par `moduleCopie` est une autre instance,
    // restée dans son état d'origine (plaine sans graine).
    const POND_CENTER = G().getPondCenter();
    const rayonEtang = function (angle) { return G().getRayonEtang(angle); };
    group('Végétation au vent : roseaux et herbe des berges');
    const scene = G().scene;
    const instances = [];
    scene.traverse(o => { if (o.isInstancedMesh) { instances.push(o); } });
    const herbe = instances.find(o => o.count === TOUFFES);
    check('les touffes d’herbe sont dans la scène (' + TOUFFES + ', 1 appel de dessin)', !!herbe);
    const roseaux = instances.find(o => o.material && o.material.color && o.material.color.getHex() === 0x2f6b3f);
    check('les roseaux sont dans la scène', !!roseaux);

    // Le shader de vent est greffé sur les deux matériaux.
    [['herbe', herbe], ['roseaux', roseaux]].forEach(function ([nom, mesh]) {
        if (!mesh) { return; }
        const shader = { uniforms: {}, vertexShader: 'void main() {\n#include <project_vertex>\n}' };
        mesh.material.onBeforeCompile(shader);
        check(nom + ' : le shader plie les sommets selon le vent', shader.vertexShader.indexOf('uDirVent * plie') >= 0
            && shader.vertexShader.indexOf('#include <project_vertex>') < 0 && shader.vertexShader.indexOf('gl_Position') >= 0);
        check(nom + ' : uniformes de vent branchés', ['uTempsVent', 'uForceVent', 'uDirVent'].every(u => !!shader.uniforms[u]));
    });

    // L'herbe est sur la berge (au-delà du bord de l'eau).
    if (herbe) {
        const m = herbe.matrix.clone();
        let dansLEau = 0;
        for (let i = 0; i < herbe.count; i += 40) {
            herbe.getMatrixAt(i, m);
            const x = m.elements[12];
            const z = m.elements[14];
            const angle = Math.atan2(z - POND_CENTER.z, x - POND_CENTER.x);
            if (Math.hypot(x - POND_CENTER.x, z - POND_CENTER.z) < rayonEtang(angle) + 4) { dansLEau++; }
        }
        checkEqual('aucune touffe d’herbe dans l’eau ni sur le sable du bord', dansLEau, 0);

        // Les uniformes suivent le vent, juste avant le rendu.
        G().setWind(Math.PI / 2, 0.8);
        herbe.onBeforeRender();
        const shader = { uniforms: {}, vertexShader: '#include <project_vertex>' };
        herbe.material.onBeforeCompile(shader);
        check('la force du vent passe au shader', Math.abs(shader.uniforms.uForceVent.value - 0.8) < 1e-6, shader.uniforms.uForceVent.value);
        check('la direction du vent passe au shader', Math.abs(shader.uniforms.uDirVent.value.y - 1) < 1e-6
            && Math.abs(shader.uniforms.uDirVent.value.x) < 1e-6);
        G().setWind(0, 0);
    }

    // Le modèle du balancement.
    check('vent nul : à peine un frémissement', Math.abs(balancement(3, 0, 1, 2)) <= 0.06);
    check('vent fort : les tiges plient nettement plus', balancement(3, 0.8, 1, 2) > 0.3);
    check('deux plantes voisines ne bougent pas en même temps', balancement(3, 0.5, 0, 0) !== balancement(3, 0.5, 6, 4));
}
