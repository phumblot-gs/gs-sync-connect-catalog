const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

class FeatureInitializer {
  constructor() {
    this.featuresDir = path.join(__dirname, '../../docs/features');
  }

  /**
   * Template par défaut pour une nouvelle feature
   */
  getFeatureTemplate(featureName) {
    return `---
status: Draft
plans: ["Free"]
limite: ""
---

# ${featureName}

## 📋 Vue d'ensemble

Brève description de la feature et de son objectif principal.

## 🎯 Objectifs

- [ ] Objectif principal 1
- [ ] Objectif principal 2
- [ ] Objectif principal 3

## 📖 Description détaillée

### Contexte

Expliquer le contexte métier et technique qui justifie cette feature.

### Fonctionnalités

#### Fonctionnalité 1

Description détaillée de la première fonctionnalité.

**Critères d'acceptation :**
- [ ] Critère 1
- [ ] Critère 2
- [ ] Critère 3

#### Fonctionnalité 2

Description détaillée de la deuxième fonctionnalité.

**Critères d'acceptation :**
- [ ] Critère 1
- [ ] Critère 2

## 🏗️ Spécifications techniques

### Architecture

Décrire l'architecture technique de la feature.

### APIs et endpoints

- \`GET /api/feature\` - Description
- \`POST /api/feature\` - Description

### Modèles de données

\`\`\`json
{
  "id": "string",
  "name": "string",
  "status": "string",
  "created_at": "datetime"
}
\`\`\`

## 🎨 Spécifications UX/UI

### Wireframes

Décrire les écrans et interfaces utilisateur.

### Interactions

- Action 1 → Résultat 1
- Action 2 → Résultat 2

## 🧪 Tests et validation

### Tests unitaires

- [ ] Test des fonctions principales
- [ ] Test des cas d'erreur
- [ ] Test des validations

### Tests d'intégration

- [ ] Test des APIs
- [ ] Test des interfaces utilisateur
- [ ] Test des workflows complets

### Tests utilisateur

- [ ] Test avec utilisateurs cibles
- [ ] Validation de l'expérience utilisateur
- [ ] Collecte de feedback

## 📈 Métriques de succès

- **Métrique 1** : Objectif X%
- **Métrique 2** : Objectif Y unités
- **Métrique 3** : Temps de réponse < Z ms

## 🚀 Plan de déploiement

### Phase 1 : MVP
- [ ] Fonctionnalité de base
- [ ] Tests essentiels
- [ ] Documentation minimale

### Phase 2 : Amélirations
- [ ] Fonctionnalités avancées
- [ ] Optimisations
- [ ] Tests complets

### Phase 3 : Finalisation
- [ ] Polissage UX
- [ ] Documentation complète
- [ ] Formation utilisateurs

## 🔗 Ressources et références

- [Lien vers la documentation technique](https://example.com)
- [Lien vers les maquettes](https://example.com)
- [Lien vers les spécifications API](https://example.com)

## 📝 Notes et décisions

### Décisions techniques

- **Date** : Décision prise et justification
- **Date** : Autre décision importante

### Questions ouvertes

- [ ] Question 1 à résoudre
- [ ] Question 2 à clarifier

---
*Cette feature fait partie du projet GS Sync Connect Catalog.*`;
  }

  /**
   * Demande le nom de la feature à l'utilisateur
   */
  async promptFeatureName() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('📝 Nom de la nouvelle feature : ', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  /**
   * Valide le nom de la feature
   */
  validateFeatureName(featureName) {
    if (!featureName) {
      throw new Error('Le nom de la feature ne peut pas être vide');
    }

    // Nettoyer le nom pour le nom de fichier
    const cleanName = featureName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Supprimer les caractères spéciaux
      .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
      .replace(/-+/g, '-') // Supprimer les tirets multiples
      .replace(/^-|-$/g, ''); // Supprimer les tirets en début/fin

    if (!cleanName) {
      throw new Error('Le nom de la feature contient uniquement des caractères non valides');
    }

    return cleanName;
  }

  /**
   * Crée le fichier de feature
   */
  async createFeatureFile(featureName) {
    try {
      // Valider et nettoyer le nom
      const fileName = this.validateFeatureName(featureName);
      const filePath = path.join(this.featuresDir, `${fileName}.md`);

      // Vérifier si le fichier existe déjà
      try {
        await fs.access(filePath);
        throw new Error(`La feature "${fileName}" existe déjà`);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
        // Le fichier n'existe pas, on peut continuer
      }

      // S'assurer que le dossier existe
      await fs.mkdir(this.featuresDir, { recursive: true });

      // Générer le contenu du template
      const template = this.getFeatureTemplate(featureName);

      // Créer le fichier
      await fs.writeFile(filePath, template, 'utf8');

      console.log(`✅ Feature "${featureName}" créée avec succès !`);
      console.log(`📄 Fichier : docs/features/${fileName}.md`);
      console.log('💡 Vous pouvez maintenant éditer la feature et la synchroniser avec :');
      console.log('   npm run sync-features-to-notion');

      return fileName;
    } catch (error) {
      console.error('❌ Erreur lors de la création de la feature:', error.message);
      throw error;
    }
  }

  /**
   * Initialise une nouvelle feature
   */
  async initializeFeature() {
    try {
      console.log('🚀 Initialisation d\'une nouvelle feature...');
      console.log('');

      // Demander le nom de la feature
      const featureName = await this.promptFeatureName();

      if (!featureName) {
        console.log('❌ Opération annulée - aucun nom fourni');
        return false;
      }

      // Créer le fichier
      const fileName = await this.createFeatureFile(featureName);
      return fileName;
    } catch (error) {
      console.error('❌ Erreur:', error.message);
      return false;
    }
  }
}

// Exécution du script
async function main() {
  const initializer = new FeatureInitializer();
  const result = await initializer.initializeFeature();
  process.exit(result ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = FeatureInitializer; 