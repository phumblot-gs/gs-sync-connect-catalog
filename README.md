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
Le PRD est synchronisé avec une **database Notion**. Pour mettre en place la synchronisation :
1. Va sur https://developers.notion.com/
2. Crée une intégration "GS Sync Connect Catalog" si elle n'existe pas déjà
3. Copie le token dans une variable d'environnement NOTION_TOKEN dans le fichier `.env`
4. Ajoute au fichier .env la variable d'environnement NOTION_PAGE_ID avec l'ID de la database Notion
5. Initialise le PRD avec la commande `npm run init-prd` et remplis le selon les besoins du projet

### ID de database Notion
Le NOTION_PAGE_ID est : `216582cb2b9c8045881ae17bc1b78385`

## 🔄 Workflow de développement

1. Modifier le `PRD.md` localement
2. **Optionnel** : Exécuter `npm run format-for-notion` pour normaliser le format avant commit
3. Exécuter `npm run sync-to-notion`
4. Le PRD est automatiquement créé/mis à jour dans ta database Notion
5. L'équipe peut collaborer directement dans l'entrée de la database
6. Synchroniser les changements avec `npm run sync-from-notion`

### Commandes disponibles

- `npm run init-prd` - Initialise le fichier PRD.md
- `npm run sync-to-notion` - Synchronise le PRD local vers Notion
- `npm run sync-from-notion` - Synchronise depuis Notion vers le PRD local
- `npm run format-for-notion` - **Nouveau** : Formate le PRD selon le rendu Notion (évite les diffs parasites)
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