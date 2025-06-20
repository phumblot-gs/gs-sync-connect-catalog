# Configuration Vercel - URLs de déploiement

## 🌐 URLs de déploiement par environnement

### Development
```
URL: https://dev-gs-sync-connect.vercel.app
Callback: https://dev-gs-sync-connect.vercel.app/auth/callback
```

### Staging
```
URL: https://staging-gs-sync-connect.vercel.app
Callback: https://staging-gs-sync-connect.vercel.app/auth/callback
```

### Production
```
URL: https://gs-sync-connect.vercel.app
Callback: https://gs-sync-connect.vercel.app/auth/callback
```

## 🔐 Configuration Google OAuth

### URLs de redirection à configurer dans Google Cloud Console

Pour chaque application OAuth, ajouter ces URLs de redirection :

#### Development
- `http://localhost:3000/auth/callback`
- `https://dev-gs-sync-connect.vercel.app/auth/callback`

#### Staging
- `https://staging-gs-sync-connect.vercel.app/auth/callback`

#### Production
- `https://gs-sync-connect.vercel.app/auth/callback`

## 🚀 Commandes de déploiement

### Premier déploiement
```bash
# Development
vercel --env NODE_ENV=development

# Staging
vercel --env NODE_ENV=staging

# Production
vercel --env NODE_ENV=production --prod
```

### Déploiements suivants
```bash
npm run deploy:dev
npm run deploy:staging
npm run deploy:prod
```

## 📋 Variables d'environnement Vercel

Pour chaque projet Vercel, configurer ces variables :

### Development
```bash
NODE_ENV=development
NEXT_PUBLIC_SUPABASE_URL_DEV=your_dev_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV=your_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY_DEV=your_dev_service_role_key
JWT_SECRET=your_dev_jwt_secret
```

### Staging
```bash
NODE_ENV=staging
NEXT_PUBLIC_SUPABASE_URL_STAGING=your_staging_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING=your_staging_anon_key
SUPABASE_SERVICE_ROLE_KEY_STAGING=your_staging_service_role_key
JWT_SECRET=your_staging_jwt_secret
```

### Production
```bash
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL_PROD=your_prod_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD=your_prod_anon_key
SUPABASE_SERVICE_ROLE_KEY_PROD=your_prod_service_role_key
JWT_SECRET=your_prod_jwt_secret
```

## ✅ Checklist de déploiement

- [ ] Projets Vercel créés
- [ ] Variables d'environnement configurées
- [ ] URLs de redirection Google OAuth configurées
- [ ] Test de déploiement development
- [ ] Test de déploiement staging
- [ ] Test de déploiement production
- [ ] Authentification Google testée sur chaque environnement 