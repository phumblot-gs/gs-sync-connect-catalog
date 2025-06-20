# Guide : Récupération des clés Supabase

## 🔑 Comment récupérer les clés de tes projets Supabase

### Étape 1 : Accéder aux paramètres du projet

1. Aller sur https://supabase.com/
2. Se connecter à ton compte
3. Sélectionner le projet (dev, staging, ou prod)
4. Aller dans **Settings** (⚙️) dans le menu de gauche
5. Cliquer sur **API**

### Étape 2 : Récupérer les informations

Dans la section **API Settings**, tu trouveras :

#### 📍 Project URL
```
https://your-project-ref.supabase.co
```
→ C'est ton `NEXT_PUBLIC_SUPABASE_URL_DEV/STAGING/PROD`

#### 🔑 anon public
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
→ C'est ton `NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV/STAGING/PROD`

#### 🔐 service_role secret
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
→ C'est ton `SUPABASE_SERVICE_ROLE_KEY_DEV/STAGING/PROD`

### Étape 3 : Project Reference ID

Dans **Settings > General**, tu trouveras :
```
Reference ID: abcdefghijklmnop
```
→ C'est ton `DEV_PROJECT_REF`, `STAGING_PROJECT_REF`, ou `PROD_PROJECT_REF`

---

## 🚀 Configuration automatique

### Option 1 : Script interactif (recommandé)
```bash
npm run setup:env
```

Le script te posera les questions une par une et créera automatiquement les fichiers `.env.development`, `.env.staging`, et `.env.production`.

### Option 2 : Configuration manuelle

1. **Copier le fichier d'exemple :**
   ```bash
   cp env.example .env.development
   cp env.example .env.staging
   cp env.example .env.production
   ```

2. **Éditer chaque fichier** et remplacer les valeurs par celles de tes projets Supabase

---

## 📋 Checklist de validation

Pour chaque environnement, vérifier que tu as :

- [ ] **Project URL** (ex: `https://abc123.supabase.co`)
- [ ] **anon public key** (commence par `eyJ...`)
- [ ] **service_role secret** (commence par `eyJ...`)
- [ ] **Reference ID** (pour les scripts de migration)

---

## 🔒 Sécurité

⚠️ **Important :**
- Les clés `service_role` ont des privilèges complets sur ta base de données
- Ne jamais committer les fichiers `.env.*` dans Git
- Utiliser des JWT secrets différents pour chaque environnement
- En production, utiliser des secrets très sécurisés

---

## 🧪 Test de connexion

Après configuration, tester avec :
```bash
npm run dev
```

Tu devrais voir :
- Le banner d'environnement en haut de l'écran
- La page de connexion Google
- Pas d'erreurs dans la console 