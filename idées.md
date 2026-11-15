# idées.md — Suivi des idées du jeu de pêche

> Dernière mise à jour : **2026-11-15** · version du jeu : **v185**
> Légende : `[x]` fait · `[~]` partiel / à compléter · `[ ]` à faire
> Chaque item terminé doit être couvert par un test dans `games/peche_game/tests/`.

## 1. Monde et emplacement

- [x] **Choisir son emplacement autour de l'étang avant de pêcher.**
  Carte 3D en relief + choix libre angle/distance (v93). Boutons Sud/Est/Nord/Ouest retirés de l'accueil (v126) ; `placerAuPoste()` reste pour les tests.
- [x] **Soleil positionné correctement (nord/sud) et luminosité selon le poste.**
  Soleil fixe au sud-ouest, `uSunDir` dans le shader, exposition par poste (v88–v92).
- [x] **Étang de forme générée en 3D, avec placement autour.**
  Contour par harmoniques, rive locale, profondeurs et carte du carnet (v92).

## 2. Lancer et ligne

- [x] **Lancer trop fort = ligne cassée.**
  Jauge au maximum (`castPower >= 0.995`) → `casserLigne('Lancer beaucoup trop fort')`.
- [x] **Lancer réaliste + timing + emmêlement + mini-jeu de démêlage.**
  - [x] Geste de canne réaliste (armé/fouetté, v96).
  - [x] Cliquer pendant le vol pour tendre la ligne avant que le bouchon touche l'eau (`tendreLigneAuLancer`, v104).
  - [x] Risque d'emmêlement si la ligne n'est pas tendue (32 %, module `demelage.js`).
  - [x] Message « ligne emmêlée » + obligation de résoudre (`floatState = 'tangle'`).
  - [x] Mini-jeu : suivre le serpentin au doigt, dans le bon sens, sans sortir du câble, dans un temps limité, en coloriant le fil (scénario 65).
- [x] **5 lignes maximum ; cassées / emmêlées non réparées = une ligne perdue ; 0 ligne = fin de partie.**
  - [x] 5 lignes, compteur, cassure par lancer trop fort / remontée trop rapide, fin de partie (v49–v52).
  - [x] Perte d'une ligne à l'échec / abandon / temps écoulé du mini-jeu d'emmêlement (scénario 65).

## 3. Accueil, nom et classement

- [x] **Accueil : Jouer ou consulter le classement local.**
- [x] **Nom du joueur saisi en fin de partie.**
- [x] **Classement local, 3 onglets : nombre de poissons, poids total, records par espèce.**
  Persisté dans `localStorage` (`peche_max_games_classement`), accessible en jeu (🏆).
- [x] **L'écran d'accueil doit être une vraie modale bloquante** (on ne doit pas pouvoir
  pêcher avec le lac en arrière-plan). Fond assombri + interceptions des clics (v104).

## 4. Vie du bord de l'eau

- [x] **Ragondin voleur, rare mais visible.**
  - [x] Apparaît près de la bourriche après 18–30 s de partie (puis 45–75 s),
    uniquement s'il y a un poisson à voler.
  - [x] Alerte popup 3D « 🐀 RAGONDIN ! » + bannière HUD + sons + message.
  - [x] 3 clics sur lui pour le chasser, sans jamais ferrer un poisson.
  - [x] S'il n'est pas chassé, il vole un poisson : **score et bourriche** diminuent.
  - [x] Test du cycle automatique timer → apparition → vol.
- [x] **Deux techniques de pêche : bouchon ou quiver.**
  - [x] Choix de la technique avant de jouer (bouchon / quiver), mémorisé dans le carnet.
  - [x] En quiver : pas de bouchon, touches lisibles sur le **scion** de la canne (indicateur 2D + canne 3D).
  - [x] Chaque type de touche a un mouvement/courbe/secousse différent sur le scion (catalogue de touches existant).
  - [x] Canne disposée différemment (pose quiver inclinée, scénario 66).

## 5. Combats et difficulté

- [x] **Remontée trop rapide : avertissement, puis risque croissant de casse.**
  Popup 3D « ⚠️ Trop vite ! » + avertissements cumulés (v101, scénario 49).
- [x] **Attaque de carnassier pendant la remontée.**
  Une petite proie (gardon, rotengle, ablette, goujon, carassin) peut être remplacée
  par un brochet/sandre/perche/black-bass qui passe près du bouchon ; combat avec
  avantage au poisson + popup 3D (v103, scénario 63).
- [x] **Poisson raté / ferrage trop tôt : le poisson s'éloigne et devient plus difficile.**
  Touches ratées, ronds rouges, `punishFish` (plus agressif/rapide), messages.

## 6. Lumière et météo

- [x] **Luminosité variable selon la position du soleil, le moment de la journée et le temps.**
  Cycle jour/nuit (soleil, ciel, eau, ambiances), exposition du poste, météo
  beau → rafales → pluie (ciel, pluie, ondulations, lumière, son).
- [x] **Vérifier visuellement l'absence de texte superposé / illisible** (HUD, petits
  écrans, modales). Captures v104 : accueil compact 480×320 (technique visible,
  carte 150 px), mini-jeu de démêlage, quiver (bouton Terminer sous la boussole).

## 7. Progression et XP

- [x] **L'XP doit revenir à zéro au début d'une pêche.**
  - [x] L'XP **carrière** (carnet/boutique) est persistante et ne doit pas être perdue :
    elle finance les bouchons achetés (décision v97, test « l'XP persiste »).
  - [x] **XP de partie** affichée (`⭐ … XP · … carrière`), remise à 0 à chaque JOUER
    tout en conservant l'XP carrière pour la boutique (scénario 64).

## 8. Audio et interface

- [x] **Utiliser des sons réalistes trouvés sur Internet.**
  - [x] Moteur audio procédural complet en secours.
  - [x] Éclaboussure réelle du domaine public + ambiance d'étang CC BY-SA 4.0
    (Wikimedia Commons), stockées dans `assets/sons/` et créditées.
  - [x] Chargement local avec **fallback procédural** si l'asset n'est pas décodé.
- [x] **Pas de texte superposé** : corrigé sur petits écrans en v100 (dock repliable,
  barre de stats, boussole sous la girouette). À revérifier après la modale d'accueil.

## 9. Architecture et contenu

- [x] **Découper `script.js` (trop gros).**
  - [x] Mini-jeu de démêlage extrait dans `demelage.js` (module autonome, scénario 65).
  - [x] Mode quiver extrait dans `quiver.js` (indicateur de scion, scénario 66).
  - [x] Données espèces / styles / silhouettes / touches extraites dans `especes.js`.
  - [x] Stockage et rendu du classement extraits dans `classement.js`.
  - [x] Persistance du carnet extraite dans `carnet.js`.
  - [x] L'orchestrateur 3D reste dans `script.js` ; modules spécialisés pour le reste.
- [x] **Vérifier la distribution des poissons et autoriser quelques spécimens hors norme.**
  - [x] Vérifier les tirages pondérés par abondance (`distributionAttendue`, scénario 64).
  - [x] Rares spécimens hors norme (taille/poids/combativité/agressivité), signalés
    au joueur et cohérents avec le carnet/records (scénario 64).

## 10. Fin de partie

- [x] **Bouton « Terminer la partie »** : saisir son nom, enregistrer, revenir à
  l'écran d'accueil. Fonctionne même avec des lignes restantes (scénario 64).
- [x] **Écran d'accueil modal bloquant** : fond assombri, aucun clic ne doit atteindre
  le lac tant que l'on n'a pas cliqué sur « Jouer » (scénario 64).

## Décisions et contraintes

- **XP** : conserver l'XP carrière (boutique, bouchons achetés) ; ajouter une XP de
  partie remise à zéro. Cela évite de casser la progression et les tests existants.
- **Sons** : le jeu doit rester 100 % statique et hors-ligne ; si des assets sont
  ajoutés, ils doivent être locaux, CC0 et crédités.
- **Tests** : le harnais est la source de vérité (`node games/peche_game/tests/run.mjs`).
  Toute nouvelle règle doit être déterministe ou pilotable par une API de test.
- **Cache** : bump de version à chaque livraison (`script.js?v=…`, `style.css?v=…`).

## Ordre de travail de cette passe

1. [x] Accueil modal + bouton « Terminer la partie » + XP de partie.
2. [x] Spécimens hors norme + vérification de distribution.
3. [x] Lancer : ligne tendue/emmêlement + mini-jeu de démêlage (module dédié).
4. [x] Mode quiver (indicateur de scion).
5. [~] Découpage complémentaire de `script.js`, sons et vérification visuelle.

## Scénarios de test ajoutés

- **64** : fin volontaire, accueil modal, XP de partie, distribution, spécimens hors norme.
- **65** : ligne tendue, emmêlement, mini-jeu de démêlage, abandon/temps écoulé.
- **66** : bouchon / quiver, scion, canne inclinée, ferrage, retour au bouchon.

## 11. Passe v126 — réalisme des poissons, quiver, sons, dépôt

- [x] **Quiver = pêche au FOND.** L'hameçon est posé juste au-dessus de la vase à l'endroit
  du lancer (`poserHameconAuFond`), profondeur non réglable, retour au réglage du bouchon
  en repassant en bouchon (scénario 67).
- [x] **Retirer les boutons Nord/Sud/Est/Ouest de l'accueil** (la carte 3D suffit).
- [x] **Sons** : 18 nouveaux sons libres (Wikimedia Commons + synthèse CC0) crédités dans
  `assets/CREDITS.txt`, branchés : fouet de canne, épuisette, poisson au sol, pièces
  (boutique), cloche (record), faune diurne (héron, martin-pêcheur, corneille, canard),
  ambiance nocturne (grenouilles, grillons).
  - [ ] À brancher plus tard : `playTonnerre` (orage), `playPas`, `playClic`, `playFilTendu`, `playSaut`.
- [x] **Vision réaliste** : portée par espèce, réduite la nuit (sauf nocturnes : sandre,
  silure, anguille, tanche) et sous la pluie, champ de vision ±120° (derrière lui : 2,2 unités).
- [x] **Poissons dans leur zone de pêche** : domaine propre à l'espèce ; l'appât hors du
  domaine n'intéresse pas ; rappel progressif + demi-tour franchement à 110 % ; test : ≥ 98 % du temps dedans.
- [x] **Caractéristiques par espèce** (`COMPORTEMENTS`, `especes.js`) : couche (surface /
  mi-eau / fond), taille de banc, cohésion, vitesse de croisière et de pointe, agilité de
  virage, humeur (errant / embuscade / fouille).
- [x] **Mouvements réalistes** : cap + virage limité, banc (cohésion, alignement), brochet
  et black-bass en embuscade (guet puis bond), tanche/carpe/brème qui fouillent le fond,
  espèces « de fond » qui suivent le relief.
- [x] **Licence MIT**, **CircleCI** (gratuit : plan Free + crédits open source), **skills**
  Kiro/Codex, **steering**, **hooks**, **AGENTS.md** enrichi.
- [x] **Boules d'amorce** : elles partent maintenant de la main du pêcheur (plus d'un point fixe).
- [x] **Croix de fermeture** (✕, en haut à droite, style Windows) pour le carnet et le classement.
- [x] **Tailles réalistes** (Wikipédia FR) : min = juvénile, max = grand sujet, pour les 16 espèces
  (`especes.js`) ; poids déduits (carpe max ≈ 26 kg, silure max ≈ 106 kg).
