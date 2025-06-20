# Project References Supabase

## 📋 Project References pour les scripts de migration

Remplacer les valeurs par les vraies Project References de tes projets Supabase.

### Development
```
DEV_PROJECT_REF=aozwgkgeigdgfvbiuixe
```

### Staging
```
STAGING_PROJECT_REF=uflhiycrytouadwzaypa
```

### Production
```
PROD_PROJECT_REF=jvoedutvjfsfsalagxjo
```

## 🔧 Comment utiliser ces références

### 1. Mettre à jour package.json ✅
Remplacer dans `package.json` :
```json
"supabase:dev": "supabase link --project-ref aozwgkgeigdgfvbiuixe && supabase db push",
"supabase:staging": "supabase link --project-ref uflhiycrytouadwzaypa && supabase db push",
"supabase:prod": "supabase link --project-ref jvoedutvjfsfsalagxjo && supabase db push",
```

### 2. Ou utiliser des variables d'environnement
Ajouter dans chaque fichier .env.* :
```bash
SUPABASE_PROJECT_REF=your_project_ref_here
```

## 📍 Où trouver les Project References

1. Aller sur https://supabase.com/
2. Sélectionner le projet
3. Aller dans **Settings > General**
4. Copier le **Reference ID**

## ✅ Checklist

- [x] Development Project Ref configuré
- [x] Staging Project Ref configuré  
- [x] Production Project Ref configuré
- [x] Scripts package.json mis à jour
- [ ] Test de migration : `npm run supabase:dev` 