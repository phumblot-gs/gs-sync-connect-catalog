const fs = require("fs").promises;
const path = require("path");
const NotionFeaturesClient = require("./features-client");
const NotionSync = require("./sync");

class FeaturesSync {
  constructor() {
    this.featuresClient = new NotionFeaturesClient();
    this.featuresDir = path.join(__dirname, "../../docs/features");

    // Utiliser la conversion markdown avancée du sync principal
    this.mainSync = new NotionSync();
  }

  /**
   * Synchronise toutes les features locales vers Notion
   */
  async syncFeaturesToNotion() {
    try {
      console.log("🚀 Début de la synchronisation des features vers Notion...");

      // Vérifier que le dossier features existe
      await this.ensureFeaturesDir();

      // Lire tous les fichiers .md du dossier features
      const files = await fs.readdir(this.featuresDir);
      const mdFiles = files.filter((file) => file.endsWith(".md"));

      if (mdFiles.length === 0) {
        console.log("📄 Aucune feature trouvée dans docs/features/");
        return true;
      }

      console.log(`📄 ${mdFiles.length} feature(s) trouvée(s) à synchroniser`);

      // Synchroniser chaque feature
      for (const file of mdFiles) {
        const filePath = path.join(this.featuresDir, file);
        const featureName = path.basename(file, ".md");

        // Lire le contenu du fichier
        const content = await fs.readFile(filePath, "utf8");

        // Parser le front matter
        const { frontMatter, markdownContent } = this.parseFrontMatter(content);

        // Synchroniser vers Notion
        await this.featuresClient.createOrUpdateFeature(
          featureName,
          markdownContent,
          frontMatter,
        );
      }

      console.log("✅ Synchronisation des features vers Notion terminée !");
      return true;
    } catch (error) {
      console.error(
        "❌ Erreur de synchronisation des features:",
        error.message,
      );
      return false;
    }
  }

  /**
   * Synchronise les features depuis Notion vers les fichiers locaux
   */
  async syncFeaturesFromNotion() {
    try {
      console.log(
        "🚀 Début de la synchronisation des features depuis Notion...",
      );

      // Vérifier que le dossier features existe
      await this.ensureFeaturesDir();

      // Récupérer les features du projet depuis Notion (filtré par Module)
      const features = await this.featuresClient.getProjectFeatures();

      if (features.length === 0) {
        console.log("📄 Aucune feature trouvée dans Notion pour ce projet");
        return true;
      }

      console.log(
        `📄 ${features.length} feature(s) trouvée(s) dans Notion pour ce projet`,
      );

      // Sauvegarder chaque feature
      for (const feature of features) {
        const featureName = this.getFeatureName(feature);
        const cleanFileName = this.sanitizeFileName(featureName);
        const filePath = path.join(this.featuresDir, `${cleanFileName}.md`);

        // Récupérer le contenu depuis Notion avec getAllBlocks pour avoir tout le contenu
        const blocks = await this.getAllBlocks(feature.id);

        // Convertir en markdown avec la conversion complète
        const markdownContent = this.mainSync.blocksToMarkdown(blocks);

        // Extraire les propriétés pour le front matter
        const frontMatter = this.extractFrontMatter(feature);

        // Générer le contenu complet avec front matter
        const fullContent = this.generateFileContent(
          frontMatter,
          markdownContent,
        );

        // Sauvegarder le fichier
        await fs.writeFile(filePath, fullContent, "utf8");
        console.log(`✅ Feature "${featureName}" sauvegardée`);
      }

      console.log("✅ Synchronisation des features depuis Notion terminée !");
      return true;
    } catch (error) {
      console.error(
        "❌ Erreur de synchronisation depuis Notion:",
        error.message,
      );
      return false;
    }
  }