- [x] **Ragondin** : cris, rongement, éclaboussure à l'arrivée, **musique inquiétante** (bourdon,
  triton, battements de cœur) qui démarre à son arrivée et s'arrête quand il fuit ; sons synthétisés (Web Audio).
- [ ] **Bug** : problèmes d'affichage des bouchons (flotteurs) à investiguer : positions, taille, rendu selon la vue / la profondeur.
- [ ] **À faire** : supprimer le mécanisme de retour automatique de la ligne (le joueur ramène lui-même au moulinet).
- [~] **Captures d'écran dans le README** (voir `docs/screenshots/`).
- [ ] Idée : remplacer les 5 bruitages synthétisés par de vrais enregistrements.
- [ ] Idée : les poissons d'un banc remplacé à la capture rejoignent le banc d'origine.

## Scénario de test ajouté (v126)

- **67** : accueil sans boutons de poste, données de comportement, bancs, simulation de
  4 min (zone de vie, vitesse), quiver au fond.

## 12. Passe v128–v130

- [x] **Bug en ligne** : l'eau ne s'affichait pas (`uNormalsOn` non déclaré dans le shader d'eau) — corrigé + test.
- [x] **Quiver : choix du scion** au lieu du bouchon (souple, moyen, rigide offerts ; clochette,
  carbone, maître à acheter). Le **scion à clochette** sonne à chaque touche.
- [x] **Quiver : pas de widget de profondeur** (l'hameçon est au fond).
- [x] **Scion plus grand sur ordinateur** (360×120 px dès 900 px de large).
- [x] **Bouton rond « Amorcer » en bas à gauche.**
- [x] **Carnet / boutique façon inventaire Minecraft** : panneau gris biseauté, onglets, cases,
  sections (fils et amorce, bouchons, scions, matériel), onglet actif mis en avant.

## 13. Passe v131–v139 — livré

- [x] **Bouton rond « Amorcer » compact** dès que la ligne est à l'eau (v131).
- [x] **Sonar flottant** (150 XP en boutique) : radar de 12 m, **ping de sous-marin**
  synthétisé + **ondes jaunes** qui s'étendent à la surface (v137).
- [x] **XP de la partie dans la barre du haut** (score · lignes · XP), en plus du
  détail carnet « XP · carrière » (v135).
- [x] **Cheat « poisson »** : taper le mot secret offre +50 XP de partie (v136).
- [x] **Vrais sons de poisson qui saute** (Pixabay) + vrai « plouf » de l'amorce
  (LaSonotheque, CC0), crédités dans `assets/CREDITS.txt` (v133–v134).
- [x] **Remontée trop rapide** : le seuil dépend maintenant du **poids du poisson**
  et de la **résistance du fil** (v132).
- [x] **La manivelle seule ramène la ligne** (plus de clic sur l'eau, v131).
- [x] **Sortie de vase plus juste** (≈3 s de clics réguliers) et **ragondin qui ne
  gêne plus** le ferrage (v131).
- [x] **Tailles réalistes vérifiées** (Wikipédia FR) pour la perche (45 cm) et le
  black-bass (60 cm) (v130).
- [x] **MODE BATEAU** (v137) : **barque achetée 180 XP** en boutique, **mobile sur
  l'eau**, bouton **🚤 Bateau / 🐟 Rive** en bas à gauche, **flèches ou ZQSD** pour
  ramer (haut = vers le centre). Débarquement **exactement au poste de berge**
  d'origine ; impossible de ramer ou débarquer tant que la ligne n'est pas au repos.
  Depuis la barque, on atteint les **fosses du milieu** (silure, anguille, sandre).
- [x] **Barque texturée** (v137) : planches peintes écaillées, banc et avirons en
  bois. Textures **générées en code** (`CanvasTexture`), donc aucune image
  téléchargée et aucune licence tierce.
- [x] **Panneau d'épreuve de force allégé** (v138, demande joueur) : plus de légende
  « zone sûre », plus de longue phrase, plus de « avantage au poisson » — il reste
  le **portrait du poisson**, son **nom · poids**, la barre de tension, le chrono
  et le bouton « Lâcher du fil ».
- [x] **Portrait du poisson** pendant le combat (v138) : image **sur fond
  transparent**, dessinée en code à partir des données de l'espèce (silhouette,
  couleurs, motif, nageoires, moustaches du silure) — module `portraits.js`.
- [x] **Bug corrigé** : « 0,96 kg kg » (l'unité était écrite deux fois) (v138).
- [x] **Bug corrigé** : le sonar ne pingait plus une 2ᵉ fois après un long moment de
  jeu (deux horloges mélangées) (v138).
- [x] **Bug corrigé** : bouton **Amorce** et bouton **Bateau** superposés en bas à
  gauche — l'amorce monte au-dessus dès que la barque est débloquée (v139).
- [x] **Barque pilotable au DOIGT** (v140) : pad **◀ ▲ ▶** dans le pouce droit
  (tap = un pas, maintenir = ramer en continu), affiché seulement à bord et ligne
  au repos. Avant, la barque ne se pilotait qu'au clavier : impossible sur tablette.

## 14. À faire — demandes du 2026-11-15

### 14.1 Étang trop petit → étang moyen avec zones profondes — LIVRÉ v173

- [x] **Agrandir l'étang** : rayon nominal **55 → 90** unités (contour 71–104,
  ≈ 0,64 ha au lieu de 0,23 ha). Centre déplacé de (0, −40) à (0, −71) pour que la
  rive sud (poste de départ) reste en place. Décision : « étang moyen + zones profondes ».
- [x] **Zones profondes** : **3 fosses** (rayons 22 / 18 / 16, +3,6 / +3,3 / +3,8) →
  profondeur max **8,14 unités (≈ 4 m)** au lieu de 6,6. Les deux grandes sont à plus
  de 60 unités de la rive (portée de lancer 52) : **il faut la barque**.
  La ligne descend à 9,0 (7,0 avant) pour que tous les bouchons atteignent le fond.
- [x] **Adapter ce qui ne suit pas le rayon** :
  - [x] shader d'eau (profondeur codée en dur → attribut `aDepth`) et maillages
    eau 40×128 / rive 430 ;
  - [x] carte de placement (terrain 260, caméra ×1,7) ;
  - [x] brume 150–480, ciel 520, caméra far 900, ombres et soleil relatifs au pêcheur ;
  - [x] carte du carnet (échelle = rayon max + couronne) ;
  - [x] décor en densité de surface : 64 arbres, 70 roseaux, 24 rochers, 40 nénuphars ;
  - [x] **bug corrigé** : les bornes de rame se calculaient au rayon de l'angle de
    départ (la barque pouvait traverser le centre en tournant beaucoup) → pas de rame 2,4.
- [x] **Plus de poissons** : population = surface × 90/ha = **58** (`FISH_COUNT = 64`
  n'est plus qu'un plafond) ; ≥ 10 espèces, 1 silure max, 2 de chaque autre solitaire,
  biomasse ≈ **160 kg/ha** (fourchette réaliste 100–300). Silure, anguille et sandre
  naissent **en fosse** ; les espèces de fond naissent collées au relief et le suivent
  2× plus vite.
- [~] **Performances** : suite complète verte et chargement vérifié dans Chromium ;
  **reste à mesurer sur un téléphone réel** (maillage 40×128 + 58 poissons).

### 14.2 Obstacles aquatiques et semi-aquatiques (à modéliser en 3D) — **livré en v174 → v178**

Aujourd'hui l'eau ne contient que des **nénuphars** et des **roseaux**. Ajoutés (module `obstacles.js`,
12 obstacles, géométrie et textures **générées en code**, aucune image) :

- [x] **Ponton** (v174, poste en v178) : planches sur pilotis, côté sud-est. **C'est aussi un poste de pêche** :
  clic sur son repère brun de la carte d'accueil, le pêcheur se tient sur le plancher, à 10,5 unités de la berge.
- [x] **Écluse** (v174) : deux bajoyers en pierre, portes fermées en V, échelle de fer, sas à fleur de berge (sud-ouest).
- [x] **Douve / chenal** (v174) : canal de 27 unités de long qui part de la berge nord-est et se jette dans l'étang
  par un petit seuil de pierre. ⚠ Version **simplifiée** : l'eau du canal est un plan posé sur la rive (le contour
  de l'étang n'est pas modifié) ; on ne peut ni y ramer ni y lancer. Elle attire tanches et carassins à son embouchure.
- [x] **Roches aquatiques à moitié émergées** (v174) : 3 groupes de 5 blocs arrondis, sombres et mouillés en bas,
  clairs et secs en haut.
- [x] **Arbres immergés** (v174) : 2 souches dont le tronc affleure, avec des branches mortes, les unes sous l'eau,
  les autres qui crèvent la surface.
- [x] **Autres idées** (v174) : pieux de bois (1 groupe de 5), cageots/épave (3 caisses + 2 planches), 2 îlots de joncs.

Trois rôles de jeu :

- [x] **Accrochage** (v175) : mêmes mini-jeu et même module (`accrochage.js`) que la vase et les nénuphars.
  Facile : pieux, joncs. Moyenne : ponton (« Ligne accrochée aux pilotis du ponton ! »), roches
  (« Hameçon coincé entre les roches ! »). Difficile : souche (« Ligne accrochée à la souche ! »), épave, écluse.
- [x] **Attraction de poissons** (v176) : souche → brochet / black-bass ; roches → perche ; ponton → gardon ;
  joncs → brochet + gardon ; écluse → chevesne ; pieux → rotengle ; épave → carassin ; douve → tanche / carassin.
  Reliée aux `COMPORTEMENTS` d'`especes.js` : la zone de vie (`homeX/homeZ`) du banc ou du poisson est déplacée sur
  l'obstacle. Le premier banc de chaque espèce est toujours attiré, les suivants une fois sur deux (≈ la moitié des 58 poissons).
- [x] **Collision avec la barque** (v177) : arrêt contre le ponton, l'écluse, les roches, les souches, les pieux, l'épave ;
  les joncs freinent (40 % du coup de rame). Le lancer qui retombe sur un ponton, une écluse ou des roches est refusé.
- [x] **Tests** : `tests/scenario-obstacles.mjs` (248 vérifications) : placement déterministe, non-chevauchement
  (postes, bourriche, départ, embarquement, fosses, nénuphars), accrochage, attraction, collision, ponton-poste.

> Les **types de fond** (sable, gravier, vase, roche, herbier — section 14.3) jouent
> le même rôle d'attraction par espèce : les deux idées vont ensemble.

### 14.3 Types de fond de l'étang (attirent certaines espèces) — LIVRÉ v183

Aujourd'hui le fond est **uniforme** : une seule texture de vase (`assets/vase.jpg`,
ambientCG Ground054, CC0) appliquée à tout le bassin. Or, en pêche réelle, c'est le
**substrat** qui décide quels poissons vivent là.

