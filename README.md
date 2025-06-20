# GS Sync Connect Catalog

Application de synchronisation entre comptes Grand Shooting avec intégration database Notion pour la gestion centralisée des PRD de tous les modules.

## 🚀 Installation

1. **Cloner le dépôt**
```bash
git clone https://github.com/phumblot-gs/gs-sync-connect-catalog.git
cd gs-sync-connect-catalog
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Ajoute ton token Notion dans le fichier .env
```

## 📝 Utilisation

- Initialiser le PRD :
  ```bash
  npm run init-prd
  ```
- Synchroniser vers Notion :
  ```bash
  npm run sync-to-notion
  ```
- Synchroniser depuis Notion :
  ```bash
  npm run sync-from-notion
  ```
- Tester la connexion :
  ```bash
  npm start
  ```

## 🔐 Sécurité & Secrets GitHub

**Ne jamais commiter le fichier `.env` !**

Pour utiliser le token Notion dans GitHub Actions (CI/CD) :
1. Va dans les paramètres du repo > Settings > Secrets and variables > Actions > New repository secret
2. Ajoute un secret nommé `NOTION_TOKEN` avec la valeur de ton token Notion

Tu pourras ensuite y accéder dans tes workflows GitHub Actions via `${{ secrets.NOTION_TOKEN }}`.



## 📁 Structure du projet

```
src/
├── init-prd.js        # Création du PRD initial
└── index.js           # Point d'entrée principal

docs/
├── notion/
│   ├── client.js      # Client API Notion
│   ├── sync.js        # Logique de synchronisation PRD
│   ├── features-*.js  # Logique de synchronisation features
│   └── format-prd.js  # Formatage pour Notion
└── features/          # Documentation des features
    └── *.md           # Fichiers features individuels
```

