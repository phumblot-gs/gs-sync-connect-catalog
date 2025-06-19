const { Client } = require("@notionhq/client");
require("dotenv").config();

class NotionClient {
  constructor() {
    if (!process.env.NOTION_TOKEN) {
      throw new Error("NOTION_TOKEN manquant dans le fichier .env");
    }

    this.notion = new Client({
      auth: process.env.NOTION_TOKEN,
    });

    this.databaseId = process.env.NOTION_PAGE_ID; // Maintenant c'est une database ID
    this.workspace = process.env.NOTION_WORKSPACE;
    this.projectName = "GS Sync Connect Catalog";
  }

  /**
   * Récupère ou crée l'entrée PRD dans la database
   */
  async getOrCreateProjectEntry() {
    try {
      console.log(
        `📖 Recherche du projet "${this.projectName}" dans la database...`,
      );

      // Chercher l'entrée existante
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        filter: {
          property: "Name",
          title: {
            equals: this.projectName,
          },
        },
      });

      if (response.results.length > 0) {
        console.log("✅ Projet trouvé dans la database");
        return response.results[0];
      } else {
        console.log("🆕 Création d'une nouvelle entrée dans la database...");
        return await this.createProjectEntry();
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération/création:",
        error.message,
      );
      throw error;
    }
  }

  /**
   * Crée une nouvelle entrée PRD dans la database
   */
  async createProjectEntry() {
    try {
      const newPage = await this.notion.pages.create({
        parent: { database_id: this.databaseId },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: this.projectName,
                },
              },
            ],
          },
          Status: {
            select: {
              name: "draft",
            },
          },
          Description: {
            rich_text: [
              {
                text: {
                  content:
                    "Application de synchronisation entre comptes Grand Shooting avec monitoring",
                },
              },
            ],
          },
          Application: {
            select: {
              name: "Service",
            },
          },
        },
      });

      console.log("✅ Nouvelle entrée créée avec succès !");
      return newPage;
    } catch (error) {
      console.error("❌ Erreur lors de la création:", error.message);
      throw error;
    }
  }

  /**
   * Récupère le contenu PRD d'une entrée de database
   */
  async getProjectContent() {
    try {
      const projectEntry = await this.getOrCreateProjectEntry();
      const blocks = await this.notion.blocks.children.list({
        block_id: projectEntry.id,
      });

      return {
        entry: projectEntry,
        blocks: blocks.results,
      };
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération du contenu:",
        error.message,
      );
      throw error;
    }
  }

  /**
   * Met à jour le contenu PRD dans la database
   */
  async updateProjectContent(content, frontMatter = {}) {
    try {
      console.log(`📝 Mise à jour du PRD "${this.projectName}"...`);

      // Récupérer ou créer l'entrée
      const projectEntry = await this.getOrCreateProjectEntry();

      // Préparer les propriétés à mettre à jour
      const properties = {};

      if (frontMatter.status) {
        properties["Status"] = {
          select: { name: frontMatter.status },
        };
      }

      if (frontMatter.application) {
        properties["Application"] = {
          select: { name: frontMatter.application },
        };
      }

      if (frontMatter.description) {
        properties["Description"] = {
          rich_text: [{ text: { content: frontMatter.description } }],
        };
      }

      // Mettre à jour les propriétés de l'entrée seulement si on a des changements
      if (Object.keys(properties).length > 0) {
        await this.notion.pages.update({
          page_id: projectEntry.id,
          properties,
        });
      }

      // Supprimer le contenu existant de la page
      await this.clearPageContent(projectEntry.id);

      // Ajouter le nouveau contenu
      const blocks = this.markdownToBlocks(content);

      // Ajouter les blocs par chunks (Notion limite à 100 blocs par request)
      const chunkSize = 100;
      for (let i = 0; i < blocks.length; i += chunkSize) {
        const chunk = blocks.slice(i, i + chunkSize);
        await this.notion.blocks.children.append({
          block_id: projectEntry.id,
          children: chunk,
        });
      }

      console.log("✅ PRD mis à jour avec succès dans la database !");
      return true;
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour:", error.message);
      throw error;
    }
  }

  /**
   * Supprime tout le contenu d'une page
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
            throw err;
          }
        }
      }
    }

    // Masquer les warnings Notion pendant la suppression
    const originalWarn = console.warn;
    console.warn = function (...args) {
      // Convertir tous les arguments en string pour la détection
      const message = args
        .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
        .join(" ");
      // Filtrer les warnings Notion liés aux conflits
      if (
        message.includes("@notionhq/client") ||
        message.includes("request fail") ||
        message.includes("conflict_error")
      ) {
        return; // Masquer ces warnings
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
      console.log(`🗑️ Suppression de ${total} blocks...`);
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
          process.stdout.write(
            `\r   Progression: ${Math.min(deleted, total)}/${total} blocks supprimés...`,
          );
          await wait(400);
        }
        hasMore = response.has_more;
        startCursor = response.next_cursor;
      }
      process.stdout.write("\n");
      console.log("🗑️ Contenu existant supprimé");
    } catch (error) {
      console.error("❌ Erreur lors de la suppression:", error.message);
      throw error;
    } finally {
      // Restaurer console.warn
      console.warn = originalWarn;
    }
  }

  parseRichTextWithMarkdown(text) {
    // Supporte gras (**), italique (_ ou *), souligné (__), code (`), liens [texte](url)
    const regex =
      /(!?\[[^\]]*\]\([^)]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(_[^_]+_)|(__[^_]+__)|(`[^`]+`)/g;
    const segments = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          type: "text",
          text: { content: text.slice(lastIndex, match.index) },
          annotations: {},
        });
      }
      const segment = match[0];
      // Image inline (sera gérée comme bloc, donc ici on ignore)
      if (segment.startsWith("![")) {
        // rien ici, géré dans markdownToBlocks
      }
      // Lien
      else if (segment.startsWith("[")) {
        const linkMatch = segment.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          segments.push({
            type: "text",
            text: { content: linkMatch[1], link: { url: linkMatch[2] } },
            annotations: {},
          });
        }
      }
      // Gras
      else if (segment.startsWith("**")) {
        segments.push({
          type: "text",
          text: { content: segment.slice(2, -2) },
          annotations: { bold: true },
        });
      }
      // Souligné
      else if (segment.startsWith("__")) {
        segments.push({
          type: "text",
          text: { content: segment.slice(2, -2) },
          annotations: { underline: true },
        });
      }
      // Italique *texte*
      else if (segment.startsWith("*")) {
        segments.push({
          type: "text",
          text: { content: segment.slice(1, -1) },
          annotations: { italic: true },
        });
      }
      // Italique _texte_
      else if (segment.startsWith("_")) {
        segments.push({
          type: "text",
          text: { content: segment.slice(1, -1) },
          annotations: { italic: true },
        });
      }
      // Code inline
      else if (segment.startsWith("`")) {
        segments.push({
          type: "text",
          text: { content: segment.slice(1, -1) },
          annotations: { code: true },
        });
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      segments.push({
        type: "text",
        text: { content: text.slice(lastIndex) },
        annotations: {},
      });
    }
    return segments;
  }

  markdownToBlocks(markdown) {
    const lines = markdown.split("\n");
    const blocks = [];
    let inCodeBlock = false;
    let codeBlockLang = "";
    let codeBlockLines = [];

    // Nouvelle logique pour listes imbriquées
    const stack = [{ children: blocks, indent: -1 }];
    const listRegex = /^([ \t]*)([-*]|\d+\.) (.*)$/;

    function resetStackToRoot() {
      while (stack.length > 1) {
        stack.pop();
      }
    }

    for (const line of lines) {
      // Bloc de code
      if (line.startsWith("```")) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLang = line.replace("```", "").trim() || "plain text";
          codeBlockLines = [];
        } else {
          // Fin du bloc de code
          resetStackToRoot();
          stack[stack.length - 1].children.push({
            object: "block",
            type: "code",
            code: {
              rich_text: [
                { type: "text", text: { content: codeBlockLines.join("\n") } },
              ],
              language: codeBlockLang,
            },
          });
          inCodeBlock = false;
          codeBlockLang = "";
          codeBlockLines = [];
        }
        continue;
      }
      if (inCodeBlock) {
        codeBlockLines.push(line);
        continue;
      }

      // Image en bloc ![alt](url)
      if (line.match(/^!\[[^\]]*\]\([^)]+\)/)) {
        resetStackToRoot();
        const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
        if (imgMatch) {
          stack[stack.length - 1].children.push({
            object: "block",
            type: "image",
            image: {
              type: "external",
              external: { url: imgMatch[2] },
              caption: imgMatch[1]
                ? [{ type: "text", text: { content: imgMatch[1] } }]
                : [],
            },
          });
        }
        continue;
      }

      // Titre principal (# )
      if (line.startsWith("# ")) {
        resetStackToRoot();
        stack[stack.length - 1].children.push({
          object: "block",
          type: "heading_1",
          heading_1: {
            rich_text: this.parseRichTextWithMarkdown(line.slice(2)),
          },
        });
      }
      // Sous-titre (## )
      else if (line.startsWith("## ")) {
        resetStackToRoot();
        stack[stack.length - 1].children.push({
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: this.parseRichTextWithMarkdown(line.slice(3)),
          },
        });
      }
      // Sous-sous-titre (### )
      else if (line.startsWith("### ")) {
        resetStackToRoot();
        stack[stack.length - 1].children.push({
          object: "block",
          type: "heading_3",
          heading_3: {
            rich_text: this.parseRichTextWithMarkdown(line.slice(4)),
          },
        });
      }
      // Checkbox (- [ ] ou - [x])
      else if (line.match(/^- \[[ xX]\]/)) {
        resetStackToRoot();
        const checked = line.match(/^- \[[xX]\]/) ? true : false;
        const text = line.replace(/^- \[[ xX]\] /, "");
        stack[stack.length - 1].children.push({
          object: "block",
          type: "to_do",
          to_do: {
            rich_text: this.parseRichTextWithMarkdown(text),
            checked: checked,
          },
        });
      }
      // Liste à puces ou numérotée imbriquée
      else if (listRegex.test(line)) {
        const [, indentStr, marker, content] = line.match(listRegex);
        const indent = indentStr.replace(/\t/g, "    ").length;
        const type = marker.match(/\d+\./)
          ? "numbered_list_item"
          : "bulleted_list_item";
        const block = {
          object: "block",
          type,
          [type]: {
            rich_text: this.parseRichTextWithMarkdown(content),
          },
        };
        // Trouver le bon parent selon l'indentation
        while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
          stack.pop();
        }
        // Ajouter comme enfant du parent courant
        stack[stack.length - 1].children.push(block);
        // Préparer à recevoir des enfants si besoin
        block.children = [];
        stack.push({ children: block.children, indent });
      }
      // Texte normal
      else if (line.trim() !== "") {
        resetStackToRoot();
        stack[stack.length - 1].children.push({
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: this.parseRichTextWithMarkdown(line),
          },
        });
      }
    }
    // Nettoyer les propriétés children vides
    function clean(blocks) {
      for (const block of blocks) {
        if (block.children && block.children.length > 0) {
          if (
            block.type === "bulleted_list_item" ||
            block.type === "numbered_list_item"
          ) {
            block[block.type].children = clean(block.children);
          }
        }
        delete block.children;
      }
      return blocks;
    }
    return clean(blocks);
  }

  /**
   * Teste la connexion à Notion et à la database
   */
  async testConnection() {
    try {
      console.log("🔌 Test de connexion à la database Notion...");

      // Tester l'accès à la database
      const database = await this.notion.databases.retrieve({
        database_id: this.databaseId,
      });

      console.log(
        `✅ Connexion réussie ! Database: "${database.title[0]?.plain_text || "Database PRD"}"`,
      );

      // Tester la recherche/création d'entrée
      const projectEntry = await this.getOrCreateProjectEntry();
      console.log(`📋 Projet "${this.projectName}" prêt dans la database`);

      return true;
    } catch (error) {
      console.error("❌ Échec de la connexion:", error.message);
      if (error.code === "object_not_found") {
        console.error("💡 Vérifiez que l'intégration a accès à cette database");
      }
      return false;
    }
  }
}

module.exports = NotionClient;