- [x] **Découper le fond en zones de substrat**, chacune avec sa texture et sa couleur :
  - [x] **sable clair** : anses abritées et hauts-fonds doux ;
  - [x] **gravier / galets** : hauts-fonds exposés au vent ;
  - [x] **vase** : fosses profondes et anses sans courant (texture actuelle) ;
  - [x] **roche** : tombants et bordures des fosses ;
  - [x] **herbier** : zones élargies autour des nénuphars et des roseaux.
- [x] **Rendu** : mélange de textures par zone (masque ou maillages séparés), en
  gardant les textures CC0/KTX2 déjà en place pour ne pas casser les performances.
- [x] **Rôle halieutique** : chaque substrat **attire ou repousse** certaines espèces,
  à relier aux `COMPORTEMENTS` d'`especes.js` (comme la zone de vie actuelle) :
  - [x] vase → **tanche, carpe, brème, anguille** (espèces qui fouillent) ;
  - [x] sable → **gardon, goujon, ablette** ;
  - [x] gravier → **perche, chevesne** ;
  - [x] roche → **perche, sandre** ;
  - [x] herbier → **brochet, black-bass** (embuscade) et **gardon** (abri).
- [x] **Lisibilité pour le joueur** : la **carte du carnet** affiche les fonds avec
  une légende, et le widget de profondeur indique le **type de fond sous l'hameçon**
  (utile pour choisir où lancer depuis la barque).
- [x] **Risques associés** : la **vase** reste l'accrochage qui aspire ; l'**herbier**
  accroche comme les nénuphars ; la **roche** peut user la ligne (nouveau risque à
  définir, ou simple accrochage plus court).
- [x] **Sons** : un bruit différent selon le fond (cailloux qui cognent, vase qui
  aspire) — réutiliser les sons déjà crédités.
- [x] **Tests** : répartition déterministe des substrats, attraction par espèce
  mesurée sur une simulation, cohérence entre la carte, le fond rendu et les poissons.

> Livré en v183 : `substrats.js` (grille déterministe 1 × 1 unité : sable 25 %, gravier 14 %, vase 31 %, roche 14 %,
> herbier 16 %), texture du fond générée en code, habitat des poissons via `COMPORTEMENTS[...].substrats` (même notion que
> les obstacles), carte du carnet avec légende, widget « Fond : … », accrochages vase / herbier / roche, sons déjà crédités
> (cailloux = `pas-gravier`, vase = bulle `plouf`). Détails : `docs/modules.md` §14, test `scenario-substrats.mjs`.

### 14.4 Nombre de poissons réaliste par rapport à la surface

- [ ] **Densité réaliste** : un étang extensif porte environ **100–300 kg de
  poisson par hectare**. Aujourd'hui : 20 poissons sur ≈ 0,23 ha (réaliste en
  biomasse, mais trop peu d'individus pour un grand plan d'eau).
- [ ] **Calculer la population à partir de la surface et de la taille des poissons**
  (biomasse, pas un compte fixe) : garder `FISH_COUNT` comme plafond de confort
  technique, mais viser **≈ 55–60 poissons** sur l'étang moyen (0,64 ha).
- [ ] **Garder la rareté** : les solitaires (silure, brochet, sandre, black-bass,
  truite, anguille) restent rares ; les bancs (gardon, ablette, rotengle) portent
  l'essentiel du nombre.
- [ ] **Mesurer l'effet sur les performances** et sur le rythme des touches (ne pas
  rendre la pêche trop facile en densifiant).

### 14.5 Détritus quand on pêche trop près du fond

- [ ] **Attraper des détritus** au lieu d'un poisson quand l'hameçon est posé au
  ras du fond : bouteille, chiffon, bottine, branche, sac plastique.
- [ ] **Message dédié** (« Tu as ramené une vieille botte… ») + **pas d'XP**, ou
  petite XP symbolique, et **pas de record** au carnet.
- [ ] **Ne pas punir excessivement** : les détritus doivent être rares et amusants ;
  la vase (accrochage) reste le vrai risque du fond.
- [ ] **Cohérence** : uniquement en pêche au fond (quiver, ou bouchon très profond),
  jamais en surface ni en mi-eau.
- [ ] **Tests** : probabilité pilotable, aucune entrée « détritus » dans le carnet
  des espèces, message affiché.

### 14.6 Reste à faire (reporté des passes précédentes)

Voir la section **11** (elle reste la référence) : bug d'affichage des bouchons,
suppression du retour automatique de la ligne, sons non branchés (`playTonnerre`,
`playPas`, `playClic`, `playFilTendu`, `playSaut`), captures d'écran du README,
bruitages à remplacer, banc d'origine à rejoindre après une capture.

### 14.7 Bug — le sonar doit être LANCÉ comme une amorce — LIVRÉ v179

Avant (v178), le sonar n'était pas lancé : un clic sur **📡** **téléportait** la
bouée à une position **calculée** (`rayonEtang(angle) − 4` depuis la berge, `+8` vers
le centre depuis la barque), sans visée, sans puissance, sans arc ni plouf, et le scan
partait **immédiatement**.

- [x] **Même geste que l'amorce** : clic sur **📡** → mode visée ; **maintien** =
  puissance (même jauge, même repère) ; **relâchement** = bouée en **arc** ; **plouf** ;
  puis flottaison et scan.
- [x] **Geste extrait, pas dupliqué** : nouveau module **`lancer.js`** (243 lignes) ;
  `amorcage.js` ne garde que la boule, le nuage et le bras (**364 → 205 lignes**). Les
  objets lançables s'enregistrent via `etat.declarerProjectile` (amorce, sonar).
- [x] **Le radar suit l'impact réel** : `sonarBuoy.position` = point d'impact ; un
  petit maintien tombe **près** (< 25 unités), un long **plus loin** ; visée respectée
  à **< 2°**.
- [x] **Pas de ping avant le plouf** : aucun ping ni onde pendant le vol ; ping **au
  plouf** ; le `sonarDernierPing = -Infinity` posé au clic a disparu.
- [x] **Mêmes règles d'accès** : refusé en **combat**, **accrochage**, **emmêlement**
  et pendant un vol ; depuis la barque la direction suit la **visée**, plus « vers le
  centre » en dur.
- [x] **Cohérence obstacles (v174–v178)** : impact sur **ponton / écluse / roches
  refusé** (même règle que le lancer de ligne) ; impact **hors de l'eau** → la bouée
  tombe sur la rive, message, **aucun ping**, aucun plantage.
- [x] **Ranger reste immédiat** : bouée, radar et ondes effacés tout de suite.
- [x] **Tests** : scénario **71 + 71b**, **+136 vérifications** (2 174 → **2 310**).
  Adaptés **sans suppression** : scénario 62 (boutique) et 71 (grand étang) ne
  supposent plus un sonar posé par un clic.
- Note : `script.js` 3 000 → **2 998** lignes (cliquet 2 999), versions `?v=179`.

### 14.8 Bug — la détection du FOND doit se faire sous le bouchon, à son arrivée

Règle voulue : **la profondeur se choisit avant le lancer**, et la **détection du
fond se fait par rapport à l'emplacement du bouchon quand il arrive** (là où il
tombe vraiment), pas par rapport au point visé, ni à la berge.

Ce que fait le code aujourd'hui (vérifié) :

- `comportement.js:373` : à l'atterrissage, `floatGroup.position.copy(castTarget)` —
  position et point visé coïncident **à cet instant**.
