# Project Requirement Description (PRD)

## 📋 Informations Générales

- **Nom du projet** : GS Sync Connect Catalog
- **Date de création** : 18/07/2024
- **Responsable produit** : Pierre Humblot-Ferrero

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

- **Frontend** : Next.js (React + TypeScript) déployé sur Vercel
- **Backend/API** : API routes Next.js (serverless functions sur Vercel) pour la gestion des webhooks, des batchs et de l'orchestration
- **Base de données** : PostgreSQL (hébergé sur Supabase)
- **Authentification** : Supabase Auth (Google, email, etc.)
- **Stockage** : Supabase Storage (pour logs, fichiers éventuels)
- **Queue/traitement asynchrone** :
  - Pile des traitements centralisée dans une table PostgreSQL (Supabase)
  - Orchestration via Edge Functions Supabase ou Vercel Cron pour le traitement asynchrone
- **Notifications** : Email (Resend ou SendGrid), Slack (webhooks)
- **Monitoring** : Statistiques et logs stockés dans Supabase, visualisés dans le dashboard Next.js

### Gestion des environnements (dev, test, prod)

- **Variables d'environnement distinctes** pour chaque environnement (URL Supabase, clés API, Notion, etc.)
- **Bases de données séparées** sur Supabase pour dev, test et prod
- **Déploiement** :
  - **Dev** : branches de développement, déploiement preview sur Vercel
  - **Test** : branche dédiée, base de données de test, accès restreint
  - **Prod** : branche main, base de données de production, monitoring renforcé
- **Secrets** : stockés dans Vercel (Environment Variables) et Supabase (Project Settings)
- **CI/CD** : GitHub Actions pour automatiser les tests et le déploiement

### Gestion de la pile des traitements (webhook & batch)

- **Pile centralisée** :
  - Une table PostgreSQL "processing_queue" stocke tous les jobs à traiter (création, modification, suppression)
  - Chaque job contient : type (webhook/batch), id de la synchronisation, payload, statut, timestamps, nombre de tentatives
- **Alimentation de la pile** :
  - **Webhooks** : chaque notification Grand Shooting crée un job dans la pile
  - **Batchs** : chaque import programmé via l'API Grand Shooting crée un ou plusieurs jobs dans la pile
- **Traitement asynchrone** :
  - Un worker (Edge Function Supabase ou Cron Vercel) traite la pile par lots, en respectant un quota de jobs par synchronisation active
  - Un système de "fair scheduling" garantit qu'aucune synchronisation ne monopolise toutes les ressources :
    - Le worker sélectionne à chaque itération un nombre limité de jobs par synchronisation (round-robin)
    - Les jobs en échec sont réessayés une fois (1 retry maximum), puis marqués en erreur
- **Scalabilité** :
  - Le traitement est stateless, plusieurs workers peuvent tourner en parallèle
  - Les verrous sont gérés au niveau de la base (row-level locking) pour éviter les conflits
- **Monitoring** :
  - Dashboard temps réel sur l'état de la pile, les jobs en cours, les erreurs, la volumétrie par synchronisation
  - Alertes email/Slack en cas de blocage ou d'erreur répétée
  - historique du nombre de messages reçus et traités par heure et par compte principal conservé sans limite de temps.
- **indexation, purge et monitoring** :
- La pile (table PostgreSQL) est indexée pour garantir la performance.
- Les traitements de plus de 7 jours sont automatiquement purgés de la pile.

### Authentification à l'API Grand Shooting (batch)

- Pour chaque synchronisation par batch, la connexion à l'API Grand Shooting se fait avec **deux tokens Bearer distincts** :
  - Un token Bearer pour le compte principal (lecture du catalogue source)
  - Un token Bearer pour le compte secondaire (écriture dans le catalogue cible)
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

- **Connexion à l'API Grand Shooting** :
  - L'authentification pour la synchronisation (batch ou webhook) se fait uniquement par **token Bearer** (clé API fournie par Grand Shooting pour chaque compte principal et secondaire).
  - Il n'y a pas d'utilisation d'OAuth pour accéder à l'API Grand Shooting.
- **Connexion des utilisateurs à l'interface de gestion** :
  - L'authentification des utilisateurs humains (accès au frontend, gestion des synchronisations, monitoring) se fait via **OAuth** (Google, etc.) grâce à Supabase Auth.
  - Cela permet une gestion sécurisée et moderne des accès utilisateurs, indépendante des tokens API utilisés pour la synchronisation.

