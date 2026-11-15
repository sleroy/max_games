# Modules du jeu de pêche — contrats et propriété

> Dernière mise à jour : **2026-11-15** · jeu **v180** (le fond se juge sous le bouchon : `verdictFond`)
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
| `script.js` | Orchestrateur : scène 3D, câblage, pont `etat`, API de test | ~2 990 | **Personne en parallèle** — à réduire |
| `environnement.js` | Étang : centre, rayon (90), contour, relief et 3 fosses, profondeur max, surface (ha), maillages du fond, de l'eau (`makeWaterGeometry`) et de la rive (`makeShoreGeometry`), **verdict du fond** (`verdictFond`, `MARGE_VASE`) | 298 | Monde (à faire seul) |
| `poissons.js` | Population calculée d'après la surface et la biomasse (≈ 58 poissons, 100–300 kg/ha, solitaires rares, poissons de fond en fosse), fabrique 3D, bancs, spécimens hors norme, respawn | 773 | Poissons / contenu |
| `combat.js` | Épreuve de force : tension, fatigue, ferrage, touche vue de près, clic utile, accrochage (état via `etat`) | 696 | Combat |
| `comportement.js` | Comportement des poissons : vue, zone de vie, banc, vitesse, humeur, morsure et nage, verdict du fond sous le bouchon (`jugerFond`) (état via `etat`) | 633 | Poissons / contenu |
| `bateau.js` | Mode bateau : barque (modèle, textures), rame, pad tactile, embarquement, collision avec les obstacles, poste sur le ponton (état via `etat`) | 565 | Bateau / monde |
| `lancerPoisson.js` | Lancer du poisson dans la bourriche : prise en main, lancer, arc de vol (état via `etat`) | 206 | Bourriche / lancer |
| `carnetUI.js` | Onglets du carnet (Prises / Boutique / Touches / Options) et carte de l’étang à l'échelle du cadre (état via `etat`) | 159 | Carnet / UI |
| `boutique.js` | Expérience (XP) et boutique de bouchons : gains, achats, rendu (état via `etat`) | 264 | Boutique / progression |
| `fiches.js` | Onglet Espèces : fiche par poisson (silhouette, zone de vie, comportement) (état via `etat`) | 124 | Carnet / UI |
| `lancerCanne.js` | Lancer de la canne au dosage (jauge) et animation du geste de lancer (état via `etat`) | 182 | Lancer |
| `lancer.js` | **Geste de lancer commun** (amorce et sonar) : visée, jauge de puissance, point d’impact, arc de vol, arrivée. Les objets lançables s’enregistrent dans `etat.projectiles` (`etat.declarerProjectile`) | 243 | Lancer / outils |
| `amorcage.js` | Amorçage : boule d’amorce (stock, plouf, nuage de miettes qui attire les poissons), bras du pêcheur et barre d’outils (état via `etat`) | 205 | Amorçage / outils |
| `frein.js` | Frein du moulinet (on lâche du fil quand le poisson charge) et didacticiel (état via `etat`) | 132 | Frein / tutoriel |
| `ligne.js` | Ligne + flotteur : tampon de la ligne, groupe du bouchon, textures, opacité, bornes de profondeur, **coupe de l'eau** (schéma de profondeur, `majCoupeProfondeur`) (état via `etat`) | 180 | Ligne / bouchon |
| `bouchons.js` | Types de bouchons (flotteurs), scions du quiver, capacités spéciales (état via `etat`) | 188 | Bouchons / boutique |
| `placement.js` | Carte de placement vue de dessus (écran d’accueil, terrain de 260 unités) et hauteur du terrain (état via `etat`) | 403 | Monde / placement |
| `meteo.js` | Météo : beau temps → rafales → pluie, piloté par le temps de jeu (état via `etat`) | 110 | Météo / ambiance |
| `vie.js` | Vie ambiante (oiseaux, libellules, poisson qui saute) et bulles sous l’eau (état via `etat`) | 171 | Ambiance / faune |
| `sonar.js` | Sonar : bouée **lancée comme une amorce** (via `lancer.js`), radar, ondes jaunes, achats (sonar, barque), rangement (état via `etat`) | 233 | Sonar / boutique |
| `stocks.js` | Stocks : lignes de rechange, fils, amorce de départ, achat de recharges (état via `etat`) | 104 | Boutique / stocks |
| `journal.js` | Carnet de pêche : chargement/sauvegarde, rendu, ajout d’une prise (état via `etat`) | 112 | Carnet / persistance |
| `touches.js` | Catalogue des touches : durées, mouvements du bouchon, tirage vrai/faux (état via `etat`) | 165 | Touches / contenu |
| `cycleLigne.js` | Cycle de la ligne : visée sur l’eau, lancer, remontée, touche détectée, fin du lancer (état via `etat`) | 197 | Lancer / ligne |
| `accrochage.js` | Accrochage dans les nénuphars, la vase et les obstacles : détection, accroc, dégagement du fil (état via `etat`) | 226 | Combat / accroc |
| `ambiance.js` | Ambiance : vent, faune sonore, nuages, ondulation de la queue des poissons (état via `etat`) | 95 | Ambiance / effets |
| `entrees.js` | Entrées : pointeur, clavier et boutons de l’écran de jeu (état via `etat`) | 225 | Entrées / UI |
| `cheat.js` | Cheat : mot secret « poisson » (+50 XP) (état via `etat`) | 123 | Cheat / tests |
| `boucle.js` | Boucle d’animation : une image du jeu, ragondin, pause, horloge (état via `etat`) | 212 | Boucle / rendu |
| `partie.js` | Partie : lignes (vies), remontée trop rapide, classement, fin de partie, accueil (état via `etat`) | 465 | Partie / règles |
| `pecheur.js` | Pêcheur, canne et geste de lancer : modèle 3D, poses, charge et fouetté (état via `etat`) | 252 | Pêcheur / canne |
| `rendu.js` | Rendu : renderer WebGL, tone mapping, post-traitement (bloom + vignette) (état via `etat`) | 193 | Rendu / graphismes |
| `messages.js` | Messages 3D flottants + anneaux de touche ratée | 126 | UI / feedback |
| `bourriche.js` | Bourriche (panier) : maillage et compte | 66 | Bourriche |
| `ondulations.js` | Ondulations de surface (`spawnRipple`) | ~60 | Eau / effets |
| `splashes.js` | Éclaboussures (ferrage, amorce) | ~50 | Effets |
| `sound.js` | Moteur audio (samples + synthèse) | 798 | Audio |
| `portraits.js` | Portraits 2D des espèces (fond transparent) | 282 | Combat / UI |
| `demelage.js` | Mini-jeu de démêlage | 281 | Lancer |
| `especes.js` | **Données** espèces, comportements, styles, touches | 228 | Contenu (ajout d'espèces) |
| `obstacles.js` | Obstacles aquatiques (§14.2) : ponton (aussi poste de pêche), écluse, douve, roches, souches, pieux, épave, îlots de joncs. Placement déterministe (sans `rand()`), rendu 3D généré en code, accrochage (`ACCROCHAGES`), attraction d'espèces (`attirer`), collision barque (`heurtBarque`) et lancer (`lancerBloque`). Plafond 800 | 671 | Monde / obstacles |
| `decor.js` | Décor fixe : 64 arbres, 70 roseaux, 24 rochers, 40 nénuphars (expose aussi leurs positions à `obstacles.js`) | 220 | Monde / décor |
| `classement.js` | Classement local | 111 | UI / persistance |
| `quiver.js` | Indicateur de scion | 105 | Technique quiver |
| `carnet.js` | Persistance du carnet (localStorage) | 88 | Persistance |

**Somme ≈ 11 700 lignes**, dont **~73 % encore dans `script.js`**.

## 4. Découpage à faire (ordre = valeur pour le parallélisme)

Chaque ligne = un module futur, avec sa frontière. Deux agents peuvent prendre deux
lignes différentes **sans se rencontrer**.

| Module cible | Contenu à sortir de `script.js` | Bloc actuel (approx.) | Dépendances entrantes |
|---|---|---|---|
| `eau.js` | maillage + shader d'eau, reflet planaire, ondulations | 1124–1310 | moyen |
| `meteo.js` | jour/nuit, météo, vent, girouette | 751–790, 4951–5041 | moyen |
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
2. ~~`poissons.js`~~ — **fait (v143) pour la population** ; reste le **comportement**
   (déplacement, bancs, vision, zone de vie) à extraire dans `comportement.js`,
   prérequis des fonds (14.3) et de la densité (14.4).
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
- `script.js` dépasse son plafond courant (**ratchet** à 8 600 en v144 : il ne peut que baisser —
  le passer à la baisse à chaque extraction, ce qui empêche de regonfler le fichier) ;
- un module importe `script.js` (cycle) ;
- un module du dossier n'est pas listé dans ce document ;
- un module exporte quelque chose sans le documenter ici (tableau §3).

## 7. Packaging de production (plus tard)

Le développement reste **sans build** (modules ES natifs + `importmap`). Un
`esbuild` optionnel produira un `dist/` minifié + hash pour GitHub Pages, sans
jamais devenir une dépendance pour développer ou tester.


## 8. État au 2026-11-15 (v144) — historique du blocage (RÉSOLU)

> ⚠️ Sections 8.1 à 8.5 = **journal de la passe v144**, quand le découpage était
> bloqué. Elles sont conservées pour la traçabilité (les 5 règles restent
> valables). **L'état réel et final est en §8.6** (passes v145 → v172).

**Fait** : `decor.js`, `environnement.js`, `poissons.js`, `bourriche.js`,
`ondulations.js`, `messages.js`, `splashes.js`, `meteo.js`*(voir note)*.
`script.js` est passé de **9 581 à ~8 550 lignes**.

### 8.1 Pourquoi les modules suivants ne peuvent pas être extraits tels quels

Un module reçoit ses dépendances **par valeur** au moment de sa création. Or les
blocs restants **modifient des `let` de `script.js`** (`tension`, `floatState`,
`castSwing`, `experiencePartie`…). Un module n'en aurait qu'une copie morte, et
l'affectation lèverait même une erreur (« assignment to constant »). L'extracteur
refuse donc ces blocs — c'est volontaire.

Variables d'état à déplacer, par module (mesuré automatiquement) :

| Module restant | Variables mutées (état partagé) |
|---|---|
| `bateau.js` | `rodBend`, `castSwing`, `castYawAngler`, `castYawRod`, `anglerYawBase`, `rodYawBase`, `posteActuel`, `emplacementLibre` |
| `boutique.js` | `flotteurChoix`, `experiencePartie` |
| `fiches.js` | `especeIndex`, `DIFFICULTY`, `tangleChance`, `BITE_WINDOW` |
| `lancerPoisson.js` | `floatState`, `heldFish`, `fishThrowState`, `fishThrowPower`, `fishThrowTarget`, `fishThrowPhase`, `fishThrowT`, `bourricheCount` |
| `lancerCanne.js` | `castSwing`, `castYawAngler`, `castYawRod` |
| `frein.js` | `techniqueCourante` |
| `combat.js` | `portraitEspeceCourante`, `avantageFerrage`, `cameraMode`, `floatState`, `fishCaught`, `waitTimer`, `biteFish`, `biteCooldown`, … (≈ 15) |
| `comportement.js` | `floatState`, `castT`, `waitTimer`, `reelIdle`, `hameconDansLaVase`, `depuisLancement`, `biteCooldown`, `baitInterest`, … (≈ 12) |
| `amorcage.js` | `amorceDepartRestante` |
| `carnetUI.js` | `especeIndex`, `partieStats`, … |

### 8.2 Le déblocage : `etat.js` (prochaine étape, dans cet ordre)

1. **Créer `etat.js`** : un objet **mutable partagé**, une seule source de vérité.

   ```js
   export const etat = {
       tension: 0, struggle: 0, floatState: 'idle', castT: 0,
       castSwing: 0, castYawAngler: 0, castYawRod: 0, techniqueCourante: 'bouchon',
       experiencePartie: 0, flotteurChoix: null, especeIndex: 0,
       // … une ligne par variable du tableau ci-dessus
   };
   ```

2. **Renommer** ces variables dans `script.js` : `tension` → `etat.tension`
   (remplacement par mot entier, **jamais** dans les chaînes de caractères), et
   supprimer les `let` correspondantes.
3. **Les modules importent `etat.js`** (`import { etat } from './etat.js'`) : c'est
   la seule exception au « pas de globales », et elle est explicite et testable.
4. **Garde-fou à ajouter** dans `scenario-modules.mjs` : `etat.js` est le seul
   module autorisé à être importé par plusieurs ; aucun module ne crée son propre
   état dupliqué.
5. **Un module par livraison**, tests verts à chaque fois.

> Prérequis indispensable : `combat.js` et `comportement.js` (les deux plus gros
> blocs restants, ~670 et ~580 lignes) ne peuvent PAS être extraits avant `etat.js`.

### 8.3 Note sur `meteo.js` / `vie.js`

Extraits puis **annulés** : ces blocs déclarent en leur sein des `let` lues plus
loin dans `script.js` (`weatherRafales`, `modeBrouillard`…). Ils rentreront dans
l'ordre après `etat.js`, comme les autres.

### 8.4 Nouveauté de l'outillage

- `tests/../extract.py` (hors dépôt, réutilisable) : extraction mécanique
  (bloc verbatim → module + injection + destructuring), **refuse** les blocs qui
  mutent une dépendance, et signale les dépendances déclarées après le bloc
  (risque d'accès avant initialisation).
- Le harnais réécrit désormais l'import `three` de **tout** module copié
  (liste découverte, plus figée).

### 8.5 Ce que l'essai sur `combat.js` a appris (à faire dans la prochaine passe)

`etat.js` (v144) fonctionne : le pont d'accesseurs permet à un module de modifier
la vraie variable de `script.js` **sans renommer une seule ligne existante**. Les
trois règles suivantes manquent encore à l'outil d'extraction ; elles ont été
identifiées en essayant `combat.js` (≈ 750 lignes, le plus gros bloc restant) :

1. **Chaînes de caractères** : un remplacement global `struggle` → `etat.struggle`
   a corrompu le littéral `'struggle'` (état du bouchon). Le remplacement doit
   être fait **hors des chaînes** (`'…'`, `"…"`, `` `…` ``). *Corrigé dans
   l'outil.*
2. **Propriétés et clés** : ne jamais remplacer `obj.tension` ni `tension:`
   (sinon `obj.etat.tension` / clé invalide). *Corrigé (lookbehind + lookahead).*
3. **Variables déclarées DANS le bloc et affectées ailleurs** : `recordBattu`,
   `snag`, `catchMessageTimer` (combat) vivaient dans le bloc. Après extraction,
   `script.js` les reçoit par destructuring (`const`) alors que d'autres fonctions
   lui **assignent** une valeur → `TypeError: Assignment to constant variable`.
   Règle à appliquer : ces variables **restent des `let` de `script.js`**, sont
   retirées de la liste exportée, et le module y accède par `etat.NOM`.
4. **Fonctions fournies par un autre module** (`spawnRipple`, `spawnSplash`,
   `spawnFloatingText`, `signalerToucheRatee`) : elles sont déclarées **après** le
   bloc, donc illisibles à la création → elles doivent aussi passer par le pont
   `etat`. Le générateur de pont doit scanner **tous** les `etat.X` réellement
   utilisés par les modules et créer les accesseurs manquants (fait dans
   `bridge.py`, pas encore dans l'extracteur).

5. **État dédoublé (la règle qui manquait encore)** : une variable *déclarée dans
   le bloc* et **lue** ailleurs (`floatState`, `snag`, `biteFish`…) ne doit pas
   être exportée sous forme de valeur — sinon le module modifie sa copie et
   `script.js` garde la sienne. Seules les **fonctions** du bloc sont exportables ;
   toute `let`/`const`/`var` du bloc utilisée à l'extérieur doit rester un `let`
   de `script.js` et passer par `etat`. Test de contrôle : après extraction, un
   lancer doit produire `floatState === 'inWater'` ; si l'on obtient `'idle'`,
   c'est exactement ce symptôme.

Avec ces cinq règles, `combat.js` puis `comportement.js` (~580 l.) passent.
Les modules restants ensuite : `bateau`, `boutique`, `fiches`, `lancerPoisson`,
`lancerCanne`, `frein`, `amorcage`, `carnetUI`, `ligne`, `bouchons`, `meteo`,
`vie`, `carte_etang`.

**Méthode de travail validée** : extraire → lancer la suite complète (1 662
vérifications) → si rouge, `git checkout -- .` et supprimer le module ; jamais
laisser un module à moitié branché.


## 8.6 Rapport de fin de passe (v145 → v172)

**Modules extraits (lignes)** : `combat` 696, `comportement` 607, `bateau` 517,
`partie` 464, `placement` 398, `amorcage` 363, `boutique` 263, `pecheur` 251,
`entrees` 224, `boucle` 211, `lancerPoisson` 205, `sonar` 198, `cycleLigne` 196,
`rendu` 192, `bouchons` 187, `accrochage` 187, `lancerCanne` 181, `vie` 170,
`touches` 164, `carnetUI` 156, `ligne` 139, `frein` 131, `cheat` 122, `fiches` 123,
`journal` 111, `meteo` 109, `stocks` 103, `ambiance` 94. Tous ≤ 800 lignes.
`script.js` : **8 651 → ~3 020 lignes**. Suite : 1 662 → 1 829 vérifications, toujours vertes ;
test réel dans Chromium (lancer → `inWater`, touche, ferrage, combat) sans erreur JS.

**Ce qui reste dans `script.js`** (volontairement ou pas encore) :
- scène, caméra, ciel, lumières, jour/nuit, IBL, qualité auto (≈ 400 l.), eau et reflet
  planaire (≈ 450 l., `eau.js` à faire), vent/girouette (≈ 50 l.) ;
- les déclarations `let X;` des variables partagées (règle 5), le pont `etat`
  (≈ 215 lignes générées par `bridge.py`) et `window.__game` (≈ 680 l., API de test :
  les modules n'ont pas le droit de la porter) ;
- le bloc « EMPLACEMENTS AUTOUR DE L'ÉTANG » (données `POSTES`, `POSTE_*`).

**Pièges rencontrés (à ajouter aux 5 règles)**
6. **Dépendance `let` copiée par valeur.** La cause réelle de l'échec de `combat.js`
   (`floatState` restait `'idle'`) : `snag` est un `let` de `script.js` que le bloc ne
   modifie pas, donc passé par valeur au `creerCombat` et figé à `null`. Règle : toute
   dépendance déclarée `let`/`var`, ou `const` définie après le bloc, passe par `etat`.
7. **Pont `etat` avant les créations.** Les modules écrivent dans `etat` dès leur
   création (`etat.bateauGroupe = …`). Le pont est donc placé juste après les imports
   (fermetures : une variable déclarée plus bas n'est lue qu'à l'appel).
8. **Initialisation d'une variable du bloc.** `let x = init` d'une variable lue ailleurs
   devient `let x;` dans `script.js` et `etat.x = init` dans le module, à la même place :
   l'init peut appeler une fonction du bloc (`makeBobberTexture`), hissée dans le module.
9. **Fonction du bloc appelée par un module créé avant.** `ligne.js` reçoit
   `flotteurCourant`, désormais définie dans `bouchons.js` (plus bas) : accès avant
   initialisation. L'extracteur passe alors un appel paresseux
   (`f: (...args) => f(...args)`) aux modules déjà créés.
10. **Statement qui crée un autre module dans le bloc** (`const { ripples… } =
    creerOndulations(…)`) : il reste dans `script.js` ; le bloc se termine juste avant
    (marqueur de fin sur plusieurs lignes).
11. **Offsets UTF-16.** acorn compte en unités UTF-16, Python en points de code : un
    emoji (🏆) décale tous les retraits suivants. Les découpages se font sur l'UTF-16.
12. **Tests statiques** : `script.includes(...)` ne voit plus le code déplacé. Les
    contrôles lisent `code` (script + modules) ; les assertions négatives aussi, sinon
    elles deviennent vides. Les modules déclarés dans `MODULES` de `scenario-static.mjs`
    sont donc la source à tenir à jour.
13. **Outillage** : analyse par acorn (portées réelles, pas de regex sur le code) :
    `extract2.py`, `route.mjs`, `toplevel.mjs`, `bridge.py`, `freevars.mjs` (détecte les
    identifiants jamais déclarés, cause des `ReferenceError`). Le scan du pont ne doit
    lire que les modules qui importent `etat.js` (`demelage`, `quiver` ont un `etat` local).


## 9. Grand étang (v173) — ce qui change pour les modules

Demande du joueur : « étang moyen + zones profondes » (`idées.md` §14.1 et §14.4).

- **`environnement.js`** : `POND_RADIUS` 55 → **90** (contour de 71 à 104, borne `RAYON_ETANG_MAX` 109,8),
  `POND_CENTER` (0, 0, **-71**) pour que la rive sud (poste de départ) ne bouge pas ;
  trois `FOSSES` (rayon 16 à 22, profondeur max **8,14** ≈ 4 m), `PROFONDEUR_MAX`, `SURFACE_HA` (0,64 ha),
  `RAYON_CADRE_CARTE`. Les maillages de l'eau (40 × 128) et de la rive (rayon 430) y sont aussi.
  Le shader d'eau ne contient plus aucune constante de l'étang : il lit `aDepth`.
- **`bouchons.js` / `especes.js`** : la ligne descend jusqu'à **9,0** (4,5 m) au lieu de 7,0, pour atteindre le fond des fosses.
- **`poissons.js`** : population = `round(surface × 90 poissons/ha)` = 58 ; `FISH_COUNT` (64) n'est plus
  qu'un plafond. La composition est planifiée avant de fabriquer les poissons (≥ 10 espèces, 1 silure max,
  2 de chaque autre solitaire), la biomasse est contrôlée (100–300 kg/ha). Silure, anguille et sandre
  naissent dans les fosses.
- **`script.js`** : brume 150 → 480, ciel 520, caméra `far` 900, ombres qui suivent le pêcheur
  (`suivreOmbres`), disque du soleil relatif à la caméra. Plafond de lignes abaissé (3 030 → 2 995).
- **`placement.js`** : terrain de la carte 170 → 260 unités, caméra reculée ×1,7.
- **`bateau.js`** : les bornes de rame se calculent au rayon de l'angle d'**arrivée** (bug révélé par l'étang plus grand).
- Tests : `tests/scenario-grand-etang.mjs` (rayon, fosses, barque, sonar, cartes, population, densité).


## 10. Obstacles aquatiques (v174 → v178) — ce qui change pour les modules

Demande du joueur : `idées.md` §14.2 (ponton, écluse, douve, roches, arbres immergés, pieux, épave, joncs).

- **`obstacles.js`** (nouveau, 671 lignes, plafond 800) : 12 obstacles de 8 types. Données (`TYPES`,
  `ACCROCHAGES`, `SPECS`), placement, dessin et requêtes de jeu (`accrocheEn`, `lancerBloque`,
  `heurtBarque`, `attirer`, `pontonPoste`). Créé dans `script.js` après les postes de berge et avant la
  barque et les poissons. **Il ne consomme jamais `rand()`** : angles fixes + première place libre
  (postes de berge, bourriche, départ, fosses, nénuphars, arbres, rochers et roseaux du décor évités),
  détails par un LCG local. Aucune texture téléchargée (canvas 64 px + géométrie).
- **`decor.js`** : retourne aussi `arbres`, `rochers`, `roseaux` (simples copies, aucun tirage de plus).
- **`accrochage.js`** : `isSnagged(point)` renvoie `true` (nénuphar) ou l'obstacle ; `startSnag(obstacle)` lit son
  profil (difficulté, message). `etat.snag.rythme` remplace `dansLaVase` pour décider du rythme à tenir.
- **`comportement.js`** : passe l'obstacle à `startSnag`.
- **`poissons.js`** : appelle `obstacles.attirer(fishes)` après le peuplement, dans `repeuplerEtang()` et pour
  un poisson de remplacement (déplace `homeX/homeZ` et la position du poisson ou du banc sur l'obstacle).
- **`bateau.js`** : `deplacerBateau` refuse le coup de rame qui amène la coque (rayon 1,5) sur un ouvrage et le
  réduit à 40 % dans les joncs ; `placerALAngle` pose le pêcheur sur le ponton quand l'angle choisi est sur
  son axe (marge −10,5, y 0,67, girouette rangée).
- **`cycleLigne.js`** : `startCast` refuse un lancer qui retombe sur un ponton, une écluse ou des roches.
- **`placement.js`** : un repère coloré par obstacle sur la carte d'accueil (le ponton est cliquable).
- **`script.js`** : +6 lignes de câblage, ratchet 2995 → 3001 ; `window.__game.obstacles` pour les tests.
- Tests : `tests/scenario-obstacles.mjs` (placement, accrochage, attraction, collision, ponton).


## 11. Le sonar se lance comme une amorce (v179) — ce qui change pour les modules

Demande du joueur : `idées.md` §14.7. Avant, un clic sur 📡 **téléportait** la bouée à une position calculée
et faisait pinger tout de suite.

- **`lancer.js`** (nouveau, 243 lignes) : le **geste de lancer commun** (clic = visée, maintien = jauge de
  puissance, relâchement = arc de vol, arrivée). Il porte `setFeedMode(on, type)`, `startFeedCharge`,
  `moveFeedAim`, `releaseFeed`, `cancelFeed`, `updateFeed` ; l'état du geste reste `etat.feed*`.
  Chaque objet lançable s'enregistre avec `etat.declarerProjectile(nom, définition)` ; le projectile armé est
  `etat.feedType` (`'amorce'` | `'sonar'`, propriété de module, non reliée à `script.js`).
  Définition : `refus()`, `verifier(point)` (impact refusé), `consommer()`, `dansEau(point)`,
  `atterrir(point, dansEau)` (effets + message), `majMode(arme)` (boutons), `couleur`, `ventFacteur`,
  `resterDansEtang`, `verbe`, `messageArme`, `messageVol`.
- **`amorcage.js`** (364 → 205 lignes) : ne garde que la boule d'amorce (enregistrée comme projectile `'amorce'`),
  le nuage de miettes, le bras du pêcheur et la barre d'outils.
- **`sonar.js`** : enregistre le projectile `'sonar'` (jaune, vent ×2,5 comme la ligne, **ne reste pas dans
  l'étang**). `verifier` refuse un impact sur un ouvrage qui bloque le lancer (même règle que
  `cycleLigne.startCast`) ; `atterrir` pose la bouée **au point d'impact réel** (plouf, éclaboussure, ondulation,
  radar, premier scan) ou, hors de l'eau (rayon du contour − 1,5), annonce « tombée sur la berge » sans ping.
  Le clic sur 📡 arme la visée (mêmes règles d'accès que l'amorce, plus `cameraMode === 'normal'`), annule la
  visée si elle est déjà armée, ou range la bouée posée (immédiat). Plus de `sonarDernierPing = -Infinity` au clic.
- **`stocks.js`**, **`entrees.js`** : le bouton Amorce ne se croit plus « prêt » pendant la visée du sonar ;
  il bascule sur l'amorce si on le presse pendant la visée du sonar.
- **`script.js`** : +1 import, `creerLancer` appelé avant `creerAmorcage`, `setFeedMode` et `obstacles` passés à
  `creerSonar`. 3000 → 2998 lignes, ratchet 3001 → 2999.
- Tests : `scenario-sonar.mjs` (71 et 71b : puissance, direction, ping après le plouf, centre du radar, refus en
  combat / accrochage / emmêlement / vol, barque, ouvrages, berge, Ranger), `lancerSonar()` dans `harness.mjs`.


## 12. Le fond se juge sous le bouchon (v180) — ce qui change pour les modules

Demande du joueur : `idées.md` §14.8 (bug : le verdict « hameçon dans la vase » était calculé une fois avec le point
visé, puis jamais recalculé après la dérive au vent ; le schéma de coupe, lui, lisait la position du bouchon et
n'alertait qu'à 0,25 du fond au lieu de 0,5).

- **`environnement.js`** : `verdictFond(x, z, profondeurLigne, auFond)` est la **source unique** (`dansLaVase` = ligne
  plus longue que `profondeur − MARGE_VASE`, marge 0,5 ; jamais au quiver). La profondeur de la ligne reste une
  **longueur bouchon → hameçon** (`HOOK_DEPTH = −profondeurLigne`), jamais une altitude.
- **`comportement.js`** : `jugerFond()` appelle `verdictFond` à la position du bouchon, à l'atterrissage puis à chaque
  image tant que le bouchon flotte (`inWater`) : le verdict suit la dérive. `startSnag('fond')` ne part qu'à la
  **transition** « pas dans la vase → dans la vase », jamais en combat, accrochage, emmêlement, touche ni poisson ferré.
  À l'accrochage, `castTarget` est ramené sous le bouchon (le bouchon est tenu là où il est). Un bouchon qui
  retrouve de l'eau profonde se redresse.
- **`ligne.js`** : héberge `majCoupeProfondeur` (sortie de `script.js`, 2999 → 2970 lignes) ; elle appelle
  `verdictFond` sous le bouchon. Avant l'arrivée (repos, vol), le schéma montre le point visé : un aperçu, aucune
  décision. Accroché dans la vase, l'alerte suit la décision du jeu (pas de clignotement).
- **`script.js`** : éléments du schéma passés à `creerLigne({ coupe })`, `poserHameconAuFond()` sans argument (sous le
  bouchon), `window.__game` : `getVerdictFond`, `castTarget`, `setWind`, `etat`. Ratchet 2999 → 2971.
- Tests : `scenario-fond.mjs` (74) ; `scenario-profondeur.mjs` adapté (indice « Fond à » avec majuscule dans la vase,
  règle de 0,5 partagée par le schéma et le jeu).
