# Modules du jeu de pêche — contrats et propriété

> Dernière mise à jour : **2026-11-15** · jeu **v142**
> Objectif : permettre à **plusieurs agents de travailler en parallèle** sans se
> marcher dessus, en gardant des fichiers petits (coût de modification faible).

## 1. Pourquoi ce document

`script.js` a longtemps porté tout le jeu (**9 581 lignes**, ramené à ~9 300 en v142). Toute modification
obligeait à ouvrir ce fichier : deux agents qui travaillent en même temps finissent
donc par éditer le même fichier, et leurs changements se mélangent (c'est arrivé :
des fichiers « en vol » ont été avalés par le commit d'un autre agent).

Règle de base : **un agent = un fichier**. Ce tableau dit qui possède quoi.

## 2. Contrat d'un module

Un module du jeu respecte ces règles (vérifiées par `tests/scenario-modules.mjs`) :

1. **Pas d'accès aux globales de `script.js`.** Tout ce dont le module a besoin
   arrive par un objet `deps` (injection de dépendances), comme le font déjà
   `demelage.js`, `quiver.js` et `decor.js`.
2. **Pas de dépendance à `window` / au DOM global.** Si un module a besoin d'un
   élément, on lui passe l'élément (ou une fonction qui le rend).
3. **Aucun module n'importe `script.js`** (pas de cycle). `script.js` est la racine.
4. **Une seule responsabilité par module**, et une API explicite :
   - `export function creerXxx(deps) { ... return { ... }; }` pour un système ;
   - `export const DONNEES` / `export function utilitaire(...)` pour des données ou
     des fonctions pures.
5. **Plafond de lignes** : **800 max** par module (hors commentaires d'en-tête).
6. **Version de cache** : l'import porte `?v=N` (`./decor.js?v=141`). Le test
   statique existe déjà pour `sound.js` (même version que `index.html`) ; on
   incrémente toutes les versions à la livraison.
7. **Un scénario de test** propre au module dès qu'il contient de la logique
   (`tests/scenario-<module>.mjs`). Le `decor.js` est couvert indirectement
   (nénuphars, accrochages, carte) et par le test statique.

## 3. État actuel (v141)

| Module | Rôle | Lignes | Propriétaire / à qui le modifier |
|---|---|---|---|
| `script.js` | Orchestrateur : scène 3D, boucle, entrées, câblage | ~9 300 | **Personne en parallèle** — à réduire |
| `environnement.js` | Étang : centre, contour, relief/fosses, profondeur, fond 3D | 151 | Monde (à faire seul) |
| `sound.js` | Moteur audio (samples + synthèse) | 798 | Audio |
| `portraits.js` | Portraits 2D des espèces (fond transparent) | 282 | Combat / UI |
| `demelage.js` | Mini-jeu de démêlage | 281 | Lancer |
| `especes.js` | **Données** espèces, comportements, styles, touches | 228 | Contenu (ajout d'espèces) |
| `decor.js` | Décor fixe : arbres, roseaux, rochers, nénuphars | 206 | Monde / décor |
| `classement.js` | Classement local | 111 | UI / persistance |
| `quiver.js` | Indicateur de scion | 105 | Technique quiver |
| `carnet.js` | Persistance du carnet (localStorage) | 88 | Persistance |

**Somme ≈ 11 500 lignes**, dont **~80 % encore dans `script.js`**.

## 4. Découpage à faire (ordre = valeur pour le parallélisme)

Chaque ligne = un module futur, avec sa frontière. Deux agents peuvent prendre deux
lignes différentes **sans se rencontrer**.

| Module cible | Contenu à sortir de `script.js` | Bloc actuel (approx.) | Dépendances entrantes |
|---|---|---|---|
| `eau.js` | maillage + shader d'eau, reflet planaire, ondulations | 1124–1310 | moyen |
| `meteo.js` | jour/nuit, météo, vent, girouette | 751–790, 4951–5041 | moyen |
| `poissons.js` | peuplement, déplacement, bancs, vision, zone de vie, spécimens | 5194–5762, 7275–7853 | moyen |
| `combat.js` | épreuve de force, frein, accrochages | 6176–7013 | moyen |
| `pecheur.js` | pêcheur, canne, geste de lancer | 1652–1884 | faible |
| `ligne.js` | fil, bouchon, profondeur, flotteurs achetables | 1956–2304 | faible |
| `amorcage.js` | boules d'amorce et attraction | 2305–2651 | faible |
| `bourriche.js` | bourriche et lancer du poisson | 2652–2695, 4486–4668 | faible |
| `bateau.js` | barque : modèle, textures, déplacement, pad | 2740–3231 | faible |
| `placement.js` | postes autour de l'étang + carte 3D de placement | 2696–2739, 3232–3608 | moyen |
| `carnetUI.js` | onglets, fiches espèces, carte du carnet | 3609–3976, 4217–4485 | faible |
| `boutique.js` | XP, achats, rendu boutique | 3977–4216 | faible |
| `ambiance.js` | faune, bulles, splashes, ondulations, messages 3D | 5042–5193, 7014–7274 | faible |

**Ordre recommandé** (le plus gros gain d'abord, mais un module par livraison) :

1. ~~`environnement.js`~~ — **fait (v142)** : indispensable avant d'agrandir l'étang (14.1).
2. `poissons.js` — cœur du jeu, et prérequis des fonds (14.3) et de la densité (14.4).
3. `combat.js` — prérequis de l'épuisette et du frein (15.3).
4. `pecheur.js`, `ligne.js`, `amorcage.js`, `bourriche.js` (petits, sûrs).
5. `meteo.js`, `ambiance.js`, `placement.js`, `carnetUI.js`, `boutique.js`.
6. `bateau.js` — quand les obstacles (14.2) arriveront, puisque la barque les touchera.

## 5. Comment deux agents travaillent en parallèle (sans se marcher dessus)

1. **Un worktree par agent** : `~/git/wt/<numéro>-<slug>` — jamais le checkout
   principal (règle déjà en place, voir `AGENTS.md` du dépôt).
2. **Une branche par agent**, un PR par agent.
3. **Fichier possédé** : chaque agent ne modifie que les fichiers de sa ligne du
   tableau. Si `script.js` doit changer, la modification est **minimale** : un
   import + un appel `creerXxx(deps)`.
4. **Ordre de fusion** : les extractions de modules d'abord (elles bougent beaucoup
   de code), les fonctionnalités ensuite. Une fonctionnalité ne se développe
   **jamais** dans `script.js` si son module existe.
5. **Conflit inévitable** : `script.js`, `index.html`, `style.css` et `run.mjs`.
   Le garder petit et l'annoncer avant de commencer.

## 6. Garde-fous automatiques

`tests/scenario-modules.mjs` échoue si :

- un module dépasse **800 lignes** ;
- `script.js` dépasse son plafond courant (**ratchet** à 9 320 en v142 : il ne peut que baisser —
  le passer à la baisse à chaque extraction, ce qui empêche de regonfler le fichier) ;
- un module importe `script.js` (cycle) ;
- un module du dossier n'est pas listé dans ce document ;
- un module exporte quelque chose sans le documenter ici (tableau §3).

## 7. Packaging de production (plus tard)

Le développement reste **sans build** (modules ES natifs + `importmap`). Un
`esbuild` optionnel produira un `dist/` minifié + hash pour GitHub Pages, sans
jamais devenir une dépendance pour développer ou tester.