### Gestion des erreurs et des retries

- En cas d'erreur (code de retour ≠ 2xx ou erreur de format), un seul retry est effectué pour éviter tout risque de DDoS.
- Les logs conservent les messages en erreur pendant 7 jours pour permettre un éventuel replay manuel.

### Gestion des alertes (email & Slack)

- Une alerte est déclenchée dès la première erreur ou si la pile dépasse 10 000 traitements en attente.
- Chaque utilisateur peut choisir de recevoir ou non les emails d'alerte.
- Au maximum 1 alerte est envoyée par heure à chaque utilisateur
- Les alertes contiennent les informations nécessaires au diagnostic (comptes concernés, volumétrie, logs).


## 📊 Spécifications des Données

### Structure des Références à synchroniser

Chaque synchronisation traite des listes de références issues du catalogue principal, transmises soit par webhook, soit par appel batch à l'API Grand Shooting (`/reference`). Exemple de structure :

```json
[
  {
    "reference_id": 12,
    "ref": "FW19_ALDA_PINK",
    "ean": "2309309834098",
    "eans": ["2309309834093", "2309309834091"],
    "eans_extended": [
      {
        "ean": "2309309834093",
        "smalltext": "2309309834093 L",
        "star": true,
        "extra": { "sku": "19874LKKHZG", "size": "L" }
      }
    ],
    "univers": "RTW",
    "gamme": "Accessories",
    "family": "Handbags",
    "sku": "EPOIAPOIJKLH109384",
    "brand": "BATCHEMON",
    "smalltext": "Pink leather handbag Alda",
    "product_ref": "FW19_ALDA",
    "product_smalltext": "Leather handbag Alda",
    "gender": "Woman",
    "color": "PINK",
    "hexa_color": "#FFC0CB",
    "size": "L",
    "collection": "FW19",
    "comment": "Closeup on zip",
    "tags": ["urgent", "leather"],
    "online": "20/12/2019",
    "extra": {
      "composition": ["30% coton", "beef leather"]
    }
  }
]
```

- Un compte principal peut contenir plusieurs **millions de références**.
- Jusqu'à **plusieurs milliers de références à synchroniser par jour**.
- Les synchronisations peuvent être déclenchées par webhook (notification temps réel) ou par batch (API Grand Shooting).

### Gestion des comptes et synchronisations

- **Compte Grand Shooting** :
  - `account_id` (identifiant unique)
  - `api_key` (clé API)
  - `client_name` (nom du client)
  - Rôle : principal ou secondaire
- **Synchronisation** :
  - Active ou non
  - Liée à un compte principal et un ou plusieurs comptes secondaires
  - Paramétrage des modes (webhook, batch, ou les deux)
  - Fréquence et planification des batchs
  - Statut, logs, volumétrie, erreurs

### Gestion des utilisateurs et droits

- **Utilisateur** :
  - Identité (email, nom)
  - Rôle : `standard` ou `admin`
    - `admin` : gestion des accès utilisateurs, création/modification/suppression des synchronisations
    - `standard` : accès à la consultation, monitoring, relance de synchronisation
- Les opérations de configuration sont strictement réservées aux admins.
- Authentification via Supabase Auth (Google, email, etc.)
- Gestion des permissions et audit des actions sensibles

### Gestion du mapping des champs (principal → secondaire)

Pour chaque synchronisation, il est nécessaire de définir un mapping entre les champs du compte principal et ceux du compte secondaire. Ce mapping permet d'adapter la structure des données, de gérer les différences de nomenclature ou de format, et d'appliquer des règles de transformation si besoin.

- **Structure du mapping** :
  - Pour chaque synchronisation, une table ou un objet de mapping est associé, par exemple :

```json
{
  "reference_id": "reference_id",
  "ref": "ref",
  "ean": "ean_secondaire",
  "brand": "marque",
  "color": "couleur",
  "size": "taille",
  "extra.composition": "composition_matiere",
  // ...
}
```

- **Règles de transformation** :
  - Possibilité de définir des fonctions de transformation ou de formatage (ex : concaténation, conversion de casse, mapping de valeurs, etc.)
  - Exemple :
    - `color` (principal) → `couleur` (secondaire), avec conversion en majuscules
    - `tags` (array) → `tags_concat` (string), avec jointure par virgule