- `comportement.js:389-401` : le verdict « hameçon dans la vase » est calculé **une
  seule fois**, avec `profondeurLocale(castTarget.x, castTarget.z)`.
- `comportement.js:422-431` : ensuite le bouchon **DÉRIVE au vent** (jusqu'à 4 unités
  du point d'impact) et **le verdict n'est jamais recalculé**. L'hameçon peut donc
  être dans la vase sans que le jeu le sache, ou flotter au-dessus d'une fosse alors
  qu'il est déclaré au fond.
- `script.js:1570-1573` et `carnetUI.js:148` : le **schéma de coupe** et le carnet,
  eux, utilisent `floatGroup.position` (la position réelle, dérivée comprise) → **le
  panneau et la décision du jeu peuvent se contredire**.

- [x] **Une seule source de vérité** : le fond est **toujours** évalué avec
  `profondeurLocale(floatGroup.position.x, floatGroup.position.z)` — au moment de
  l'atterrissage **et** après chaque dérive, jamais avec `castTarget` ni la position
  du pêcheur.
- [x] **Réévaluation après dérive** : si le bouchon dérive au vent, le verdict
  (« hameçon dans la vase », accrochage `fond`, zone surface / mi-eau / fond) est
  **réactualisé** ; le schéma de coupe, le libellé du widget et l'état du jeu doivent
  afficher **la même valeur au même instant**.
- [x] **Le lancer atterrit où il atterrit** : le point d'impact = `floatGroup.position`
  à l'arrivée ; la profondeur choisie avant le lancer reste une **longueur
  bouchon → hameçon** (en unités), pas une altitude absolue.
- [x] **Cas limites** : bord peu profond (`FOND_BORD` ≈ 1,4) avec une profondeur
  réglée grande → vase/accrochage ; fosse profonde avec la même profondeur → pas
  d'accrochage. Deux lancers à profondeur identique mais **points d'impact
  différents** doivent donner **deux verdicts différents**.
- [x] **Tests à ajouter** : (a) le verdict utilise la position du bouchon et non
  `castTarget` (on les décale et on vérifie que c'est la position du bouchon qui
  gagne) ; (b) après une dérive au vent, le verdict est recalculé ; (c) la valeur
  affichée par le schéma de coupe et celle utilisée par le jeu sont **égales** ;
  (d) un lancer au bord et un lancer en fosse à profondeur égale donnent des
  verdicts opposés.
- **Livré en v180** : `verdictFond` (`environnement.js`) est la source unique, appelée par `comportement.js`
  (`jugerFond`, à l'arrivée puis à chaque image : la dérive est prise en compte, accrochage seulement à la
  transition) et par le schéma de coupe (`majCoupeProfondeur`, déplacé dans `ligne.js`). Règle de vase unifiée
  à 0,5 unité du fond (le schéma alertait à 0,25). Tests : scénario **74**, +41 vérifications (2 310 → **2 351**).
  Test existant adapté sans suppression : scénario 43 (indice « Fond à » avec majuscule dans la vase).
  `script.js` 2 998 → **2 970** lignes (cliquet 2 971).


- **Livré en v181** : `comportement.js` (`dandiner`, `rayonRemous`, `sensibiliteRemous`). Un petit coup
  (< 0,3 tour cumulé par geste, pause de 0,5 s = geste fini) crée un remous `etat.remous` (0 → 1, plafonné,
  retombe en 3 s) qui ravive l'intérêt des poissons à ≈ 3 unités × sensibilité (embuscade ×1,25, méfiants
  jusqu'à ×0,5 ; rayon max < 4). Il ne change ni la couche d'eau ni la zone de vie. Un geste franc
  (≥ 0,3 tour) ramène la ligne comme avant. Aucun effet hors `inWater` (combat, accrochage, emmêlement).
  Tests : scénario **75**, +35 vérifications (2 351 → **2 386**). Correctif au passage : les tours de manivelle
  donnés avant l'arrivée du bouchon sont perdus (ils déclenchaient un rappel immédiat à l'atterrissage).

## Scénarios de test ajoutés

- **64** : fin volontaire, accueil modal, XP de partie, distribution, spécimens hors norme.
- **65** : ligne tendue, emmêlement, mini-jeu de démêlage, abandon/temps écoulé.
- **66** : bouchon / quiver, scion, canne inclinée, ferrage, retour au bouchon.

## 11. Passe v126 — réalisme des poissons, quiver, sons, dépôt

- [x] **Quiver = pêche au FOND.** L'hameçon est posé juste au-dessus de la vase à l'endroit
  du lancer (`poserHameconAuFond`), profondeur non réglable, retour au réglage du bouchon
  en repassant en bouchon (scénario 67).
- [x] **Retirer les boutons Nord/Sud/Est/Ouest de l'accueil** (la carte 3D suffit).
- [x] **Sons** : 18 nouveaux sons libres (Wikimedia Commons + synthèse CC0) crédités dans
  `assets/CREDITS.txt`, branchés : fouet de canne, épuisette, poisson au sol, pièces
  (boutique), cloche (record), faune diurne (héron, martin-pêcheur, corneille, canard),
  ambiance nocturne (grenouilles, grillons).
  - [ ] À brancher plus tard : `playTonnerre` (orage), `playPas`, `playClic`, `playFilTendu`, `playSaut`.
- [x] **Vision réaliste** : portée par espèce, réduite la nuit (sauf nocturnes : sandre,
  silure, anguille, tanche) et sous la pluie, champ de vision ±120° (derrière lui : 2,2 unités).
- [x] **Poissons dans leur zone de pêche** : domaine propre à l'espèce ; l'appât hors du
  domaine n'intéresse pas ; rappel progressif + demi-tour franchement à 110 % ; test : ≥ 98 % du temps dedans.
- [x] **Caractéristiques par espèce** (`COMPORTEMENTS`, `especes.js`) : couche (surface /
  mi-eau / fond), taille de banc, cohésion, vitesse de croisière et de pointe, agilité de
  virage, humeur (errant / embuscade / fouille).
- [x] **Mouvements réalistes** : cap + virage limité, banc (cohésion, alignement), brochet
  et black-bass en embuscade (guet puis bond), tanche/carpe/brème qui fouillent le fond,
  espèces « de fond » qui suivent le relief.
- [x] **Licence MIT**, **CircleCI** (gratuit : plan Free + crédits open source), **skills**
  Kiro/Codex, **steering**, **hooks**, **AGENTS.md** enrichi.
- [x] **Boules d'amorce** : elles partent maintenant de la main du pêcheur (plus d'un point fixe).
- [x] **Croix de fermeture** (✕, en haut à droite, style Windows) pour le carnet et le classement.
- [x] **Tailles réalistes** (Wikipédia FR) : min = juvénile, max = grand sujet, pour les 16 espèces
  (`especes.js`) ; poids déduits (carpe max ≈ 26 kg, silure max ≈ 106 kg).
- [x] **Ragondin** : cris, rongement, éclaboussure à l'arrivée, **musique inquiétante** (bourdon,
  triton, battements de cœur) qui démarre à son arrivée et s'arrête quand il fuit ; sons synthétisés (Web Audio).
- [ ] **Bug** : problèmes d'affichage des bouchons (flotteurs) à investiguer : positions, taille, rendu selon la vue / la profondeur.
- [ ] **À faire** : supprimer le mécanisme de retour automatique de la ligne (le joueur ramène lui-même au moulinet).
- [~] **Captures d'écran dans le README** (voir `docs/screenshots/`).
- [ ] Idée : remplacer les 5 bruitages synthétisés par de vrais enregistrements.
- [ ] Idée : les poissons d'un banc remplacé à la capture rejoignent le banc d'origine.

## Scénario de test ajouté (v126)

- **67** : accueil sans boutons de poste, données de comportement, bancs, simulation de
  4 min (zone de vie, vitesse), quiver au fond.

## 12. Passe v128–v130

