# Minecraft JS - Version Online

Un jeu Minecraft complet en JavaScript/Three.js, déployable en ligne sans besoin de localhost !

## 🎮 Fonctionnalités

### 🏗️ Construction
- **4 types de blocs** : Herbe, Terre, Pierre, Bois
- **Placement et destruction** avec souris (clic gauche/droit)
- **Textures Minecraft** authentiques procédurales
- **Sélection de blocs** avec les touches 1-4

### 🌙 Mode Survie Complet
- **Day/Night Cycle** de 90 secondes avec changements de ciel
- **Système de faim et de vie** complet
- **Dégâts de chute** et de faim
- **Mort et respawn** avec reset des stats
- **Vitesse de mouvement** basée sur la faim

### 🧟 Monstres et Combat
- **Zombies** : Monstres basiques (20 HP, 2 dégâts)
- **Squelettes** : Plus rapides et puissants (15 HP, 3 dégâts)
- **Araignées** : Très rapides mais faibles (10 HP, 1.5 dégâts)
- **Creeper** : Explosifs dangereux (30 HP, 10 dégâts)
- **IA de poursuite** et attaques au corps à corps

### 🔨 Système de Crafting
- Interface de craft avec barre de progression
- Bouton "Craft" pour lancer le processus
- Recettes : Herbe → Bois, Terre → Pierre
- Feedback visuel et messages d'état

### 🎨 Interface et UI
- **HUD complet** avec stats de survie
- **Inventory** avec sélection de blocs
- **Menu principal** avec instructions
- **Messages système** pour les événements
- **Effets visuels** de dégâts et nuit

## 🚀 Déploiement sur GitHub Pages

### 1. Créer un dépôt GitHub
```bash
# Sur GitHub.com, créez un nouveau dépôt
# Nom : votre-nom.github.io/minecraft-online
# Ne cochez pas "Add README" (nous allons pousser nos fichiers)
```

### 2. Initialiser Git localement
```bash
cd minecraft-online
git init
git add .
git commit -m "Initial commit - Minecraft JS Online"
```

### 3. Lier au dépôt distant
```bash
git remote add origin https://github.com/votre-nom/votre-nom.github.io.git
# OU pour un dépôt séparé :
# git remote add origin https://github.com/votre-nom/minecraft-online.git
```

### 4. Pousser sur GitHub
```bash
git branch -M main
git push -u origin main
```

### 5. Activer GitHub Pages
1. Allez dans les **Settings** de votre dépôt
2. Descendez jusqu'à **Pages**
3. Sélectionnez la branche `main` et le dossier `/ (root)`
4. Cliquez sur **Save**

### 6. Accéder à votre jeu
Votre jeu sera disponible à :
- `https://votre-nom.github.io/` (si dépôt racine)
- `https://votre-nom.github.io/minecraft-online/` (si dépôt séparé)

## 🎯 Contrôles

### Mouvement
- **WASD** - Se déplacer
- **Espace** - Sauter
- **Shift** - Sprint (si assez de faim)

### Construction
- **Clic Gauche** - Casser un bloc
- **Clic Droit** - Placer un bloc
- **1-4** - Changer de type de bloc

### Interface
- **Craft** - Système de craft avancé
- **Stats** - Affichage de la vie et de la faim
- **Position** - Coordonnées du joueur

## 🌐 Technologies

- **Three.js** - Moteur 3D
- **JavaScript ES6+** - Programmation
- **CSS3** - Styles et animations
- **HTML5** - Structure
- **GitHub Pages** - Hébergement gratuit

## 📱 Compatible Mobile

Le jeu est responsive et fonctionne sur :
- Ordinateurs de bureau
- Tablettes
- Smartphones

## 🔧 Personnalisation

### Ajouter des blocs
Modifiez `config.blockTypes` et `materials` dans `game.html`

### Modifier les monstres
Ajustez `monsterTypes` pour changer apparence et comportement

### Changer le cycle jour/nuit
Modifiez `dayNightConfig.dayDuration` et `dayNightConfig.nightDuration`

## 🎉 Profitez !

Une fois déployé, partagez simplement l'URL avec vos amis pour jouer ensemble (chaque personne a sa propre session) !

## 📄 Licence

MIT License - Libre d'utiliser et de modifier !