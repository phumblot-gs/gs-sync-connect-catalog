const { Client } = require("@notionhq/client");
const NotionClient = require("./client");
require("dotenv").config();

class NotionFeaturesClient {
  constructor() {
    if (!process.env.NOTION_TOKEN) {
      throw new Error("NOTION_TOKEN manquant dans le fichier .env");
    }

    this.notion = new Client({
      auth: process.env.NOTION_TOKEN,
    });

    this.featuresDatabaseId =
      process.env.NOTION_FEATURES_DATABASE_ID ||
      "1a5582cb2b9c807682bef53c030f683b";
    this.projectName = "GS Sync Connect Catalog"; // Module par défaut

    // Utiliser le client principal pour la conversion markdown avancée
    this.mainClient = new NotionClient();
  }

  /**
   * Récupère les features du projet spécifique (filtré par Module)
   */
  async getProjectFeatures() {
    try {
      console.log(
        `📖 Récupération des features du projet "${this.projectName}"...`,
      );

      const response = await this.notion.databases.query({
        database_id: this.featuresDatabaseId,
        filter: {
          property: "Module",
          select: {
            equals: this.projectName,
          },
        },
        sorts: [
          {
            property: "Name",
            direction: "ascending",
          },
        ],
      });

      console.log(
        `✅ ${response.results.length} features trouvées pour ce projet`,
      );
      return response.results;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des features:",
        error.message,
      );
      throw error;
    }
  }

  /**
   * Récupère toutes les features de la database (pour debug/admin)
   */
  async getAllFeatures() {
    try {
      console.log(
        "📖 Récupération de toutes les features depuis la database Notion...",
      );

      const response = await this.notion.databases.query({
        database_id: this.featuresDatabaseId,
        sorts: [
          {
            property: "Name",
            direction: "ascending",
          },
        ],
      });

      console.log(`✅ ${response.results.length} features trouvées au total`);
      return response.results;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des features:",
        error.message,
      );
      throw error;
    }
  }

  /**
   * Crée ou met à jour une feature dans la database
   */
  async createOrUpdateFeature(featureName, content, frontMatter = {}) {
    try {
      console.log(`📝 Création/mise à jour de la feature "${featureName}"...`);

      // Chercher une feature existante
      const existingFeature = await this.findFeatureByName(featureName);

      const properties = {
        Name: {
          title: [{ text: { content: featureName } }],
        },
        Module: {
          select: { name: this.projectName },
        },
        Status: {
          select: { name: frontMatter.status || "Draft" },
        },
        Plans: {
          multi_select: (frontMatter.plans || ["Free"]).map((plan) => ({
            name: plan,
          })),
        },
        "User Rights": {
          multi_select: (frontMatter.userRights || []).map((right) => ({
            name: right,
          })),
        },
      };

      // Ajouter Limite si présent
      if (frontMatter.limite) {
        properties["Limite"] = {
          rich_text: [{ text: { content: frontMatter.limite } }],
        };
      }

      if (existingFeature) {
        // Mettre à jour la feature existante
        await this.notion.pages.update({
          page_id: existingFeature.id,
          properties,
        });

        // Mettre à jour le contenu
        await this.updateFeatureContent(existingFeature.id, content);
        console.log(`✅ Feature "${featureName}" mise à jour`);
        return existingFeature;
      } else {
        // Créer une nouvelle feature
        const newPage = await this.notion.pages.create({
          parent: { database_id: this.featuresDatabaseId },
          properties,
        });

        // Ajouter le contenu
        await this.updateFeatureContent(newPage.id, content);
        console.log(`✅ Feature "${featureName}" créée`);
        return newPage;
      }
    } catch (error) {
      console.error(
        `❌ Erreur lors de la création/mise à jour de "${featureName}":`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Trouve une feature par son nom
   */
  async findFeatureByName(featureName) {
    try {
      const response = await this.notion.databases.query({
        database_id: this.featuresDatabaseId,
        filter: {
          property: "Name",
          title: { equals: featureName },
        },
      });

      return response.results.length > 0 ? response.results[0] : null;
    } catch (error) {
      console.error(
        `❌ Erreur lors de la recherche de "${featureName}":`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Met à jour le contenu d'une feature (remplace complètement)
   */
  async updateFeatureContent(pageId, content) {
    try {
      // Supprimer le contenu existant
      await this.clearPageContent(pageId);

      // Utiliser la conversion markdown avancée du client principal
      const blocks = this.mainClient.markdownToBlocks(content);

      // Ajouter les blocs par chunks
      const chunkSize = 100;
      for (let i = 0; i < blocks.length; i += chunkSize) {
        const chunk = blocks.slice(i, i + chunkSize);
        await this.notion.blocks.children.append({
          block_id: pageId,
          children: chunk,
        });
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de la mise à jour du contenu:",
        error.message,
      );
      throw error;
    }
  }

  /**
   * Supprime tout le contenu d'une page avec gestion robuste des conflits
   */
  async clearPageContent(pageId) {
    function wait(ms) {
      return new Promise((res) => setTimeout(res, ms));
    }
    async function safeDelete(notion, blockId, retries = 3) {
      for (let i = 0; i < retries; i++) {
        try {
          await notion.blocks.delete({ block_id: blockId });
          return;
        } catch (err) {
          if (err.code === "conflict_error" && i < retries - 1) {
            await wait(500);
          } else {
            // Ignorer les erreurs de suppression pour les features
            return;
          }
        }
      }
    }

    // Masquer les warnings Notion pendant la suppression
    const originalWarn = console.warn;
    console.warn = function (...args) {
      const message = args
        .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
        .join(" ");
      if (
        message.includes("@notionhq/client") ||
        message.includes("request fail") ||
        message.includes("conflict_error")
      ) {
        return;
      }
      originalWarn.apply(console, args);
    };

    try {
      let hasMore = true;
      let startCursor = undefined;
      let total = 0;
      let deleted = 0;

      // Compter le nombre total de blocks à supprimer (pour la progression)
      {
        let cursor = undefined;
        do {
          const resp = await this.notion.blocks.children.list({
            block_id: pageId,
            start_cursor: cursor,
          });
          total += resp.results.length;
          cursor = resp.has_more ? resp.next_cursor : undefined;
        } while (cursor);
      }

      if (total > 0) {
        console.log(`🗑️ Suppression de ${total} blocks...`);
      }

      while (hasMore) {
        const response = await this.notion.blocks.children.list({
          block_id: pageId,
          start_cursor: startCursor,
        });

        const blocks = response.results;

        // Suppression par lots de 2 en parallèle, avec retry et délai
        for (let i = 0; i < blocks.length; i += 2) {
          const batch = blocks.slice(i, i + 2);
          await Promise.all(
            batch.map((block) => safeDelete(this.notion, block.id)),
          );
          deleted += batch.length;

          // Afficher la progression si on a plus de 10 blocks
          if (total > 10) {
            process.stdout.write(
              `\r   Progression: ${Math.min(deleted, total)}/${total} blocks supprimés...`,
            );
          }

          await wait(400);
        }

        hasMore = response.has_more;
        startCursor = response.next_cursor;
      }

      if (total > 10) {
        process.stdout.write("\n");
      }

      if (total > 0) {
        console.log("🗑️ Contenu existant supprimé");
      }
    } catch (error) {
      console.error("❌ Erreur lors de la suppression:", error.message);
    } finally {
      console.warn = originalWarn;
    }
  }

  /**
   * Récupère le contenu d'une feature
   */
  async getFeatureContent(pageId) {
    try {
      const blocks = await this.notion.blocks.children.list({
        block_id: pageId,
      });
      return blocks.results;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération du contenu:",
        error.message,
      );
      throw error;
    }
  }

  /**
   * Teste la connexion à la database features
   */
  async testConnection() {
    try {
      console.log("🔌 Test de connexion à la database Features...");

      const database = await this.notion.databases.retrieve({
        database_id: this.featuresDatabaseId,
      });

      console.log(
        `✅ Connexion réussie ! Database: "${database.title[0]?.plain_text || "Features"}"`,
      );
      return true;
    } catch (error) {
      console.error("❌ Échec de la connexion Features:", error.message);
      if (error.code === "object_not_found") {
        console.error("💡 Vérifiez que l'intégration a accès à cette database");
      }
      return false;
    }
  }
}

module.exports = NotionFeaturesClient;