- [x] **Bug en ligne** : l'eau ne s'affichait pas (`uNormalsOn` non déclaré dans le shader d'eau) — corrigé + test.
- [x] **Quiver : choix du scion** au lieu du bouchon (souple, moyen, rigide offerts ; clochette,
  carbone, maître à acheter). Le **scion à clochette** sonne à chaque touche.
- [x] **Quiver : pas de widget de profondeur** (l'hameçon est au fond).
- [x] **Scion plus grand sur ordinateur** (360×120 px dès 900 px de large).
- [x] **Bouton rond « Amorcer » en bas à gauche.**
- [x] **Carnet / boutique façon inventaire Minecraft** : panneau gris biseauté, onglets, cases,
  sections (fils et amorce, bouchons, scions, matériel), onglet actif mis en avant.

## 13. Passe v131–v139 — livré

- [x] **Bouton rond « Amorcer » compact** dès que la ligne est à l'eau (v131).
- [x] **Sonar flottant** (150 XP en boutique) : radar de 12 m, **ping de sous-marin**
  synthétisé + **ondes jaunes** qui s'étendent à la surface (v137).
- [x] **XP de la partie dans la barre du haut** (score · lignes · XP), en plus du
  détail carnet « XP · carrière » (v135).
- [x] **Cheat « poisson »** : taper le mot secret offre +50 XP de partie (v136).
- [x] **Vrais sons de poisson qui saute** (Pixabay) + vrai « plouf » de l'amorce
  (LaSonotheque, CC0), crédités dans `assets/CREDITS.txt` (v133–v134).
- [x] **Remontée trop rapide** : le seuil dépend maintenant du **poids du poisson**
  et de la **résistance du fil** (v132).
- [x] **La manivelle seule ramène la ligne** (plus de clic sur l'eau, v131).
- [x] **Sortie de vase plus juste** (≈3 s de clics réguliers) et **ragondin qui ne
  gêne plus** le ferrage (v131).
- [x] **Tailles réalistes vérifiées** (Wikipédia FR) pour la perche (45 cm) et le
  black-bass (60 cm) (v130).
- [x] **MODE BATEAU** (v137) : **barque achetée 180 XP** en boutique, **mobile sur
  l'eau**, bouton **🚤 Bateau / 🐟 Rive** en bas à gauche, **flèches ou ZQSD** pour
  ramer (haut = vers le centre). Débarquement **exactement au poste de berge**
  d'origine ; impossible de ramer ou débarquer tant que la ligne n'est pas au repos.
  Depuis la barque, on atteint les **fosses du milieu** (silure, anguille, sandre).
- [x] **Barque texturée** (v137) : planches peintes écaillées, banc et avirons en
  bois. Textures **générées en code** (`CanvasTexture`), donc aucune image
  téléchargée et aucune licence tierce.
- [x] **Panneau d'épreuve de force allégé** (v138, demande joueur) : plus de légende
  « zone sûre », plus de longue phrase, plus de « avantage au poisson » — il reste
  le **portrait du poisson**, son **nom · poids**, la barre de tension, le chrono
  et le bouton « Lâcher du fil ».
- [x] **Portrait du poisson** pendant le combat (v138) : image **sur fond
  transparent**, dessinée en code à partir des données de l'espèce (silhouette,
  couleurs, motif, nageoires, moustaches du silure) — module `portraits.js`.
- [x] **Bug corrigé** : « 0,96 kg kg » (l'unité était écrite deux fois) (v138).
- [x] **Bug corrigé** : le sonar ne pingait plus une 2ᵉ fois après un long moment de
  jeu (deux horloges mélangées) (v138).
- [x] **Bug corrigé** : bouton **Amorce** et bouton **Bateau** superposés en bas à
  gauche — l'amorce monte au-dessus dès que la barque est débloquée (v139).
- [x] **Barque pilotable au DOIGT** (v140) : pad **◀ ▲ ▶** dans le pouce droit
  (tap = un pas, maintenir = ramer en continu), affiché seulement à bord et ligne
  au repos. Avant, la barque ne se pilotait qu'au clavier : impossible sur tablette.

## 14. À faire — demandes du 2026-11-15

### 14.1 Étang trop petit → étang moyen avec zones profondes — LIVRÉ v173

- [x] **Agrandir l'étang** : rayon nominal **55 → 90** unités (contour 71–104,
  ≈ 0,64 ha au lieu de 0,23 ha). Centre déplacé de (0, −40) à (0, −71) pour que la
  rive sud (poste de départ) reste en place. Décision : « étang moyen + zones profondes ».
- [x] **Zones profondes** : **3 fosses** (rayons 22 / 18 / 16, +3,6 / +3,3 / +3,8) →
  profondeur max **8,14 unités (≈ 4 m)** au lieu de 6,6. Les deux grandes sont à plus
  de 60 unités de la rive (portée de lancer 52) : **il faut la barque**.
  La ligne descend à 9,0 (7,0 avant) pour que tous les bouchons atteignent le fond.
- [x] **Adapter ce qui ne suit pas le rayon** :
  - [x] shader d'eau (profondeur codée en dur → attribut `aDepth`) et maillages
    eau 40×128 / rive 430 ;
  - [x] carte de placement (terrain 260, caméra ×1,7) ;
  - [x] brume 150–480, ciel 520, caméra far 900, ombres et soleil relatifs au pêcheur ;
  - [x] carte du carnet (échelle = rayon max + couronne) ;
  - [x] décor en densité de surface : 64 arbres, 70 roseaux, 24 rochers, 40 nénuphars ;
  - [x] **bug corrigé** : les bornes de rame se calculaient au rayon de l'angle de
    départ (la barque pouvait traverser le centre en tournant beaucoup) → pas de rame 2,4.
- [x] **Plus de poissons** : population = surface × 90/ha = **58** (`FISH_COUNT = 64`
  n'est plus qu'un plafond) ; ≥ 10 espèces, 1 silure max, 2 de chaque autre solitaire,
  biomasse ≈ **160 kg/ha** (fourchette réaliste 100–300). Silure, anguille et sandre
  naissent **en fosse** ; les espèces de fond naissent collées au relief et le suivent
  2× plus vite.
- [~] **Performances** : suite complète verte et chargement vérifié dans Chromium ;
  **reste à mesurer sur un téléphone réel** (maillage 40×128 + 58 poissons).

### 14.2 Obstacles aquatiques et semi-aquatiques (à modéliser en 3D) — **livré en v174 → v178**

Aujourd'hui l'eau ne contient que des **nénuphars** et des **roseaux**. Ajoutés (module `obstacles.js`,
12 obstacles, géométrie et textures **générées en code**, aucune image) :

- [x] **Ponton** (v174, poste en v178) : planches sur pilotis, côté sud-est. **C'est aussi un poste de pêche** :
  clic sur son repère brun de la carte d'accueil, le pêcheur se tient sur le plancher, à 10,5 unités de la berge.
- [x] **Écluse** (v174) : deux bajoyers en pierre, portes fermées en V, échelle de fer, sas à fleur de berge (sud-ouest).
- [x] **Douve / chenal** (v174) : canal de 27 unités de long qui part de la berge nord-est et se jette dans l'étang
  par un petit seuil de pierre. ⚠ Version **simplifiée** : l'eau du canal est un plan posé sur la rive (le contour
  de l'étang n'est pas modifié) ; on ne peut ni y ramer ni y lancer. Elle attire tanches et carassins à son embouchure.
- [x] **Roches aquatiques à moitié émergées** (v174) : 3 groupes de 5 blocs arrondis, sombres et mouillés en bas,
  clairs et secs en haut.
- [x] **Arbres immergés** (v174) : 2 souches dont le tronc affleure, avec des branches mortes, les unes sous l'eau,
  les autres qui crèvent la surface.
- [x] **Autres idées** (v174) : pieux de bois (1 groupe de 5), cageots/épave (3 caisses + 2 planches), 2 îlots de joncs.

Trois rôles de jeu :

- [x] **Accrochage** (v175) : mêmes mini-jeu et même module (`accrochage.js`) que la vase et les nénuphars.
  Facile : pieux, joncs. Moyenne : ponton (« Ligne accrochée aux pilotis du ponton ! »), roches
  (« Hameçon coincé entre les roches ! »). Difficile : souche (« Ligne accrochée à la souche ! »), épave, écluse.
- [x] **Attraction de poissons** (v176) : souche → brochet / black-bass ; roches → perche ; ponton → gardon ;
  joncs → brochet + gardon ; écluse → chevesne ; pieux → rotengle ; épave → carassin ; douve → tanche / carassin.
  Reliée aux `COMPORTEMENTS` d'`especes.js` : la zone de vie (`homeX/homeZ`) du banc ou du poisson est déplacée sur
  l'obstacle. Le premier banc de chaque espèce est toujours attiré, les suivants une fois sur deux (≈ la moitié des 58 poissons).
- [x] **Collision avec la barque** (v177) : arrêt contre le ponton, l'écluse, les roches, les souches, les pieux, l'épave ;
  les joncs freinent (40 % du coup de rame). Le lancer qui retombe sur un ponton, une écluse ou des roches est refusé.
- [x] **Tests** : `tests/scenario-obstacles.mjs` (248 vérifications) : placement déterministe, non-chevauchement
  (postes, bourriche, départ, embarquement, fosses, nénuphars), accrochage, attraction, collision, ponton-poste.

> Les **types de fond** (sable, gravier, vase, roche, herbier — section 14.3) jouent
> le même rôle d'attraction par espèce : les deux idées vont ensemble.

### 14.3 Types de fond de l'étang (attirent certaines espèces) — LIVRÉ v183

Aujourd'hui le fond est **uniforme** : une seule texture de vase (`assets/vase.jpg`,
ambientCG Ground054, CC0) appliquée à tout le bassin. Or, en pêche réelle, c'est le
**substrat** qui décide quels poissons vivent là.

- [x] **Découper le fond en zones de substrat**, chacune avec sa texture et sa couleur :
  - [x] **sable clair** : anses abritées et hauts-fonds doux ;
  - [x] **gravier / galets** : hauts-fonds exposés au vent ;
  - [x] **vase** : fosses profondes et anses sans courant (texture actuelle) ;
  - [x] **roche** : tombants et bordures des fosses ;
  - [x] **herbier** : zones élargies autour des nénuphars et des roseaux.
- [x] **Rendu** : mélange de textures par zone (masque ou maillages séparés), en
  gardant les textures CC0/KTX2 déjà en place pour ne pas casser les performances.
- [x] **Rôle halieutique** : chaque substrat **attire ou repousse** certaines espèces,
  à relier aux `COMPORTEMENTS` d'`especes.js` (comme la zone de vie actuelle) :
  - [x] vase → **tanche, carpe, brème, anguille** (espèces qui fouillent) ;
  - [x] sable → **gardon, goujon, ablette** ;
  - [x] gravier → **perche, chevesne** ;
  - [x] roche → **perche, sandre** ;
  - [x] herbier → **brochet, black-bass** (embuscade) et **gardon** (abri).
- [x] **Lisibilité pour le joueur** : la **carte du carnet** affiche les fonds avec
  une légende, et le widget de profondeur indique le **type de fond sous l'hameçon**
  (utile pour choisir où lancer depuis la barque).
- [x] **Risques associés** : la **vase** reste l'accrochage qui aspire ; l'**herbier**
  accroche comme les nénuphars ; la **roche** peut user la ligne (nouveau risque à
  définir, ou simple accrochage plus court).
- [x] **Sons** : un bruit différent selon le fond (cailloux qui cognent, vase qui
  aspire) — réutiliser les sons déjà crédités.
- [x] **Tests** : répartition déterministe des substrats, attraction par espèce
  mesurée sur une simulation, cohérence entre la carte, le fond rendu et les poissons.

> Livré en v183 : `substrats.js` (grille déterministe 1 × 1 unité : sable 25 %, gravier 14 %, vase 31 %, roche 14 %,
> herbier 16 %), texture du fond générée en code, habitat des poissons via `COMPORTEMENTS[...].substrats` (même notion que
> les obstacles), carte du carnet avec légende, widget « Fond : … », accrochages vase / herbier / roche, sons déjà crédités
> (cailloux = `pas-gravier`, vase = bulle `plouf`). Détails : `docs/modules.md` §14, test `scenario-substrats.mjs`.