  /**
   * Parse le front matter d'un fichier markdown
   */
  parseFrontMatter(content) {
    // Ignorer les commentaires HTML avant le front matter
    const cleanContent = content.replace(/<!--[\s\S]*?-->\s*\n/g, "");

    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = cleanContent.match(frontMatterRegex);

    if (match) {
      const frontMatterText = match[1];
      const markdownContent = match[2];

      // Parser le YAML simple
      const frontMatter = {};
      const lines = frontMatterText.split("\n");

      for (const line of lines) {
        const colonIndex = line.indexOf(":");
        if (colonIndex > 0) {
          const key = line.slice(0, colonIndex).trim();
          const value = line.slice(colonIndex + 1).trim();

          // Gérer les arrays (plans, user_rights)
          if (value.startsWith("[") && value.endsWith("]")) {
            const arrayValue = value
              .slice(1, -1)
              .split(",")
              .map((v) => v.trim().replace(/['"]/g, ""));

            // Convertir user_rights en userRights pour la compatibilité avec Notion
            if (key === "user_rights") {
              frontMatter.userRights = arrayValue;
            } else {
              frontMatter[key] = arrayValue;
            }
          } else {
            frontMatter[key] = value.replace(/['"]/g, "");
          }
        }
      }

      return { frontMatter, markdownContent };
    }

    return { frontMatter: {}, markdownContent: cleanContent };
  }

  /**
   * Extrait les propriétés Notion pour le front matter
   */
  extractFrontMatter(feature) {
    const properties = feature.properties;
    const frontMatter = {};

    if (properties.Status?.select?.name) {
      frontMatter.status = properties.Status.select.name;
    }

    if (properties.Plans?.multi_select) {
      frontMatter.plans = properties.Plans.multi_select.map(
        (plan) => plan.name,
      );
    }

    if (properties["User Rights"]?.multi_select) {
      frontMatter.userRights = properties["User Rights"].multi_select.map(
        (right) => right.name,
      );
    }

    if (properties.Limite?.rich_text?.[0]?.text?.content) {
      frontMatter.limite = properties.Limite.rich_text[0].text.content;
    }

    return frontMatter;
  }

  /**
   * Génère le contenu complet du fichier avec front matter
   */
  generateFileContent(frontMatter, markdownContent) {
    let content = "<!--\n";
    content += "FRONT MATTER - Propriétés synchronisées avec Notion\n";
    content += "====================================================\n";
    content += "status: Draft | Review | Validated | Obsolete\n";
    content += 'plans: ["Free", "Growth", "Pro", "Enterprise"]\n';
    content +=
      'user_rights: ["Superadmin", "Admin", "Standard", "Restricted", "Guest"]\n';
    content += "limite: Texte libre pour décrire les limitations (optionnel)\n";
    content += "-->\n";
    content += "---\n";

    if (frontMatter.status) {
      content += `status: ${frontMatter.status}\n`;
    }

    if (frontMatter.plans && frontMatter.plans.length > 0) {
      content += `plans: [${frontMatter.plans.map((p) => `"${p}"`).join(", ")}]\n`;
    }

    if (frontMatter.userRights && frontMatter.userRights.length > 0) {
      content += `user_rights: [${frontMatter.userRights.map((r) => `"${r}"`).join(", ")}]\n`;
    }

    if (frontMatter.limite) {
      content += `limite: "${frontMatter.limite}"\n`;
    }

    content += "---\n\n";
    content += markdownContent;

    return content;
  }

  /**
   * Extrait le nom de la feature depuis les propriétés Notion
   */
  getFeatureName(feature) {
    const nameProperty = feature.properties.Name;
    if (nameProperty?.title?.[0]?.text?.content) {
      return nameProperty.title[0].text.content;
    }
    return "untitled-feature";
  }

  /**
   * S'assure que le dossier features existe
   */
  async ensureFeaturesDir() {
    try {
      await fs.mkdir(this.featuresDir, { recursive: true });
    } catch (error) {
      // Le dossier existe déjà
    }
  }

  /**
   * Nettoie le nom de fichier pour éviter les caractères invalides
   */
  sanitizeFileName(fileName) {
    return fileName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Supprimer tous les caractères spéciaux
      .replace(/\s+/g, "-") // Remplacer les espaces par des tirets
      .replace(/-+/g, "-") // Supprimer les tirets multiples
      .replace(/^-|-$/g, "") // Supprimer les tirets en début/fin
      .substring(0, 100); // Limiter la longueur à 100 caractères
  }

  /**
   * Récupère tous les blocks récursivement (avec pagination et children)
   */
  async getAllBlocks(pageId) {
    const notion = this.featuresClient.notion;
    async function fetchBlocks(parentId) {
      let blocks = [];
      let cursor = undefined;
      do {
        const resp = await notion.blocks.children.list({
          block_id: parentId,
          start_cursor: cursor,
        });
        blocks = blocks.concat(resp.results);
        cursor = resp.has_more ? resp.next_cursor : undefined;
      } while (cursor);
      // Récupérer les enfants récursivement
      for (const block of blocks) {
        if (block.has_children) {
          block.children = await fetchBlocks(block.id);
        }
      }
      return blocks;
    }
    return fetchBlocks(pageId);
  }
}

// CLI interface
if (require.main === module) {
  const sync = new FeaturesSync();
  const args = process.argv.slice(2);

  if (args.includes("--to-notion")) {
    sync.syncFeaturesToNotion();
  } else if (args.includes("--from-notion")) {
    sync.syncFeaturesFromNotion();
  } else {
    console.log("Usage:");
    console.log(
      "  node features-sync.js --to-notion     # Synchronise vers Notion",
    );
    console.log(
      "  node features-sync.js --from-notion   # Synchronise depuis Notion",
    );
  }
}

module.exports = FeaturesSync;
