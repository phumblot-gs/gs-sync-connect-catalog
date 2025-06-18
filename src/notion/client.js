const { Client } = require('@notionhq/client');
require('dotenv').config();

class NotionClient {
  constructor() {
    if (!process.env.NOTION_TOKEN) {
      throw new Error('NOTION_TOKEN manquant dans le fichier .env');
    }
    
    this.notion = new Client({
      auth: process.env.NOTION_TOKEN,
    });
    
    this.databaseId = process.env.NOTION_PAGE_ID; // Maintenant c'est une database ID
    this.workspace = process.env.NOTION_WORKSPACE;
    this.projectName = 'GS Sync Connect Catalog';
  }

  /**
   * Récupère ou crée l'entrée PRD dans la database
   */
  async getOrCreateProjectEntry() {
    try {
      console.log(`📖 Recherche du projet "${this.projectName}" dans la database...`);
      
      // Chercher l'entrée existante
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        filter: {
          property: 'Name',
          title: {
            equals: this.projectName
          }
        }
      });
      
      if (response.results.length > 0) {
        console.log('✅ Projet trouvé dans la database');
        return response.results[0];
      } else {
        console.log('🆕 Création d\'une nouvelle entrée dans la database...');
        return await this.createProjectEntry();
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération/création:', error.message);
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
          'Name': {
            title: [
              {
                text: {
                  content: this.projectName
                }
              }
            ]
          },
          'Status': {
            select: {
              name: 'draft'
            }
          },
          'Description': {
            rich_text: [
              {
                text: {
                  content: 'Application de synchronisation entre comptes Grand Shooting avec monitoring'
                }
              }
            ]
          },
          'Application': {
            select: {
              name: 'Service'
            }
          }
        }
      });
      
      console.log('✅ Nouvelle entrée créée avec succès !');
      return newPage;
    } catch (error) {
      console.error('❌ Erreur lors de la création:', error.message);
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
        block_id: projectEntry.id 
      });
      
      return {
        entry: projectEntry,
        blocks: blocks.results
      };
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du contenu:', error.message);
      throw error;
    }
  }

  /**
   * Met à jour le contenu PRD dans la database
   */
  async updateProjectContent(content) {
    try {
      console.log(`📝 Mise à jour du PRD "${this.projectName}"...`);
      
      // Récupérer ou créer l'entrée
      const projectEntry = await this.getOrCreateProjectEntry();
      
      // Mettre à jour les propriétés de l'entrée
      await this.notion.pages.update({
        page_id: projectEntry.id,
        properties: {
          'Status': {
            select: {
              name: 'draft'
            }
          },
          'Description': {
            rich_text: [
              {
                text: {
                  content: 'Application de synchronisation entre comptes Grand Shooting avec monitoring - Mis à jour automatiquement'
                }
              }
            ]
          }
        }
      });
      
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
          children: chunk
        });
      }
      
      console.log('✅ PRD mis à jour avec succès dans la database !');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error.message);
      throw error;
    }
  }

  /**
   * Supprime tout le contenu d'une page
   */
  async clearPageContent(pageId) {
    try {
      const blocks = await this.notion.blocks.children.list({ block_id: pageId });
      
      for (const block of blocks.results) {
        await this.notion.blocks.delete({ block_id: block.id });
      }
      
      console.log('🗑️ Contenu existant supprimé');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error.message);
      throw error;
    }
  }

  /**
   * Convertit du Markdown en blocs Notion
   */
  markdownToBlocks(markdown) {
    const lines = markdown.split('\n');
    const blocks = [];
    
    for (const line of lines) {
      if (line.trim() === '') {
        continue; // Ignorer les lignes vides
      }
      
      // Titre principal (# )
      if (line.startsWith('# ')) {
        blocks.push({
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ type: 'text', text: { content: line.slice(2) } }]
          }
        });
      }
      // Sous-titre (## )
      else if (line.startsWith('## ')) {
        blocks.push({
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: line.slice(3) } }]
          }
        });
      }
      // Sous-sous-titre (### )
      else if (line.startsWith('### ')) {
        blocks.push({
          object: 'block',
          type: 'heading_3',
          heading_3: {
            rich_text: [{ type: 'text', text: { content: line.slice(4) } }]
          }
        });
      }
      // Liste à puces (- )
      else if (line.startsWith('- ')) {
        blocks.push({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: line.slice(2) } }]
          }
        });
      }
      // Checkbox (- [ ] ou - [x])
      else if (line.match(/^- \[[ x]\]/)) {
        const checked = line.includes('[x]');
        const text = line.replace(/^- \[[ x]\] /, '');
        blocks.push({
          object: 'block',
          type: 'to_do',
          to_do: {
            rich_text: [{ type: 'text', text: { content: text } }],
            checked: checked
          }
        });
      }
      // Texte normal
      else {
        blocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: line } }]
          }
        });
      }
    }
    
    return blocks;
  }

  /**
   * Teste la connexion à Notion et à la database
   */
  async testConnection() {
    try {
      console.log('🔌 Test de connexion à la database Notion...');
      
      // Tester l'accès à la database
      const database = await this.notion.databases.retrieve({ 
        database_id: this.databaseId 
      });
      
      console.log(`✅ Connexion réussie ! Database: "${database.title[0]?.plain_text || 'Database PRD'}"`);
      
      // Tester la recherche/création d'entrée
      const projectEntry = await this.getOrCreateProjectEntry();
      console.log(`📋 Projet "${this.projectName}" prêt dans la database`);
      
      return true;
    } catch (error) {
      console.error('❌ Échec de la connexion:', error.message);
      if (error.code === 'object_not_found') {
        console.error('💡 Vérifiez que l\'intégration a accès à cette database');
      }
      return false;
    }
  }
}

module.exports = NotionClient; 