### 14.4 Nombre de poissons réaliste par rapport à la surface

- [ ] **Densité réaliste** : un étang extensif porte environ **100–300 kg de
  poisson par hectare**. Aujourd'hui : 20 poissons sur ≈ 0,23 ha (réaliste en
  biomasse, mais trop peu d'individus pour un grand plan d'eau).
- [ ] **Calculer la population à partir de la surface et de la taille des poissons**
  (biomasse, pas un compte fixe) : garder `FISH_COUNT` comme plafond de confort
  technique, mais viser **≈ 55–60 poissons** sur l'étang moyen (0,64 ha).
- [ ] **Garder la rareté** : les solitaires (silure, brochet, sandre, black-bass,
  truite, anguille) restent rares ; les bancs (gardon, ablette, rotengle) portent
  l'essentiel du nombre.
- [ ] **Mesurer l'effet sur les performances** et sur le rythme des touches (ne pas
  rendre la pêche trop facile en densifiant).

### 14.5 Détritus quand on pêche trop près du fond

- [ ] **Attraper des détritus** au lieu d'un poisson quand l'hameçon est posé au
  ras du fond : bouteille, chiffon, bottine, branche, sac plastique.
- [ ] **Message dédié** (« Tu as ramené une vieille botte… ») + **pas d'XP**, ou
  petite XP symbolique, et **pas de record** au carnet.
- [ ] **Ne pas punir excessivement** : les détritus doivent être rares et amusants ;
  la vase (accrochage) reste le vrai risque du fond.
- [ ] **Cohérence** : uniquement en pêche au fond (quiver, ou bouchon très profond),
  jamais en surface ni en mi-eau.
- [ ] **Tests** : probabilité pilotable, aucune entrée « détritus » dans le carnet
  des espèces, message affiché.

### 14.6 Reste à faire (reporté des passes précédentes)

Voir la section **11** (elle reste la référence) : bug d'affichage des bouchons,
suppression du retour automatique de la ligne, sons non branchés (`playTonnerre`,
`playPas`, `playClic`, `playFilTendu`, `playSaut`), captures d'écran du README,
bruitages à remplacer, banc d'origine à rejoindre après une capture.

### 14.7 Bug — le sonar doit être LANCÉ comme une amorce — LIVRÉ v179

Avant (v178), le sonar n'était pas lancé : un clic sur **📡** **téléportait** la
bouée à une position **calculée** (`rayonEtang(angle) − 4` depuis la berge, `+8` vers
le centre depuis la barque), sans visée, sans puissance, sans arc ni plouf, et le scan
partait **immédiatement**.

- [x] **Même geste que l'amorce** : clic sur **📡** → mode visée ; **maintien** =
  puissance (même jauge, même repère) ; **relâchement** = bouée en **arc** ; **plouf** ;
  puis flottaison et scan.
- [x] **Geste extrait, pas dupliqué** : nouveau module **`lancer.js`** (243 lignes) ;
  `amorcage.js` ne garde que la boule, le nuage et le bras (**364 → 205 lignes**). Les
  objets lançables s'enregistrent via `etat.declarerProjectile` (amorce, sonar).
- [x] **Le radar suit l'impact réel** : `sonarBuoy.position` = point d'impact ; un
  petit maintien tombe **près** (< 25 unités), un long **plus loin** ; visée respectée
  à **< 2°**.
- [x] **Pas de ping avant le plouf** : aucun ping ni onde pendant le vol ; ping **au
  plouf** ; le `sonarDernierPing = -Infinity` posé au clic a disparu.
- [x] **Mêmes règles d'accès** : refusé en **combat**, **accrochage**, **emmêlement**
  et pendant un vol ; depuis la barque la direction suit la **visée**, plus « vers le
  centre » en dur.
- [x] **Cohérence obstacles (v174–v178)** : impact sur **ponton / écluse / roches
  refusé** (même règle que le lancer de ligne) ; impact **hors de l'eau** → la bouée
  tombe sur la rive, message, **aucun ping**, aucun plantage.
- [x] **Ranger reste immédiat** : bouée, radar et ondes effacés tout de suite.
- [x] **Tests** : scénario **71 + 71b**, **+136 vérifications** (2 174 → **2 310**).
  Adaptés **sans suppression** : scénario 62 (boutique) et 71 (grand étang) ne
  supposent plus un sonar posé par un clic.
- Note : `script.js` 3 000 → **2 998** lignes (cliquet 2 999), versions `?v=179`.

### 14.8 Bug — la détection du FOND doit se faire sous le bouchon, à son arrivée

Règle voulue : **la profondeur se choisit avant le lancer**, et la **détection du
fond se fait par rapport à l'emplacement du bouchon quand il arrive** (là où il
tombe vraiment), pas par rapport au point visé, ni à la berge.

Ce que fait le code aujourd'hui (vérifié) :

- `comportement.js:373` : à l'atterrissage, `floatGroup.position.copy(castTarget)` —
  position et point visé coïncident **à cet instant**.
- `comportement.js:389-401` : le verdict « hameçon dans la vase » est calculé **une
  seule fois**, avec `profondeurLocale(castTarget.x, castTarget.z)`.
- `comportement.js:422-431` : ensuite le bouchon **DÉRIVE au vent** (jusqu'à 4 unités
  du point d'impact) et **le verdict n'est jamais recalculé**. L'hameçon peut donc
  être dans la vase sans que le jeu le sache, ou flotter au-dessus d'une fosse alors
  qu'il est déclaré au fond.
- `script.js:1570-1573` et `carnetUI.js:148` : le **schéma de coupe** et le carnet,
  eux, utilisent `floatGroup.position` (la position réelle, dérivée comprise) → **le
  panneau et la décision du jeu peuvent se contredire**.

- [x] **Une seule source de vérité** : le fond est **toujours** évalué avec
  `profondeurLocale(floatGroup.position.x, floatGroup.position.z)` — au moment de
  l'atterrissage **et** après chaque dérive, jamais avec `castTarget` ni la position
  du pêcheur.
- [x] **Réévaluation après dérive** : si le bouchon dérive au vent, le verdict
  (« hameçon dans la vase », accrochage `fond`, zone surface / mi-eau / fond) est
  **réactualisé** ; le schéma de coupe, le libellé du widget et l'état du jeu doivent
  afficher **la même valeur au même instant**.
- [x] **Le lancer atterrit où il atterrit** : le point d'impact = `floatGroup.position`
  à l'arrivée ; la profondeur choisie avant le lancer reste une **longueur
  bouchon → hameçon** (en unités), pas une altitude absolue.
- [x] **Cas limites** : bord peu profond (`FOND_BORD` ≈ 1,4) avec une profondeur
  réglée grande → vase/accrochage ; fosse profonde avec la même profondeur → pas
  d'accrochage. Deux lancers à profondeur identique mais **points d'impact
  différents** doivent donner **deux verdicts différents**.
- [x] **Tests à ajouter** : (a) le verdict utilise la position du bouchon et non
  `castTarget` (on les décale et on vérifie que c'est la position du bouchon qui
  gagne) ; (b) après une dérive au vent, le verdict est recalculé ; (c) la valeur
  affichée par le schéma de coupe et celle utilisée par le jeu sont **égales** ;
  (d) un lancer au bord et un lancer en fosse à profondeur égale donnent des
  verdicts opposés.
- **Livré en v180** : `verdictFond` (`environnement.js`) est la source unique, appelée par `comportement.js`
  (`jugerFond`, à l'arrivée puis à chaque image : la dérive est prise en compte, accrochage seulement à la
  transition) et par le schéma de coupe (`majCoupeProfondeur`, déplacé dans `ligne.js`). Règle de vase unifiée
  à 0,5 unité du fond (le schéma alertait à 0,25). Tests : scénario **74**, +41 vérifications (2 310 → **2 351**).
  Test existant adapté sans suppression : scénario 43 (indice « Fond à » avec majuscule dans la vase).
  `script.js` 2 998 → **2 970** lignes (cliquet 2 971).

### 14.9 Idée — un petit coup de moulinet attire les poissons tout proches — LIVRÉ v181

En pêche réelle, on « dandine » : un **léger mouvement du moulinet** fait bouger
l'esche sur place, crée un remous et **ravive l'intérêt des poissons déjà à quelques
mètres**. Avant, un tour de manivelle **ramenait** seulement la ligne.

- [x] **Effet d'attraction locale** : `dandiner(dt, tours)` dans `comportement.js`,
  appelé à chaque image bouchon à l'eau avec les tours de manivelle. Geste **court**
  (< 0,3 tour cumulé, une pause de 0,5 s clôt le geste) → **remous** (`etat.remous`,
  +10 par tour, **plafonné à 1**, retombe en **3 s**), rond à la surface et léger
  tremblement du bouchon.
- [x] **« Vraiment à proximité »** : un poisson est « senti » à moins de
  **3 × remous × sensibilité** unités (embuscade ×1,25, méfiants jusqu'à ×0,5, plafond
  1,3) → rayon **< 4 unités**, contre **7** pour l'intérêt normal (`BITE_INTEREST_RADIUS`).
  Un poisson à 20 unités **ne bouge pas** (testé).
- [x] **Effet temporaire, décroissant, non cumulable** : le remous retombe en 3 s et
  son plafond est 1 ; marteler la manivelle ne dépasse pas ce plafond (testé).
- [x] **Compromis conservé** : un geste **franc** (≥ 0,3 tour) déclenche toujours
  `startReel()` — mouliner **ramène la ligne** et fait quitter le poste (testé : 1 tour
  = 4 unités, puis 2 tours de plus).
- [x] **Respect des `COMPORTEMENTS`** : le poisson approche **sans changer de couche
  d'eau** ni sortir de sa zone de vie ; les espèces de fond restent au fond, les
  carnassiers en embuscade réagissent plus fort, les méfiantes moins.
- [x] **Sans effet** hors `inWater` : rien en combat, accrochage, emmêlement ou touche
  (testé).
- [x] **Correctif lié** : les tours de manivelle donnés **avant** l'arrivée du bouchon
  sont jetés à l'atterrissage — ils déclenchaient un rappel immédiat.
- [x] **Tests** : `scenario-dandine.mjs` (**75 vérifications**), **+35** au total
  (2 351 → **2 386**) : poisson à 2 unités attiré, à 20 immobile, décroissance, plafond,
  espèces, combat / accrochage / emmêlement, rappel de ligne.
- Mesures : `comportement.js` **701 lignes** (plafond 800) ; vérifié dans Chromium —
  petit coup : poisson 2,5 → 2,0 unités, ligne toujours à l'eau ; un tour : rappel de
  4 unités. Cache `?v=181`.

### 14.10 Bug — le générateur aléatoire avait une graine FIGÉE (monde identique à chaque F5)

Constat (joueur) : « quand on fait F5, la partie n'est pas réinitialisée ». Vérifié :
la **partie** repart bien de zéro (accueil, score 0, 5/5 lignes), mais le **monde**
était identique — `script.js` faisait `let rngState = 20240101 >>> 0`, une graine
**constante**. Donc mêmes poissons, mêmes décors, mêmes places à chaque chargement.

- [x] **Graine tirée au chargement** (v185) : `graineDeDepart()` prend
  `crypto.getRandomValues`, sinon `Math.random`, et la mélange avec `Date.now()`.
  Un F5 donne un **étang neuf** (vérifié : deux chargements → deux graines et deux
  peuplements différents).
- [x] **Monde rejouable** : `?graine=N` dans l'URL rejoue un étang précis (vérifié
  deux chargements identiques), et `window.__PECHE_SEED` impose la graine.
