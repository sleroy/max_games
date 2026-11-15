// Vérifie la syntaxe de tous les fichiers .js / .mjs des jeux (sans les exécuter).
//   node scripts/check-syntax.mjs
// Aucune dépendance : Node seul. Un fichier qui contient import/export est
// analysé comme module ES, sinon comme script classique.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const IGNORES = new Set(['node_modules', '.git', 'assets']);
const fichiers = [];

function parcourir(dossier) {
  for (const nom of readdirSync(dossier)) {
    if (IGNORES.has(nom)) continue;
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) parcourir(chemin);
    else if (/\.m?js$/.test(nom)) fichiers.push(chemin);
  }
}
parcourir('games');

let erreurs = 0;
for (const f of fichiers) {
  const source = readFileSync(f, 'utf8');
  const estModule = /^\s*(import|export)\s/m.test(source);
  const r = spawnSync(process.execPath, [`--input-type=${estModule ? 'module' : 'commonjs'}`, '--check'], {
    input: source,
    encoding: 'utf8',
  });
  if (r.status !== 0) {
    erreurs++;
    console.error(`ERREUR  ${f}\n${r.stderr}`);
  }
}
console.log(`${fichiers.length} fichiers analysés, ${erreurs} erreur(s).`);
process.exit(erreurs ? 1 : 0);
