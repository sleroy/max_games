// ---------------------------------------------------------------------------
// Profil du monde, côté tests. Le jeu et les tests n'ont PAS la même instance de `dimensions.js` : le jeu tourne sur des
// copies (harnais), les tests importent `../dimensions.js`. Le profil courant (la forme tirée de la graine) est un
// ÉTAT du module : pour que `rayonContour`, `extents`, `echelleExtent`… calculent sur le même plan d'eau que le jeu,
// les tests recopient le profil du jeu dans leur propre instance avec `suivreProfil` après chaque changement de biotope.
// ---------------------------------------------------------------------------
import { definirProfil, FORMES } from '../dimensions.js';

/** Recopie le profil du plan d'eau du jeu (`getMonde().profil`) dans le module `dimensions.js` des tests. */
export function suivreProfil(Z) {
    const profil = Z.getMonde().profil;
    definirProfil(JSON.parse(JSON.stringify(profil)));
    return profil;
}

/** Remet le module des tests sur le style par défaut (le contour d'origine de l'étang). */
export function profilParDefaut() {
    definirProfil(FORMES.etang);
}

// Graine TÉMOIN des scénarios « tailles d'étang » et « formes d'eau » : ils posent des attendus sur CHAQUE biotope
// (au moins un obstacle dans la forêt de 24 unités, tous les poissons dans l'eau, fosses d'origine dans un canal étroit…) qui
// dépendent du plan d'eau tiré. Cette graine a été choisie parmi les 80 premières : les six biotopes y respectent tous ces
// attendus. La robustesse sur d'AUTRES graines est celle de `scenario-formes-graine.mjs` (20 graines par forme).
export const GRAINE_TEMOIN = 3;
