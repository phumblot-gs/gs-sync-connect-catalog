# Configuration des Environnements Supabase

## 🎯 Vue d'ensemble

Nous allons créer 3 projets Supabase distincts :
- **Development** : Pour le développement local
- **Staging** : Pour les tests et la validation
- **Production** : Pour l'application en production

---

## 📋 Étape 1 : Créer les projets Supabase

### 1.1 Projet Development
1. Aller sur https://supabase.com/
2. Cliquer sur "New Project"
3. **Nom** : `gs-sync-connect-dev`
4. **Database Password** : Générer un mot de passe sécurisé
5. **Region** : Choisir la région la plus proche
6. Cliquer sur "Create new project"

### 1.2 Projet Staging  
1. Cliquer sur "New Project"
2. **Nom** : `gs-sync-connect-staging`
3. **Database Password** : Générer un mot de passe sécurisé
4. **Region** : Même région que dev
5. Cliquer sur "Create new project"

### 1.3 Projet Production
1. Cliquer sur "New Project"
2. **Nom** : `gs-sync-connect-prod`
3. **Database Password** : Générer un mot de passe très sécurisé
4. **Region** : Même région que les autres
5. Cliquer sur "Create new project"

---

## 🔐 Étape 2 : Configurer l'authentification Google

### 2.1 Configuration Google OAuth (pour chaque environnement)

#### Development
1. Aller dans **Authentication > Providers**
2. Activer **Google**
3. **Client ID** : `dev-google-client-id`
4. **Client Secret** : `dev-google-client-secret`
5. **Redirect URLs** :
   - `http://localhost:3000/auth/callback`
   - `https://dev-gs-sync-connect.vercel.app/auth/callback`

#### Staging
1. Aller dans **Authentication > Providers**
2. Activer **Google**
3. **Client ID** : `staging-google-client-id`
4. **Client Secret** : `staging-google-client-secret`
5. **Redirect URLs** :
   - `https://staging-gs-sync-connect.vercel.app/auth/callback`

#### Production
1. Aller dans **Authentication > Providers**
2. Activer **Google**
3. **Client ID** : `prod-google-client-id`
4. **Client Secret** : `prod-google-client-secret`
5. **Redirect URLs** :
   - `https://gs-sync-connect.vercel.app/auth/callback`

### 2.2 Configuration Google Cloud Console

1. Aller sur https://console.cloud.google.com/
2. Créer 3 applications OAuth 2.0 :
   - `gs-sync-dev`
   - `gs-sync-staging`
   - `gs-sync-prod`

3. Pour chaque application, configurer :
   - **Type** : Application Web
   - **URLs autorisées** : URLs correspondantes
   - **URLs de redirection** : URLs de callback

---

## 🔗 Étape 3 : Lier les projets avec Supabase CLI

### 3.1 Récupérer les Project Refs

Pour chaque projet, aller dans **Settings > General** et noter le **Reference ID**.

### 3.2 Configuration locale

```bash
# Créer les fichiers de configuration par environnement
mkdir -p supabase/config

# Development
supabase link --project-ref DEV_PROJECT_REF
supabase db push

# Staging  
supabase link --project-ref STAGING_PROJECT_REF
supabase db push

# Production
supabase link --project-ref PROD_PROJECT_REF
supabase db push
```

---

## 🌍 Étape 4 : Configuration des variables d'environnement

### 4.1 Fichiers .env par environnement

#### .env.development
```bash
NODE_ENV=development
NEXT_PUBLIC_SUPABASE_URL=https://dev-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev_anon_key
SUPABASE_SERVICE_ROLE_KEY=dev_service_role_key
GRAND_SHOOTING_API_URL=https://api.grand-shooting.com
JWT_SECRET=dev_jwt_secret_here
NEXT_PUBLIC_SENTRY_DSN=dev_sentry_dsn
```

