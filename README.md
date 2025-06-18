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

## 🛠️ Exemple de workflow GitHub Actions

```yaml
name: Sync PRD with Notion
on:
  workflow_dispatch:
  push:
    paths:
      - 'PRD.md'
      - 'src/**'
      - 'package.json'
      - 'package-lock.json'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Sync PRD to Notion
        env:
          NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}
          NOTION_PAGE_ID: ${{ secrets.NOTION_PAGE_ID }}
          NOTION_WORKSPACE: ${{ secrets.NOTION_WORKSPACE }}
        run: npm run sync-to-notion
```

## 📁 Structure du projet

```
src/
├── notion/
│   ├── client.js      # Client API Notion
│   └── sync.js        # Logique de synchronisation
├── init-prd.js        # Création du PRD initial
└── index.js           # Point d'entrée principal
```

## 📋 Liens utiles
- [Repo GitHub](https://github.com/phumblot-gs/gs-sync-connect-catalog.git)
- [Notion](https://notion.so/)

## 🔧 Configuration

### Database Notion
Cette application synchronise avec une **database Notion** plutôt qu'une page simple. Cela permet de :
- **Centraliser** tous les PRD de tes modules
- **Filtrer** et rechercher par projet, statut, etc.
- **Gérer** les métadonnées (statut, responsable, dates)
- **Avoir une vue d'ensemble** de tous tes projets

#### Structure de ta database :
| Propriété | Type | Valeurs |
|-----------|------|---------|
| **name** | Title | Nom du projet |
| **status** | Select | `draft`, `review`, `validated`, `obsolete` |
| **description** | Rich Text | Description courte |
| **Application** | Select | `Frontend`, `Backend`, `Service` |
| **Contenu** | Rich Text | Le PRD complet |

### Token Notion
1. Va sur https://developers.notion.com/
2. Crée une intégration "GS Sync Connect Catalog"
3. Copie le token dans `.env`
4. **Partage ta database PRD avec l'intégration** (pas une page !)

### ID de database Notion
L'ID est déjà configuré : `216582cb2b9c8045881ae17bc1b78385`

## 🔄 Workflow de développement

1. Modifier le `PRD.md` localement
2. Exécuter `npm run sync-to-notion`
3. Le PRD est automatiquement créé/mis à jour dans ta database Notion
4. L'équipe peut collaborer directement dans l'entrée de la database
5. Synchroniser les changements avec `npm run sync-from-notion`

### 📊 Avantages de la database

- **Vue d'ensemble** : Tous tes PRD au même endroit
- **Filtrage** : Filtrer par statut (draft, review, validated)
- **Recherche** : Rechercher par nom de projet ou module
- **Métadonnées** : Statut, responsable, dates automatiquement gérés
- **Collaboration** : Commentaires et mentions directement dans Notion

## 🚀 Commandes disponibles

```bash
npm run init-prd        # Créer le PRD initial
npm run sync-to-notion  # Envoyer vers Notion
npm run sync-from-notion # Récupérer depuis Notion
npm start               # Test de connexion
```

## 📋 Étapes de configuration

### 1. Créer l'intégration Notion
- Aller sur https://developers.notion.com/
- Créer "GS Sync Connect Catalog"
- Copier le token

### 2. Configurer la page Notion
- Créer une page "PRD - GS Sync Connect Catalog"
- Partager avec l'intégration
- L'ID de page est déjà configuré

### 3. Premier usage
```bash
cp .env.example .env
# Ajouter le token dans .env
npm install
npm run init-prd
npm run sync-to-notion
```

✅ **Ton PRD sera synchronisé avec Notion !**

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