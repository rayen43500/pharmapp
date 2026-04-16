# MediMirville - Demo complete multi-role

Application Expo React Native (TypeScript) pour mobile et web responsive.

## Documentation projet

- Cahier des charges complet: voir `CAHIER_DES_CHARGES.md`

## Installation

```bash
npm install
```

## Lancement

```bash
npm run web
```

```bash
npm run android
npm run ios
```

## Fonctionnalites integrees

- Authentification commune:
  - Splash screen avec logo, slogan et loader
  - Choix du role (Patient, Pharmacien, Livreur, Admin)
  - Login (email, mot de passe, mot de passe oublie)
  - Register dynamique selon role
  - Auth Google UI (popup + redirection fake)
- Charte UI/UX appliquee:
  - ADN mobile-first, ultra simple et visuel
  - Palette dominante verte (#00C853) + bleu secondaire (#2D9CDB)
  - Fond clair #F7F9FB, textes #1F2937, bordures #E5E7EB
  - Boutons gros et clairs (hauteur 52, radius 12)
  - Cards arrondies radius 16 avec ombres legeres
  - Inputs modernes + search bar ronde
  - Badges status success / warning / error
  - Micro-interactions (press scale 0.97)
- Navigation responsive:
  - Mobile: top bar + bottom navigation
  - Web: sidebar + header dashboard
  - Grille web centree max width 1200
- Interface Patient:
  - Home (recherche, categories, cards, upload ordonnance)
  - Catalogue (filtres prix/disponibilite, ajout panier)
  - Panier (quantite, total, commander)
  - Tracking (status, fake map, ETA)
  - Code securise et profil
- Interface Pharmacien:
  - Dashboard stats
  - Commandes (valider, refuser, detail)
  - Detail commande (infos, code securise fake, assigner livreur)
  - Tracking livraison fake map
  - Profil pharmacie
- Interface Livreur:
  - Dashboard
  - Liste livraisons (distance, prix, ETA)
  - Detail livraison et navigation fake map
  - Actions Arrive pharmacie / Livre
  - Verification compte UI
- Interface Admin:
  - Dashboard global
  - Gestion utilisateurs (suspendre, supprimer, detail)
  - Gestion commandes
  - Rapports avec graphiques fake
- Design system:
  - Couleurs medicales (vert, bleu, blanc, gris clair)
  - Cards, boutons arrondis, inputs modernes
  - Badges status (valide, attente, refuse)
- Simulation sans backend:
  - AsyncStorage pour user, role et panier
  - Donnees fake JSON (produits, commandes)
  - Delais fake avec setTimeout
- Bonus demo:
  - Animation pulse notifications
  - Fake notifications
  - Fake map
  - Fake AI chat

## Fichiers

- App.tsx: application complete de demonstration
- package.json: scripts Expo
