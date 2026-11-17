// ---------------------------------------------------------------------------
// Scénario : l'esche équipée se voit en 3D sur l'hameçon.
// ---------------------------------------------------------------------------
import { group, check, checkEqual, G, step, resetToIdle } from './harness.mjs';
import { IDS_ESCHES } from '../esches.js';

export function run() {
    group('Esche visible en 3D au bout de la ligne');
    resetToIdle();
    const vue = G().etat.escheVisuelle;
    IDS_ESCHES.forEach(function (id) {
        G().etat.equiperEsche(id);
        step(1 / 60);
        checkEqual('esche « ' + id + ' » affichée sur l’hameçon', vue.escheAffichee(), id);
    });
    G().etat.equiperEsche(null);
    step(1 / 60);
    checkEqual('hameçon nu : aucun modèle', vue.escheAffichee(), null);
    G().etat.equiperEsche('ver');
    G().etat.escheVolee = true;
    step(1 / 60);
    checkEqual('esche volée : l’hameçon est nu', vue.escheAffichee(), null);
    G().etat.escheVolee = false;
    step(1 / 60);
    checkEqual('esche rendue : le ver revient', vue.escheAffichee(), 'ver');
}
