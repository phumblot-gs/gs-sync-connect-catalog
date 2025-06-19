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
---
status: Draft
plans: ["Free", "Growth"]
limite: "100 requests/hour"
---

# Nom de la feature

Contenu de la feature...
```

### Champs de métadonnées

- **status** : `Draft`, `Review`, `Validated`, `Obsolete`
- **plans** : Tableau des plans concernés (`Free`, `Growth`, `Pro`, `Enterprise`)
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