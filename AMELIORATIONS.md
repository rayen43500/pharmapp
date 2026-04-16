# Plan d'amelioration - MediMirville

Ce fichier liste ce que tu dois ameliorer en priorite pour passer d'une demo statique a une app plus solide.

## 1. Priorite haute (fonctionnel)

- Connecter un vrai backend (API) pour:
  - authentification
  - commandes
  - stocks
  - incidents
  - notifications
- Remplacer les donnees mock par des donnees serveur.
- Sauvegarder les etats critiques (session, commandes, profil, statuts).
- Ajouter gestion d'erreurs reseau (timeout, offline, retry, message utilisateur).

## 2. Priorite haute (securite)

- Mettre en place auth JWT/OAuth reelle.
- Ajouter controle d'acces par role cote backend (patient/pharmacien/livreur/admin).
- Chiffrer les donnees sensibles en transit et au repos.
- Journaliser les actions admin de maniere exploitable (audit exportable).

## 3. Priorite moyenne (UX mobile)

- Uniformiser tous les labels en francais (ex: Dashboard/Users/Reports).
- Ajouter etat vide + skeleton loading partout.
- Ajouter pull-to-refresh sur les ecrans listes (commandes, incidents, stock).
- Ajouter confirmation modale pour actions destructives (Supprimer/Suspendre).
- Ameliorer accessibilite:
  - contraste
  - taille min des zones cliquables
  - labels pour lecteur d'ecran

## 4. Priorite moyenne (role Admin)

- Ajouter filtres avances dans Reports:
  - periode
  - statut incident
  - priorite
- Ajouter export CSV/PDF reel (pas mock) avec recap KPI.
- Ajouter pagination pour users/commandes/incidents.
- Ajouter recherche globale admin multi-entites.

## 5. Priorite moyenne (role Pharmacien)

- Workflow validation ordonnance plus strict:
  - verifier format
  - motif de refus
  - historique de validation
- Stock:
  - seuils d'alerte configurables
  - historique mouvements
  - suggestion reappro auto

## 6. Priorite moyenne (role Livreur)

- Integrer carte reelle (Google Maps/Mapbox).
- Tracking GPS en temps reel + ETA calculee.
- Preuve livraison (photo/signature/code OTP).
- Mode hors ligne et resynchronisation.

## 7. Priorite moyenne (role Patient)

- Paiement reel (CB/wallet) avec statut transaction.
- Historique commandes detaille + re-commande.
- Gestion ordonnance multiple (upload, statut, refus/acceptation).
- Support client in-app (chat reel + ticket).

## 8. Qualite technique

- Ajouter tests:
  - unitaires (logique metier)
  - integration (workflows role)
  - e2e (parcours complet)
- Ajouter lint + format auto + CI (build, tests, checks).
- Decouper App.tsx en modules:
  - components
  - screens
  - hooks
  - services
  - types

## 9. Performance

- Virtualiser les longues listes.
- Memoiser composants critiques.
- Optimiser images (taille, cache, fallback).
- Limiter rerenders sur nav et dashboards.

## 10. Roadmap rapide (ordre recommande)

1. Backend auth + roles
2. API commandes + stock + incidents
3. UX erreurs/loading/empty states
4. Tests + CI
5. Export report reel
6. Carte GPS et livraison preuve
7. Refactor App.tsx en architecture modulaire

## Notes

- L'app actuelle est deja bonne en UI demo multi-role.
- Le plus gros gap restant est: donnees reelles + securite + robustesse production.
