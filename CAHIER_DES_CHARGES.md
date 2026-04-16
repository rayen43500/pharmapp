# Cahier des Charges
## Plateforme de Livraison de Medicaments et Produits de Sante

## 1. Objectif
Concevoir une plateforme digitale complete (application mobile et site web responsive) permettant la livraison securisee de medicaments, de produits de sante et de parapharmacie.

La plateforme doit connecter quatre profils d'utilisateurs:
- Pharmaciens
- Patients et professionnels de sante
- Livreurs
- Administrateurs

Le systeme doit garantir la tracabilite, la securite des echanges et la conformite reglementaire (notamment RGPD).

## 2. Publics cibles
### 2.1 Pharmaciens
- Gerer les commandes
- Verifier et valider les ordonnances
- Suivre les livraisons en temps reel
- Acceder rapidement aux informations utiles des patients

### 2.2 Patients et professionnels
- Commander des medicaments et produits de parapharmacie
- Suivre la livraison en temps reel
- Saisir et gerer leurs informations personnelles de maniere securisee

### 2.3 Livreurs
- Recevoir les commandes validees
- Acheminer les colis selon des regles de securite strictes
- Confirmer chaque etape de la livraison
- Respecter un processus de validation prealable obligatoire (identite, formation, statut legal)

### 2.4 Administrateurs
- Superviser l'ensemble de la plateforme
- Gerer les comptes utilisateurs
- Controler les ordonnances et donnees sous regles d'acces strictes
- Assurer le suivi des incidents, de la conformite et de l'audit

## 3. Fonctionnalites principales
### 3.1 Interface Pharmacien
- Creation et gestion de compte avec verification du numero RPPS
- Notifications sonores et visuelles a chaque nouvelle commande
- Reception et verification des ordonnances et documents associes
- Validation ou refus des commandes
- Attribution automatique de la commande au livreur disponible le plus proche
- Visualisation en temps reel du livreur sur carte et estimation d'arrivee
- Confirmation de recuperation du colis par le livreur et suivi jusqu'a la livraison
- Gestion d'un code securise a usage unique pour le deverrouillage du colis (genere par algorithme cryptographique)
- Acces rapide aux informations patient (numero de securite sociale, mutuelle)
- Blocage possible de creation de compte patient en cas d'informations obligatoires manquantes ou invalides

### 3.2 Interface Livreur
- Creation et gestion de compte livreur
- Verification d'identite obligatoire lors de l'inscription
- Suspension automatique du compte jusqu'a validation des prerequis:
  - Entretien de recrutement
  - Formation obligatoire (livraison pharmaceutique et securite)
  - Verification du statut auto-entrepreneur ou equivalent legal
- Reception des commandes validees avec details (tarif, ETA, photos des produits)
- Navigation GPS jusqu'a la pharmacie puis jusqu'au client
- Confirmation de la recuperation et de la remise finale
- Mise a jour en temps reel du statut visible par pharmacien et patient

### 3.3 Interface Patient / Professionnel
- Creation et gestion de compte utilisateur
- Saisie obligatoire du numero de securite sociale et des informations mutuelle
- Paiement en ligne securise (CB, portefeuille electronique)
- Suivi GPS du livreur en temps reel avec photos de preuve
- Communication avec la plateforme via assistant IA ou email (pas de contact direct avec le livreur)
- Saisie d'un code securise fourni pour la remise du colis
- Acces a un onglet parapharmacie: catalogue, photos, prix, disponibilite

### 3.4 Interface Administrateur
- Gestion complete des utilisateurs (creation, modification, suspension, suppression)
- Acces aux ordonnances et donnees sensibles selon habilitations, journalisation et finalite de controle legal
- Visualisation globale des commandes (en cours, livrees, annulees)
- Suivi en temps reel des activites livreurs
- Historique et audit des actions utilisateurs (tracabilite RGPD)
- Generation de rapports et statistiques
- Gestion des incidents et des litiges

## 4. Securite, confidentialite et conformite
- Conformite RGPD: information claire, consentement explicite, droit d'acces et de suppression
- Chiffrement des donnees sensibles (ordonnances, donnees patient, donnees de paiement)
- Authentification forte et controle d'acces par role
- Validation pharmacien obligatoire avant toute livraison
- Code a usage unique pour la remise des medicaments
- Acces administrateur strictement controle, limite et journalise
- Conservation des journaux d'audit selon une politique de retention definie

## 5. Design et ergonomie
- Interface responsive: mobile, tablette, desktop
- Parcours simple, clair et adapte a chaque profil
- Notifications et alertes visuelles/sonores
- Palette de couleurs coherente et apaisante, avec identification claire des espaces par role
- Catalogue parapharmacie visuel (photos, descriptions, prix)
- Accessibilite: contrastes, tailles de texte lisibles, navigation intuitive

## 6. Suivi, reporting et tracabilite
- Historique complet des commandes par utilisateur
- Statistiques pour pharmaciens et administrateurs:
  - Nombre de commandes traitees
  - Temps moyen de livraison
  - Taux de refus/annulation
  - Activite des livreurs
- Suivi temps reel des livreurs
- Gestion des retours et incidents
- Audit complet des acces et modifications

## 7. Technologies suggerees
- Application mobile: React Native (Expo) ou Flutter
- Site web responsive: React, Angular ou Vue
- Backend securise: Node.js (NestJS/Express), Django ou Laravel
- Base de donnees: PostgreSQL ou MongoDB avec chiffrement des champs sensibles
- Paiement: Stripe ou PayPal
- Cartographie et tracking: Google Maps ou Mapbox
- Notification push: Firebase Cloud Messaging / APNs

## 8. Annexes et evolutions futures
- Assistant IA pour support client et automatisation de taches repetitives
- Notifications push personnalisables
- Programme de fidelite / abonnement
- Gestion multi-pharmacies
- Historique medical et rappels de renouvellement (avec consentement explicite)

## 9. Criteres de reussite (KPI)
- Taux de livraison reussie
- Delai moyen de livraison
- Taux d'incidents par commande
- Taux de satisfaction utilisateur
- Taux de conformite des dossiers utilisateurs (donnees obligatoires completes)
- Disponibilite de la plateforme (SLA)

## 10. Livrables attendus
- Application mobile iOS/Android
- Site web responsive
- Back-office administrateur
- API securisee et documentee
- Documentation technique et fonctionnelle
- Plan de tests (fonctionnels, securite, performance)
- Plan de mise en production et de maintenance