## 📋 Liens utiles
- [Repo GitHub](https://github.com/phumblot-gs/gs-sync-connect-catalog.git)
- [Notion](https://notion.so/)

## 🔧 Configuration

### Database Notion
Le PRD est synchronisé avec une **database Notion**. Pour mettre en place la synchronisation :
1. Va sur https://developers.notion.com/
2. Crée une intégration "GS Sync Connect Catalog" si elle n'existe pas déjà
3. Copie le token dans une variable d'environnement NOTION_TOKEN dans le fichier `.env`
4. Ajoute au fichier .env la variable d'environnement NOTION_PAGE_ID avec l'ID de la database Notion
5. Initialise le PRD avec la commande `npm run init-prd` et remplis le selon les besoins du projet

### Configuration des databases Notion

Le projet utilise deux databases Notion :

1. **PRD Database** : `216582cb2b9c8045881ae17bc1b78385`
   - Contient le Project Requirement Description principal
   - Champs : Name, Status, Description, Application, Contenu

2. **Features Database** : `1a5582cb2b9c807682bef53c030f683b`
   - Contient la documentation détaillée des features
   - Champs : Name, Status (Draft/Review/Validated/Obsolete), Module, Plans (Free/Growth/Pro/Enterprise), Limite

**Variables d'environnement à configurer :**
```bash
NOTION_TOKEN=your_notion_integration_token
NOTION_PAGE_ID=216582cb2b9c8045881ae17bc1b78385
NOTION_FEATURES_DATABASE_ID=1a5582cb2b9c807682bef53c030f683b
```

## Configuration de l'authentification Google (Supabase)

### 1. Configuration dans le dashboard Supabase

1. **Aller dans Authentication > Providers**
2. **Activer Google** en cliquant sur le toggle
3. **Configurer les credentials Google OAuth** :
   - Client ID : ID de votre application Google OAuth
   - Client Secret : Secret de votre application Google OAuth
4. **Ajouter les URLs de redirection** :
   - `http://localhost:3000/auth/callback` (développement)
   - `https://your-domain.vercel.app/auth/callback` (production)

### 2. Configuration Google OAuth

1. **Aller sur Google Cloud Console** : https://console.cloud.google.com/
2. **Créer un projet** ou sélectionner un projet existant
3. **Activer l'API Google+** (si pas déjà fait)
4. **Créer des credentials OAuth 2.0** :
   - Type : Application Web
   - URLs autorisées : `http://localhost:3000` (dev), `https://your-domain.vercel.app` (prod)
   - URLs de redirection autorisées : `http://localhost:3000/auth/callback` (dev), `https://your-domain.vercel.app/auth/callback` (prod)

### 3. Variables d'environnement

Créer un fichier `.env.local` à la racine avec :

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Grand Shooting API
GRAND_SHOOTING_API_URL=https://api.grand-shooting.com

# JWT Secret for API tokens
JWT_SECRET=your_jwt_secret_here

# Sentry (optionnel)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### 4. Test de l'authentification

1. **Lancer l'application** : `npm run dev`
2. **Aller sur** `http://localhost:3000`
3. **Cliquer sur "Se connecter avec Google"**
4. **Vérifier la redirection** vers le dashboard après connexion

## 🔄 Workflow de développement

### Workflow PRD
1. Modifier le `PRD.md` localement
2. **Optionnel** : Exécuter `npm run format-for-notion` pour normaliser le format avant commit
3. Exécuter `npm run sync-to-notion`
4. Le PRD est automatiquement créé/mis à jour dans ta database Notion
5. L'équipe peut collaborer directement dans l'entrée de la database
6. Synchroniser les changements avec `npm run sync-from-notion`

### Workflow Features
1. Créer une nouvelle feature : `npm run init-feature`
2. Éditer le fichier dans `docs/features/nom-feature.md`
3. Formatter tous les documents avant commit : `npm run format-for-notion`
4. Synchroniser vers Notion : `npm run sync-features-to-notion`
4. L'équipe collabore dans la database Features de Notion
5. Récupérer les changements : `npm run sync-features-from-notion`

### Workflow complet (PRD + Features)
- `npm run sync-all-to-notion` - Synchronise tout vers Notion
- `npm run sync-all-from-notion` - Récupère tout depuis Notion

### Commandes disponibles

- `npm run init-prd` - Initialise le fichier PRD.md
- `npm run init-feature` - **Nouveau** : Crée une nouvelle feature avec template standardisé
- `npm run sync-to-notion` - Synchronise le PRD local vers Notion
- `npm run sync-from-notion` - Synchronise depuis Notion vers le PRD local
- `npm run sync-features-to-notion` - **Nouveau** : Synchronise les features vers Notion
- `npm run sync-features-from-notion` - **Nouveau** : Synchronise les features depuis Notion
- `npm run sync-all-to-notion` - **Nouveau** : Synchronise PRD + features vers Notion
- `npm run sync-all-from-notion` - **Nouveau** : Synchronise PRD + features depuis Notion
- `npm run format-for-notion` - Formate le PRD selon le rendu Notion (évite les diffs parasites)
- `npm run test` - Lance les tests unitaires
- `npm run lint` - Vérifie et corrige le code

## 🧪 Tests & CI/CD

### Tests unitaires
- Les tests unitaires sont écrits avec [Jest](https://jestjs.io/).
- Pour lancer tous les tests :
  ```bash
  npm run test
  ```
- Les tests se trouvent dans `src/__tests__/` ou à côté des modules sous la forme `*.test.js` ou `*.spec.js`.
- La couverture de code est générée dans le dossier `coverage/`.

### Linting
- Vérifie la qualité du code avec ESLint et Prettier :
  ```bash
  npm run lint
  ```

### Intégration continue (CI)
- Un workflow GitHub Actions (`.github/workflows/ci.yml`) exécute automatiquement lint + tests à chaque push ou pull request sur `main` ou `develop`.
- Le badge de statut CI peut être ajouté en haut du README si besoin.

### Objectifs
- 80% de couverture sur le code critique (mapping, transformation, gestion des erreurs)
- 100% sur les fonctions de mapping/transformation
- Déploiement automatique sur Vercel à chaque merge sur `main`

## 📋 Gestion des Features

### Structure des features

Les features sont stockées dans `docs/features/` sous forme de fichiers Markdown avec front matter :

```markdown
<!--
FRONT MATTER - Propriétés synchronisées avec Notion
====================================================
status: Draft | Review | Validated | Obsolete
plans: ["Free", "Growth", "Pro", "Enterprise"]
user_rights: ["Superadmin", "Admin", "Standard", "Restricted", "Guest"]
limite: Texte libre pour décrire les limitations (optionnel)
-->
---
status: Draft
plans: ["Free", "Growth"]
user_rights: ["Admin", "Standard"]
limite: "100 requests/hour"
---

# Nom de la feature

Contenu de la feature...
```

### Champs de métadonnées

- **status** : `Draft`, `Review`, `Validated`, `Obsolete`
- **plans** : Tableau des plans concernés (`Free`, `Growth`, `Pro`, `Enterprise`)
- **user_rights** : Droits utilisateur requis (`Superadmin`, `Admin`, `Standard`, `Restricted`, `Guest`)
- **limite** : Limitations spécifiques (optionnel)

### Template standardisé

Le template inclut automatiquement :
- Vue d'ensemble et objectifs
- Description détaillée avec critères d'acceptation
- Spécifications techniques (architecture, APIs, modèles)
- Spécifications UX/UI
- Tests et validation
- Métriques de succès
- Plan de déploiement
- Ressources et notes

### Synchronisation Notion

Les features sont synchronisées vers une database Notion dédiée avec :
- **Name** : Nom de la feature
- **Status** : Statut (Select)
- **Module** : Nom du projet (GS Sync Connect Catalog)
- **Plans** : Plans concernés (MultiSelect)
- **User Rights** : Droits utilisateur requis (MultiSelect)
- **Limite** : Limitations (Text)

### Exemple d'utilisation

```bash
# Créer une nouvelle feature
npm run init-feature
# Nom : "Authentification OAuth"

# Éditer le fichier créé
# docs/features/authentification-oauth.md

# Synchroniser vers Notion
npm run sync-features-to-notion

# Collaborer dans Notion...

# Récupérer les changements
npm run sync-features-from-notion
```

---

*Ce document sera mis à jour au fur et à mesure du développement du projet.*

## 🚀 Configuration et Déploiement

### 1. Configuration Supabase

1. **Créer un projet Supabase** : https://supabase.com/
2. **Configurer l'authentification Google** (voir section précédente)
3. **Lier le projet** :
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
4. **Appliquer les migrations** :
   ```bash
   supabase db push
   ```

### 2. Variables d'environnement

Créer un fichier `.env.local` à la racine avec :

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Grand Shooting API
GRAND_SHOOTING_API_URL=https://api.grand-shooting.com

# JWT Secret for API tokens
JWT_SECRET=your_jwt_secret_here

# Sentry (optionnel)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### 3. Démarrage en développement

```bash
# Installer les dépendances
npm install

# Lancer le frontend
npm run dev

# Lancer le microservice (dans un autre terminal)
cd microservices/sync-service
npm run dev

# Ou utiliser Docker Compose
docker-compose up -d
```

### 4. Test de l'architecture

1. **Frontend** : http://localhost:3000
2. **Microservice** : http://localhost:3001/health
3. **Edge Function** : Déployée automatiquement sur Supabase

### 5. Déploiement Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod

# Configurer les variables d'environnement dans Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
# etc...
```

## 📊 Architecture mise en place

### ✅ **Composants configurés :**

1. **Frontend Next.js** avec authentification Google
2. **Microservice de synchronisation** (Express + Docker)
3. **Base de données Supabase** avec schéma complet
4. **Edge Function** pour le traitement de la pile
5. **Client API Grand Shooting** avec rate limiting
6. **Système de tokens API** pour les utilisateurs
7. **Middleware d'authentification** pour les API

### 🔄 **Flux de données :**

1. **Webhook** → Edge Function → Pile de traitement → Microservice
2. **Batch** → API → Pile de traitement → Microservice
3. **Frontend** → API Gateway → Base de données

### 🛡️ **Sécurité :**

- Authentification Google OAuth
- Tokens API chiffrés
- Rate limiting API Grand Shooting
- Protection des routes

### 📈 **Prochaines étapes :**

1. **Implémenter la logique de synchronisation** dans le microservice
2. **Créer l'interface de configuration** des synchronisations
3. **Ajouter le monitoring** et les alertes
4. **Configurer les tests** automatisés
5. **Déployer en production** 

## 🏗️ Configuration des 3 Environnements

Le projet est configuré pour fonctionner avec 3 environnements distincts :

### **Environnements disponibles :**

1. **Development** (`NODE_ENV=development`)
   - URL : `http://localhost:3000`
   - Base de données : Supabase Development
   - Authentification : Google OAuth (emails de dev)

2. **Staging** (`NODE_ENV=staging`)
   - URL : `https://staging-gs-sync.vercel.app`
   - Base de données : Supabase Staging
   - Authentification : Google OAuth (emails de test)

3. **Production** (`NODE_ENV=production`)
   - URL : `https://gs-sync.vercel.app`
   - Base de données : Supabase Production
   - Authentification : Google OAuth (emails réels)

### **Configuration rapide :**

```bash
# 1. Créer les 3 projets Supabase (voir docs/environments-setup.md)

# 2. Configurer les variables d'environnement
cp .env.example .env.development
cp .env.example .env.staging  
cp .env.example .env.production

# 3. Lier les projets Supabase
npm run supabase:dev
npm run supabase:staging
npm run supabase:prod

# 4. Déployer
npm run deploy:dev
npm run deploy:staging
npm run deploy:prod
```

### **Scripts disponibles :**

```bash
# Développement
npm run dev                    # Lance en mode development
npm run build:dev             # Build pour development
npm run deploy:dev            # Déploie en development

# Staging
npm run build:staging         # Build pour staging
npm run deploy:staging        # Déploie en staging

# Production
npm run build:prod            # Build pour production
npm run deploy:prod           # Déploie en production

# Supabase
npm run supabase:dev          # Migrations development
npm run supabase:staging      # Migrations staging
npm run supabase:prod         # Migrations production
```

### **Indicateur d'environnement :**

Un banner coloré s'affiche automatiquement en haut de l'écran :
- 🔵 **DEV** (bleu) : Development
- 🟡 **STAGING** (jaune) : Staging  
- 🟢 **PROD** (vert) : Production (pas de banner)

**Documentation complète :** Voir `docs/environments-setup.md` 