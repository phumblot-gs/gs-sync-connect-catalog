const fs = require("fs").promises;
const path = require("path");
const NotionClient = require("./client");
const NotionSync = require("./sync");
const FeaturesSync = require("./features-sync");

class FormatNotionDocuments {
  constructor() {
    this.notionClient = new NotionClient();
    this.notionSync = new NotionSync();
    this.featuresSync = new FeaturesSync();
    this.prdPath = path.join(__dirname, "../../PRD.md");
    this.featuresDir = path.join(__dirname, "../../docs/features");
  }

  /**
   * Formate tous les documents (PRD + Features) selon le rendu Notion
   */
  async formatAllDocuments() {
    console.log(
      "🎨 Formatage de tous les documents selon le rendu Notion...\n",
    );

    let totalFormatted = 0;

    // 1. Formatter le PRD principal
    console.log("📖 Formatage du PRD principal...");
    const prdResult = await this.formatDocument(this.prdPath);
    if (prdResult === null) {
      console.log("⚠️  Erreur lors du formatage du PRD\n");
    } else if (prdResult === true) {
      totalFormatted++;
      console.log("✅ PRD formaté\n");
    } else {
      console.log("⚪ PRD déjà au bon format\n");
    }

    // 2. Formatter toutes les features
    console.log("📁 Formatage des features...");
    const featuresFormatted = await this.formatAllFeatures();
    totalFormatted += featuresFormatted;

    // 3. Résumé
    console.log(
      `\n🎉 Formatage terminé ! ${totalFormatted} document(s) formaté(s)`,
    );
    console.log(
      "📝 Les documents sont maintenant prêts pour la synchronisation avec Notion",
    );

    return totalFormatted;
  }

  /**
   * Formate un document markdown selon le rendu Notion
   * @returns {boolean|null} true si modifié, false si pas de changement, null si erreur
   */
  async formatDocument(filePath) {
    try {
      // Vérifier si le fichier existe
      const fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      if (!fileExists) {
        console.log(`❌ Fichier non trouvé: ${filePath}`);
        return null; // Erreur : fichier non trouvé
      }

      // Lire le fichier
      const content = await fs.readFile(filePath, "utf8");

      // Extraire le front matter s'il existe (pour les features)
      const { frontMatter, markdownContent } = this.extractFrontMatter(content);

      // Convertir markdown → Notion blocks → markdown pour normaliser
      const blocks = this.notionClient.markdownToBlocks(markdownContent);
      const normalizedMarkdown = this.notionSync.blocksToMarkdown(blocks);

      // Reconstruire le contenu avec front matter
      const finalContent = frontMatter
        ? `---\n${frontMatter}\n---\n\n${normalizedMarkdown}`
        : normalizedMarkdown;

      // Sauvegarder seulement si différent
      if (content !== finalContent) {
        await fs.writeFile(filePath, finalContent, "utf8");
        return true; // Modifié
      }

      return false; // Pas de changement nécessaire
    } catch (error) {
      console.error(`❌ Erreur lors du formatage de ${filePath}:`);
      console.error(`   Message: ${error.message}`);
      return null; // Erreur
    }
  }

  /**
   * Formate toutes les features du dossier docs/features
   */
  async formatAllFeatures() {
    try {
      // Vérifier si le dossier features existe
      const featuresExists = await fs
        .access(this.featuresDir)
        .then(() => true)
        .catch(() => false);
      if (!featuresExists) {
        console.log("📁 Dossier docs/features non trouvé");
        return 0;
      }

      // Lister tous les fichiers .md dans le dossier features
      const files = await fs.readdir(this.featuresDir);
      const mdFiles = files.filter((file) => file.endsWith(".md"));

      if (mdFiles.length === 0) {
        console.log("📄 Aucune feature trouvée dans docs/features");
        return 0;
      }

      let formattedCount = 0;

      // Formatter chaque feature
      for (const file of mdFiles) {
        const filePath = path.join(this.featuresDir, file);
        const featureName = path.basename(file, ".md");

        console.log(`   Formatage de "${featureName}"...`);
        const result = await this.formatDocument(filePath);

        if (result === null) {
          console.log(`   ❌ Erreur lors du formatage de "${featureName}"`);
        } else if (result === true) {
          formattedCount++;
          console.log(`   ✅ "${featureName}" formaté`);
        } else {
          console.log(`   ⚪ "${featureName}" déjà au bon format`);
        }
      }

      console.log(
        `\n📊 Features: ${formattedCount}/${mdFiles.length} formatées`,
      );
      return formattedCount;
    } catch (error) {
      console.error("❌ Erreur lors du formatage des features:", error.message);
      return 0;
    }
  }

  /**
   * Extrait le front matter YAML d'un contenu markdown
   */
  extractFrontMatter(content) {
    const frontMatterMatch = content.match(
      /^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/,
    );

    if (frontMatterMatch) {
      return {
        frontMatter: frontMatterMatch[1],
        markdownContent: frontMatterMatch[2],
      };
    }

    return {
      frontMatter: null,
      markdownContent: content,
    };
  }
}

// Exécution si appelé directement
if (require.main === module) {
  const formatter = new FormatNotionDocuments();
  formatter.formatAllDocuments().catch(console.error);
}

module.exports = FormatNotionDocuments;
