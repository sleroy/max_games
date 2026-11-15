# idées.md — Suivi des idées du jeu de pêche

> Dernière mise à jour : **2026-11-15** · version du jeu : **v126**
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

- [x] **Ragondin voleur, très rare.**
  Apparaît près de la bourriche, 3 clics sur lui pour le chasser, clic prioritaire sur
  le ferrage (scénario 50).
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