- [x] **Tests déterministes** : le harnais pose `__PECHE_SEED = 20240101` avant de
  charger le jeu ; `__game.getGraine()` / `setGraine(n)` sont exposés.
- [x] **Suite instable corrigée** : le test de densité des substrats dépendait de
  l'aléatoire consommé par les scénarios précédents (le jeu consomme `rand()` à
  chaque image, donc le nombre de tirages varie avec le temps réel). La mesure repart
  maintenant d'une graine imposée → **3 exécutions vertes d'affilée** (2 609
  vérifications), là où il fallait relancer pour passer.
- Tests : `scenario-etang` 55g (graine 32 bits, graine imposable/relue, deux graines
  → deux peuplements), `scenario-static` 3e (plus de graine littérale, tirage
  `crypto`/`Date.now`, support `?graine=`).

## Scénarios de test ajoutés (v131–v139)

- **57** : mode bateau (achat XP, embarquement au milieu, bornes de déplacement,
  pêche complète à bord, débarquement exact, raccourci de poste qui débarque) ;
  couvre aussi la barque texturée (rendu vérifié par capture).
- **58** : panneau de combat court + portrait de chaque espèce (16 portraits).
- **71** : sonar (ping de sous-marin, ondes jaunes, tempo, rangement).

Total de la suite : **2609 vérifications vertes** (v185) (`node games/peche_game/tests/run.mjs`).

## 15. Réalisme — pistes identifiées (2026-11-15)

État des lieux vérifié dans le code : météo et cycle jour/nuit existent, la vision,
la zone de vie et les comportements par espèce aussi. En revanche **l'esche est
absente** (hameçon nu), **la touche ne dépend ni de l'heure ni du temps**, il n'y a
**ni température d'eau, ni saison, ni pression**, et le vent ne dévie que le lancer
du poisson dans la bourriche.

### 15.1 Physique de l'eau (gain réalisme le plus fort, effort moyen)

- [ ] **Température de l'eau + saisons + thermocline.** Eau froide (< 8 °C) :
  poissons léthargiques, carnassiers encore actifs. Eau chaude (> 22 °C) : poissons
  au fond, meilleure pêche à l'aube et au crépuscule. En été, la thermocline sépare
  l'eau chaude de surface de l'eau froide profonde (le poisson se tient juste
  au-dessus). À brancher sur les `COMPORTEMENTS` d'`especes.js` (vitesse, couche,
  activité) ; rend les fosses et la barque vraiment utiles.
- [ ] **Heures actives.** La touche est aujourd'hui purement aléatoire
  (`biteSinkAt = 3 + rand() * 5`). La faire dépendre de **l'aube et du crépuscule**
  (meilleures heures) et de la nuit pour les espèces déjà marquées `nocturne`
  (sandre, silure, anguille, tanche). Effort faible : un facteur horaire sur le
  délai de touche.
- [ ] **Pression atmosphérique.** Dérivée de la météo existante (beau / rafales /
  pluie) : pression qui monte = poissons actifs ; chute avant l'orage = pêche
  fermée, puis coup de feu juste après la pluie.
- [ ] **Eau trouble après la pluie.** La vision par espèce existe déjà : ajouter une
  turbidité qui la réduit (pluie, vent fort, barque qui remue le fond).
