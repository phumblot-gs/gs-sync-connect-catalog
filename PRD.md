# Project Requirement Description (PRD)

## 📋 Informations Générales

- Nom du projet : GS Sync Connect Catalog
- Date de création : 18/07/2024
- Responsable produit : Pierre Humblot-Ferrero
## 🎯 Objectif du Projet

Service de synchronisation unidirectionnelle des données entre deux comptes Grand Shooting via API, avec interface de gestion et monitoring. 

Dans certains cas, un client peut avoir plusieurs comptes Grand Shooting. Pour ce type de client, il peut être intéressant de synchroniser les catalogues entre les différents comptes Grand Shooting, de telle sorte que le compte principal soit régulièrement mis à jour avec les données catalogues du client et que ces mises à jour soient répercutées au fil du lot sur les autres comptes Grand Shooting. 

La synchronisation est donc unidirectionnelle. Les données du compte principal sont synchronisées vers un compte secondaire. Si jamais le client possède plusieurs comptes secondaires, la mise à jour est en étoile, c'est-à-dire qu'il faut créer autant de synchronisations entre le compte principal et tous les comptes secondaires associés à ce compte principal.

Le mécanisme de synchronisation s'appuie sur les webhooks Grand Shooting pour la création, la modification et la suppression de références dans le catalogue du compte principal. Ce module de synchronisation expose donc une API qui accepte les notifications du webhook. Les notifications sont prises en charge dans une pile, traitées au fil de l'eau, pour mettre à jour le compte secondaire.

le mécanisme de synchronisation s'appuie aussi sur l'API Grand Shooting pour requêter le compte principal à fréquence paramétrable pour mettre à jour par batch le compte secondaire. Les 2 mécanismes peuvent être actifs simultanément ou il est possible de n'activer qu'un seul des 2 mécanismes. le paramétrage est défini à la maille d'une synchronisation.

Le service de synchronisation propose également une fonction d'initialisation qui consiste à réinitialiser le catalogue du compte secondaire avec l'intégralité du catalogue du compte principal. 

## 📖 Description Détaillée

Ce projet comprend un frontend qui permet de :

- Configurer des synchronisations entre un compte principal Grand Shooting et un compte secondaire
- Initialiser le catalogue d'un compte secondaire
- Suivre les volumétries de données synchronisées au fil du temps sur chaque configuration
- Rejouer la synchronisation sur les 7 derniers jours
- Gérer les accès utilisateurs au frontend
Le service permet de :

- Enregistrer dans une pile les webhooks qui notifient les mises à jours sur le catalogue d'un compte principal (ajout, modification et suppression)
- Appliquer les mises à jour au compte secondaire en respectant les contrainte de API rate limiting
- Centraliser les erreurs lorsque les mises à jour renvoient des codes autres que 2xx.
- Implémenter un mécanisme de retry limité à 1 essai (si le retry échoue la mise à jour est abandonnée).
- Envoyer un email aux utilisateurs qui ont accès au frontend pour alerter lorsqu'il y a des erreurs
- Monitorer les volumes de données synchronisées
## 🔧 Fonctionnalités Principales

### Frontend : Interface Principale

- [x] Authentification via Google Auth
- [x] Dashboard avec liste des synchronisations actives et état de la pile de traitements
- [x] Détails d'une synchronisation : volumétrie et réinitialisation du catalogue
- [ ] Logs des traitements exécutés sur les 7 derniers jours et redo de traitements
- [ ] Logs des erreurs de traitements sur les 7 derniers jours redo de traitements
### Frontend : Interface de Configuration

- [ ] Connexion aux comptes Grand Shooting (authentification API)
- [ ] Configuration des règles de filtrage (règles pour l'exclusion ou pour l'inclusion de messages)
- [ ] Mapping des champs entre les deux comptes
- [ ] Activation de l'API pour la prise en charge des webhooks sur une synchronisation au fil de l'eau
- [ ] Activation et Planification des synchronisations par batch (fréquence, horaires)
- [ ] Configuration des alertes email et slack
### Moteur de Synchronisation

- [ ] Synchronisation unidirectionnelle des données
- [ ] Gestion des conflits de données
- [ ] Système de retry en cas d'échec (1 retry maximum)
- [ ] Logs détaillés des traitements exécutés
- [ ] Logs détaillés des traitements en erreur
- [ ] Envoi des alertes en cas d'erreur (emails et slack)
### Dashboard de Monitoring

- [ ] Vue d'ensemble des synchronisations actives
- [ ] Statistiques des volumes de données par jour et par synchronisation active
- [ ] Alertes en cas d'erreur
- [ ] Historique des synchronisations
## 🏗️ Architecture Technique

### Stack Générale

- Frontend : Next.js (React + TypeScript) déployé sur Vercel
- Backend/API : API routes Next.js (serverless functions sur Vercel) pour la gestion des webhooks, des batchs et de l'orchestration
- Base de données : PostgreSQL (hébergé sur Supabase)
- Authentification : Supabase Auth (Google, email, etc.)
- Stockage : Supabase Storage (pour logs, fichiers éventuels)
- Queue/traitement asynchrone :
- Notifications : Email (Resend ou SendGrid), Slack (webhooks)
- Monitoring : Statistiques et logs stockés dans Supabase, visualisés dans le dashboard Next.js
### Gestion des environnements (dev, test, prod)

- Variables d'environnement distinctes pour chaque environnement (URL Supabase, clés API, Notion, etc.)
- Bases de données séparées sur Supabase pour dev, test et prod
- Déploiement :
- Secrets : stockés dans Vercel (Environment Variables) et Supabase (Project Settings)
- CI/CD : GitHub Actions pour automatiser les tests et le déploiement
### Gestion de la pile des traitements (webhook & batch)

- Pile centralisée :
- Alimentation de la pile :
- Traitement asynchrone :
- Scalabilité :
- Monitoring :
- indexation, purge et monitoring :
- La pile (table PostgreSQL) est indexée pour garantir la performance.
- Les traitements de plus de 7 jours sont automatiquement purgés de la pile.
### Authentification à l'API Grand Shooting (batch)

- Pour chaque synchronisation par batch, la connexion à l'API Grand Shooting se fait avec deux tokens Bearer distincts :
- Les tokens sont stockés de façon sécurisée (chiffrés en base, jamais exposés côté client)
- Chaque synchronisation référence explicitement les deux tokens nécessaires à son exécution
### Sécurisation des tokens API

- Les tokens Bearer sont chiffrés en base avec AES256.
- Pas de rotation automatique : l'âge des clés est affiché pour information.
### Rate limiting API Grand Shooting

- L'API Grand Shooting impose une limite de 4 requêtes par seconde et par compte (principal ou secondaire).
- Le moteur de synchronisation doit respecter ce quota pour chaque compte. 
### Règles de mapping

- Seules les règles prédéfinies sont autorisées (voir documentation feature mapping).
- Toute exécution de code JS pour transformation doit être sandboxée.
### Authentification : clarification

- Connexion à l'API Grand Shooting :
- Connexion des utilisateurs à l'interface de gestion :
### Gestion des erreurs et des retries

- En cas d'erreur (code de retour ≠ 2xx ou erreur de format), un seul retry est effectué pour éviter tout risque de DDoS.
- Les logs conservent les messages en erreur pendant 7 jours pour permettre un éventuel replay manuel.
### Gestion des alertes (email & Slack)

- Une alerte est déclenchée dès la première erreur ou si la pile dépasse 10 000 traitements en attente.
- Chaque utilisateur peut choisir de recevoir ou non les emails d'alerte.
- Au maximum 1 alerte est envoyée par heure à chaque utilisateur