#### .env.staging
```bash
NODE_ENV=staging
NEXT_PUBLIC_SUPABASE_URL=https://staging-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging_anon_key
SUPABASE_SERVICE_ROLE_KEY=staging_service_role_key
GRAND_SHOOTING_API_URL=https://api.grand-shooting.com
JWT_SECRET=staging_jwt_secret_here
NEXT_PUBLIC_SENTRY_DSN=staging_sentry_dsn
```

#### .env.production
```bash
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://prod-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=prod_service_role_key
GRAND_SHOOTING_API_URL=https://api.grand-shooting.com
JWT_SECRET=prod_jwt_secret_here
NEXT_PUBLIC_SENTRY_DSN=prod_sentry_dsn
```

### 4.2 Configuration Next.js

```typescript
// next.config.ts
const nextConfig = {
  env: {
    NODE_ENV: process.env.NODE_ENV || 'development',
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
}

export default nextConfig
```

---

## 🚀 Étape 5 : Configuration Vercel

### 5.1 Créer 3 projets Vercel

```bash
# Development
vercel --env NODE_ENV=development

# Staging
vercel --env NODE_ENV=staging

# Production  
vercel --env NODE_ENV=production
```

### 5.2 Variables d'environnement Vercel

Pour chaque projet Vercel, configurer les variables :

```bash
# Development
vercel env add NEXT_PUBLIC_SUPABASE_URL development
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development
vercel env add SUPABASE_SERVICE_ROLE_KEY development
vercel env add JWT_SECRET development

# Staging
vercel env add NEXT_PUBLIC_SUPABASE_URL staging
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY staging
vercel env add SUPABASE_SERVICE_ROLE_KEY staging
vercel env add JWT_SECRET staging

# Production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add JWT_SECRET production
```

---

## 🔄 Étape 6 : Workflow de développement

### 6.1 Branches Git

```bash
# Branche de développement
git checkout -b develop

# Branche de staging
git checkout -b staging

# Branche de production
git checkout main
```

### 6.2 Scripts de déploiement

```json
// package.json
{
  "scripts": {
    "dev": "NODE_ENV=development next dev",
    "build:dev": "NODE_ENV=development next build",
    "build:staging": "NODE_ENV=staging next build",
    "build:prod": "NODE_ENV=production next build",
    "deploy:dev": "vercel --env NODE_ENV=development",
    "deploy:staging": "vercel --env NODE_ENV=staging",
    "deploy:prod": "vercel --env NODE_ENV=production --prod"
  }
}
```

---

## 🧪 Étape 7 : Tests par environnement

### 7.1 Données de test

- **Development** : Données fictives, tests unitaires
- **Staging** : Données de test réalistes
- **Production** : Données réelles

### 7.2 Accès utilisateurs

- **Development** : Équipe de développement
- **Staging** : Équipe QA + stakeholders
- **Production** : Utilisateurs finaux

---

## 📊 Étape 8 : Monitoring et alertes

### 8.1 Sentry par environnement

- **Development** : Logs détaillés, debug
- **Staging** : Alertes sur erreurs critiques
- **Production** : Alertes en temps réel

### 8.2 Métriques

- **Development** : Performance locale
- **Staging** : Tests de charge
- **Production** : Métriques business

---

## 🔒 Étape 9 : Sécurité

### 9.1 Accès aux bases

- **Development** : Accès complet équipe dev
- **Staging** : Accès limité équipe QA
- **Production** : Accès restreint, audit trail

### 9.2 Secrets

- **Development** : Secrets de développement
- **Staging** : Secrets de test
- **Production** : Secrets de production (rotation régulière)

---

## ✅ Checklist de validation

- [ ] 3 projets Supabase créés
- [ ] Authentification Google configurée pour chaque environnement
- [ ] Variables d'environnement configurées
- [ ] Projets Vercel créés
- [ ] Migrations appliquées sur tous les environnements
- [ ] Tests de connexion effectués
- [ ] Workflow de déploiement configuré
- [ ] Monitoring configuré
- [ ] Documentation mise à jour 