- [ ] **Pluie = surface agitée → plus de fausses touches.** Sous la pluie, la surface
  vit (gouttes, clapot) : le bouchon bouge pour de mauvaises raisons. Réaliste et
  déjà cohérent avec le catalogue de fausses touches existant : augmenter leur
  nombre et/ou leur amplitude quand `weatherPluie` monte. **Rien de tel aujourd'hui**
  (vérifié : la pluie n'a aucun effet sur les touches).
- [ ] **Vent fort = houle plus marquée.** Le vent fait déjà DÉRIVER le bouchon
  (`appliquerMouvement`, ligne tenue) : le rendre plus lisible quand les rafales
  montent (amplitude de la houle et dérive accrues), pour que le joueur comprenne
  que la lecture du bouchon devient plus difficile.

### 15.2 L'esche — le manque le plus visible — LIVRÉ v184

- [x] **Choisir son appât.** Aujourd'hui l'hameçon est **nu** (aucune occurrence de
  « appât » dans le code ; seule l'amorce existe). Esches réalistes : **ver de
  terre, maïs, pain, bouillette, vif / leurre**. Chaque esche cible des espèces :
  - [x] maïs → **carpe, tanche, brème** ;
  - [x] ver → **gardon, perche, anguille, goujon** ;
  - [x] pain/flocons → **gardon, rotengle, chevesne** (surface) ;
  - [x] bouillette → **carpe, carassin** (fond) ;
  - [x] vif ou leurre → **brochet, sandre, black-bass**.
- [x] **Esches consommables et achetables en XP** (le système de `RECHARGES` existe
  déjà : lots de 3, stock affiché, sélection du fil à équiper — même modèle).
- [x] **Cohérence avec la profondeur et le fond** : une esche de fond sur la vase,
  un leurre en pleine eau, un flocon en surface ; l'esche inadaptée ne touche
  presque jamais (message discret, jamais de texte d'aide explicite).
- [x] **Hameçon nu = presque rien** : pêcher sans esche reste possible mais très
  peu productif (et pédagogique).

> Livré en v184 : `esches.js` (profils espèce × couche × substrat ; hameçon nu = 6 %), stock par lots de 3 dans le système des
> recharges (`stocks.js`, `journal.recharges`, `journal.esche`, persisté par `carnet.js`), section « Esches » de la boutique,
> widget de profondeur « Esche : … », une touche ferrée consomme une esche, 3 vers offerts, message discret après 3 refus
> (« Ils tournent autour… », aucune aide). Détails : `docs/modules.md` §15, test `scenario-esches.mjs`.

### 15.3 Combat

- [ ] **Frein réglable + « départ » du poisson.** Aujourd'hui le frein est binaire
  (« Lâcher du fil »). Réel : le poisson part, prend du fil, la ligne chante, et le
  joueur règle la tension pour ne pas casser.
- [ ] **Épuisette obligatoire au-dessus de ~3 kg.** Le son d'épuisette existe déjà
  (`sound.playEpuisette`) mais pas le geste : sans épuisette, le gros poisson se
  décroche au bord.
- [ ] **Fil qui « chante » sous forte tension** (son continu modulé par la tension).

### 15.4 Réglementation et éthique (éducatif)

- [ ] **Maille légale + remise à l'eau.** Les tailles minimales existent déjà
  (`cm: [10, 42]` = juvénile → grand sujet) mais aucune règle. Un poisson sous la
  maille doit être **remis à l'eau** : pas de record au carnet, petite XP
  « connaissance » à la place.
- [ ] **Bourriche limitée / quota.** Un garde-poisson a une capacité ; au-delà, il
  faut relâcher ou terminer la partie.

### 15.5 Barque et monde

- [ ] **Bruit des rames qui effraie les poissons proches** (réutiliser le système de
  vision/portée existant) et **barque qui dérive au vent** quand on ne rame pas.
- [ ] **Lancer dévié par le vent.** Le vent ne dévie aujourd'hui que le lancer du
  poisson dans la bourriche (`FISH_THROW_WIND`) : appliquer la même logique au
  lancer de la ligne.
- [ ] **Poissons qui sautent** au crépuscule (carpe, brochet) — les sons sont déjà
  crédités, il manque le saut visible et l'ondulation.

### 15.6 Ce qui ne s'applique pas

- **Marées et cycle lunaire** : un étang n'a pas de marée ; la lune n'aurait aucun
  effet mécanique crédible ici.

### 15.7 Ce qui est DÉJÀ réaliste (vérifié dans le code — ne pas refaire)

Ces points de la liste de départ existent et fonctionnent : ils sont notés ici pour
qu'on ne les « rajoute » pas une deuxième fois.

- [x] **Le poisson goûte et recrache** : c'est exactement le rôle des **fausses
  touches** (`TOUCHES` / `choisirTouche(false, …)`), propres à chaque espèce.
- [x] **Ferrage trop tard** : la touche ratée existe (fenêtre de ferrage
  `BITE_WINDOW` × sensibilité du bouchon) ; le poisson repart et devient plus
  méfiant (`punishFish` : plus agressif, plus rapide, plus difficile).
- [x] **Canne qui plie selon le poisson** : `rodBend` déforme le blank pendant le
  combat et le lancer.
- [x] **Vase et algues** : la vase est un accrochage à part entière (elle « aspire »,
  rythme de clics ≈ 3/s) et les nénuphars accrochent aussi.
- [x] **Sons d'éclaboussure et de poisson** : éclaboussure réelle (domaine public),
  plouf de l'amorce, poisson qui saute (Pixabay), poisson au sol, épuisette.
- [x] **Vent sur la ligne** : le vent fait dériver le bouchon pendant la touche, et
  dévie le lancer du poisson dans la bourriche (`FISH_THROW_WIND`).
- [x] **Vision réaliste** : portée par espèce, réduite la nuit (sauf nocturnes) et
  sous la pluie, champ de vision ±120°.
- [x] **Zone de vie par espèce** : chaque poisson reste dans son domaine et sa
  couche (surface / mi-eau / fond).
- [x] **Frein « manuel »** : le bouton **Lâcher du fil** (maintenir = laisser filer)
  existe ; ce qui manque est le réglage fin et le « run » du poisson (15.3).

### 15.8 Ordre suggéré

1. **Température / saisons / heures actives** (15.1) — change la sensation de jeu.
2. **Appâts** (15.2) — comble le manque le plus visible.
3. **Pression et turbidité** (15.1), puis **épuisette et frein** (15.3).
4. **Maille et remise à l'eau** (15.4), puis le reste de la barque (15.5).

Ces idées s'articulent avec les **fonds** (14.3) et les **obstacles** (14.2) : un
substrat + une température + une heure + une esche, c'est ce qui décide vraiment
qu'un poisson mord.

## 16. Packaging et découpage — garder des fichiers JS petits (coût LLM)

**Constat mesuré (2026-11-15)** : `script.js` fait **9 581 lignes** ; tout le reste
tient déjà bien : `sound.js` 798, `portraits.js` 282, `demelage.js` 281,
`especes.js` 228, `classement.js` 111, `quiver.js` 105, `carnet.js` 88
(total ≈ 11 474 lignes de JS). Chaque modification d'une fonctionnalité oblige donc
à ouvrir un fichier de 9,5 k lignes : le coût (temps, contexte, risque de régression)
vient de là, pas du nombre de fonctionnalités.

### 16.1 Objectif chiffré

- [ ] **Aucun module au-dessus de ~700–800 lignes** (hors liste de dérogations
  temporaires, qui doit se réduire à chaque passe).
- [ ] **`script.js` devient un simple orchestrateur** : importe les modules, branche
  les événements, garde la boucle `animate()`. Cible : **< 800 lignes**.
- [ ] **Une modification de fonctionnalité touche 1 à 2 fichiers** (le module + son
  scénario de test).

### 16.2 Découpage proposé (ordre de valeur décroissante)

- [x] **Contrat et propriété écrits** : `docs/modules.md` (règles, tableau
  module → rôle → lignes → propriétaire, plafonds, ordre de découpage).
- [x] **Premier module extrait : `decor.js`** (v141) — arbres, roseaux, rochers,
  nénuphars. Frontière parfaite : le module reçoit 6 dépendances et ne rend que
  `lilyPads`. `script.js` passe de 9 581 à 9 424 lignes.
- [x] **Garde-fou en place** : `tests/scenario-modules.mjs` (plafond 800 lignes /
  module, **cliquet** sur `script.js`, pas de cycle, module documenté,
  API d'entrée présente). Cliquet abaissé à 9 320 en v142.
- [x] **Deuxième module extrait : `environnement.js`** (v142) — centre de l'étang,
  contour par harmoniques, relief et fosses, `profondeurLocale`, `fondY`, fond 3D.
  Comportement **strictement identique** (contour, rayon max 67,1, profondeur
  centrale 5,0, fond double face vérifiés). `script.js` : 9 424 → **9 306** lignes.
  C'était le prérequis de l'étang agrandi (14.1).
- [x] **Troisième module extrait : `poissons.js`** (v143) — fabrique 3D des poissons,
  peuplement par bancs, spécimens hors norme, respawn, punition après une touche
  ratée. Code **copié tel quel** (mêmes tirages, mêmes poids) ; `horsNormeChance`
  exposé par un lecteur car c'est un nombre. `script.js` : 9 306 → **8 753** lignes,
  cliquet abaissé à 8 800. Vérifié : 20 poissons, 7 espèces, 1 hors norme.
- [x] **Modules suivants extraits (v144)** : `bourriche.js` (66 l.),
  `ondulations.js` (~60 l.), `messages.js` (126 l.), `splashes.js` (~50 l.).
  `script.js` : 8 754 → **8 557** lignes.
- [x] **`etat.js` livré (v144)** : objet partagé + pont de 98 accesseurs dans
  `script.js`. Un module peut écrire `etat.tension = …` et modifier la vraie
  variable **sans renommer** le code existant. C'est le déblocage des modules
  restants (4 règles restantes détaillées dans `docs/modules.md` §8.5).
- [ ] **Blocage résiduel** : les blocs restants (`combat`,
  `comportement`, `bateau`, `boutique`, `fiches`, `lancerPoisson`, `frein`,
  `amorcage`, `carnetUI`, `meteo`, `vie`) **modifient des `let` de `script.js`** :
  un module n'en aurait qu'une copie morte. Déblocage = créer **`etat.js`**
  (objet mutable partagé), renommer ces variables en `etat.x`, puis reprendre les
  extractions. Tableau exact des variables par module dans `docs/modules.md` §8.

Un module = une responsabilité, avec **injection de dépendances** comme le font
déjà `demelage.js` et `quiver.js` (`creerXxx({ canvas, panel, … })`) : aucun accès
direct aux variables globales, donc testable sans navigateur.

- [ ] `environnement.js` — étang : contour par harmoniques, relief/fosses,
  `profondeurLocale`, `rayonEtang`, rive, maillage d'eau et shader.
- [ ] `meteo.js` — cycle jour/nuit, météo (beau / rafales / pluie), vent, et plus
  tard la pression et la température (section 15.1).
- [ ] `poissons.js` — peuplement, déplacement, bancs, vision, zone de vie,
  spécimens hors norme, punition après une touche ratée.
- [ ] `combat.js` — épreuve de force, frein, épuisette (15.3), accrochages
  (vase / nénuphars / futurs obstacles).
- [ ] `boutique.js` — XP, achats, rendu de la boutique (bouchons, scions, esches).
- [ ] `hud.js` — compteurs, panneaux, messages, infobulles, mise en page.
- [ ] `bateau.js` — modèle, textures générées, déplacement, pad tactile.
- [x] `obstacles.js` — ponton, roches, arbres immergés (section 14.2), avec leur
  accrochage et leur attraction de poissons (v174 → v178, 671 lignes).

### 16.3 Règles de découpage (pour rester peu coûteux)

- [ ] **Données séparées de la logique** : tout le contenu (espèces, bouchons,
  scions, esches, obstacles) en fichiers de données purs (`especes.js` est le
  modèle à suivre). Une nouvelle espèce = une ligne de données, pas de la logique.
- [ ] **Un scénario de test par module** (`scenario-<module>.mjs`), branché dans
  `tests/run.mjs` : on peut modifier un module sans relire les autres.
- [ ] **`docs/modules.md`** : tableau *fonctionnalité → fichier → responsabilité →
  lignes max → scénario de test*. Un agent (ou un humain) lit ce tableau puis
  ouvre **un seul** fichier au lieu de fouiller 9,5 k lignes.
- [ ] **Pas de big-bang** : une extraction par livraison, tests verts à chaque fois
  (comme les extractions v106–v108 de `especes.js`, `classement.js`, `carnet.js`).
- [ ] **Garde-fou automatisé** : un test statique (`scenario-static.mjs`) échoue si
  un module dépasse son plafond de lignes → la règle reste vraie dans le temps.
- [ ] **Versions de cache** : conserver `?v=N` sur chaque import (exigence du test
  statique actuel : `sound.js` et `index.html` doivent partager la même version) ;
  centraliser l'incrément pour ne pas l'oublier.

### 16.4 Chargement et packaging de production

- [ ] **Le développement reste sans build** : modules ES natifs, `importmap` déjà en
  place pour `three`. On ouvre `index.html` via un serveur statique, rien d'autre.
- [ ] **Chargement paresseux** (`import()` dynamique) pour les fonctionnalités rares
  ou lourdes : mini-jeu de démêlage, portraits d'espèces, sonar, future épuisette.
  Le téléphone télécharge et évalue moins de code au démarrage.
- [ ] **Build de production optionnel** (jamais une dépendance pour développer ni
  pour tester) : `esbuild` → un fichier minifié + *hash* de contenu dans
  `dist/`, publié sur GitHub Pages. Avantages : un seul aller-retour réseau, cache
  immutable, code source inchangé et lisible.
- [ ] **Assets** : garder les textures/sons CC0 dans `assets/` (KTX2 compressé déjà
  utilisé) et ne jamais inliner de binaire dans le JS.
- [ ] **Mesure du gain** : compter les lignes par module avant/après, et vérifier
  qu'une modification typique ne touche qu'un ou deux fichiers.

### 16.5 Ordre suggéré

1. `environnement.js` (le plus gros bloc, et il bougera avec l'étang agrandi 14.1).
2. `poissons.js` puis `combat.js` (le cœur du jeu, et les futurs 15.1/15.3).
3. `hud.js` et `boutique.js`.
4. `bateau.js`, puis `meteo.js` / `obstacles.js` quand leurs sections arrivent.

> Faire le découpage **avant** l'étang agrandi (14.1) et les fonds (14.3) évite de
> déplacer du code deux fois.