- **Gestion dynamique** :
  - Le mapping doit être modifiable via l'interface de configuration
  - Les mappings sont stockés en base (table dédiée ou champ JSON dans la config de synchronisation)
  - Historique des modifications de mapping pour audit

- **Validation** :
  - Vérification de la cohérence du mapping avant activation d'une synchronisation
  - Alertes en cas de champ manquant ou de conflit de type

## 🔄 Flux de Synchronisation

1. **Configuration initiale**
   - Paramétrage des synchronisations : compte principal et compte secondaire
   - Définition des règles de filtrage (par défaut pas de filtrage)
   - Mapping des champs (par défaut pas de mapping pour une synchronisation sans modification)
   - Définition des règles de transformation (par défaut pas de transformation)

2. **Synchronisation en temps réel**
   - Webhooks pour les modifications
   - Application des règles de filtrage
   - Queue de traitement asynchrone
   - Filtrage, Mapping et transformation des données

3. **Synchronisation batch**
   - Récupération des dernières données modifiées sur le compte principal (delta)
   - Application des règles de filtrage
   - Queue de traitement asynchrone
   
4. **Traitement de la Queue de traitement**
   - regroupement des traitements par paquets de taille < N traitements destinés à un même compte secondaire
   - mapping et transformation selon la configuration de la synchronisation associée aux traitements
   - Envoi vers le compte cible avec retry
   - Loggin détaillé des opérations

5. **Monitoring et reporting**
   - Calcul des métriques en temps réel
   - Génération de rapports quotidiens
   - Possibilité de rejouer des traitements exécutés ou en erreur

## 🛡️ Sécurité et Conformité

- [ ] Chiffrement des tokens API (AES-256)
- [ ] Audit trail complet des modifications
- [ ] Gestion des permissions utilisateurs (RBAC)
- [ ] Backup automatique des configurations
- [ ] Conformité RGPD pour les données personnelles

## 📅 Planning et Milestones

### Phase 1 : Foundation (Semaine 1-2)

- [ ] Architecture technique et choix technologiques
- [ ] Configuration projet et environnements
- [ ] Intégration API Grand Shooting (analyse + tests)
- [ ] Interface de connexion et authentification

### Phase 2 : Core Features (Semaine 3-4)

- [ ] Moteur de synchronisation basique
- [ ] Interface de configuration des mappings
- [ ] Système de logs et audit trail
- [ ] Tests unitaires et d'intégration

### Phase 3 : Advanced Features (Semaine 5-6)

- [ ] Dashboard de monitoring avec métriques
- [ ] Gestion avancée des conflits
- [ ] Système d'alertes et notifications
- [ ] API REST pour l'administration

### Phase 4 : Production (Semaine 7-8)

- [ ] Tests de charge et performance
- [ ] Documentation complète (utilisateur + technique)
- [ ] Configuration de production et CI/CD
- [ ] Formation utilisateurs et go-live

## 🧪 Critères d'Acceptation

- [ ] Synchronisation réussie entre deux comptes test (99.9% fiabilité)
- [ ] Interface utilisateur intuitive (score UX > 4/5)
- [ ] Monitoring en temps réel fonctionnel (latence < 1s)
- [ ] Gestion d'erreurs robuste (auto-recovery > 95%)
- [ ] Performance acceptable (< 5s pour sync standard, < 30s pour batch)

## 📈 Métriques de Succès

- **Fiabilité** : 99.9% de synchronisations réussies
- **Performance** : Traitement de 1000 enregistrements/minute
- **Adoption** : 90% des utilisateurs configurent une sync en < 10 min
- **Satisfaction** : Score NPS > 50

## 📚 Ressources et Documentation

- [ ] Documentation API Grand Shooting
- [ ] Guide utilisateur avec captures d'écran
- [ ] Documentation technique (architecture + déploiement)
- [ ] Runbook de maintenance et troubleshooting
- [ ] Formation vidéo pour les utilisateurs finaux

## 🔗 Liens Utiles

- **Repository** : https://github.com/grandshooting/gs-sync-connect-catalog
- **Notion Workspace** : https://notion.so/grandshooting/
- **Documentation API** : https://api.grand-shooting.com/
- **Environnement de test** : [URL à configurer]
- **Monitoring** : [URL dashboard de monitoring]

---
*Ce document est synchronisé automatiquement avec Notion et sera mis à jour régulièrement pendant le développement du projet.*