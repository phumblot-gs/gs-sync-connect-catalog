const fs = require('fs').promises;
const path = require('path');
const NotionClient = require('./client');

class NotionSync {
  constructor() {
    this.notionClient = new NotionClient();
    this.localPrdPath = path.join(__dirname, '../../PRD.md');
  }

  /**
   * Synchronise le PRD local vers la database Notion
   */
  async syncToNotion() {
    try {
      console.log('🚀 Début de la synchronisation vers la database Notion...');
      
      // Lire le fichier PRD local
      const prdContent = await fs.readFile(this.localPrdPath, 'utf8');
      console.log('📖 PRD local lu avec succès');
      
      // Envoyer vers la database Notion
      await this.notionClient.updateProjectContent(prdContent);
      
      console.log('✅ Synchronisation vers la database Notion terminée !');
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error('❌ Fichier PRD.md introuvable. Exécutez d\'abord "npm run init-prd"');
      } else {
        console.error('❌ Erreur de synchronisation:', error.message);
      }
      return false;
    }
  }

  /**
   * Synchronise le contenu de la database Notion vers le fichier local
   */
  async syncFromNotion() {
    try {
      console.log('🚀 Début de la synchronisation depuis la database Notion...');
      
      // Récupérer le contenu depuis la database Notion
      const { blocks } = await this.notionClient.getProjectContent();
      
      // Convertir les blocs en Markdown
      const markdown = this.blocksToMarkdown(blocks);
      
      // Sauvegarder localement
      await fs.writeFile(this.localPrdPath, markdown, 'utf8');
      
      console.log('✅ Synchronisation depuis la database Notion terminée !');
      return true;
    } catch (error) {
      console.error('❌ Erreur de synchronisation:', error.message);
      return false;
    }
  }

  /**
   * Convertit les blocs Notion en Markdown
   */
  blocksToMarkdown(blocks) {
    let markdown = '';
    
    for (const block of blocks) {
      switch (block.type) {
        case 'heading_1':
          markdown += `# ${this.extractText(block.heading_1.rich_text)}\n\n`;
          break;
        case 'heading_2':
          markdown += `## ${this.extractText(block.heading_2.rich_text)}\n\n`;
          break;
        case 'heading_3':
          markdown += `### ${this.extractText(block.heading_3.rich_text)}\n\n`;
          break;
        case 'paragraph':
          markdown += `${this.extractText(block.paragraph.rich_text)}\n\n`;
          break;
        case 'bulleted_list_item':
          markdown += `- ${this.extractText(block.bulleted_list_item.rich_text)}\n`;
          break;
        case 'to_do':
          const checked = block.to_do.checked ? 'x' : ' ';
          markdown += `- [${checked}] ${this.extractText(block.to_do.rich_text)}\n`;
          break;
        default:
          // Ignorer les types de blocs non supportés
          break;
      }
    }
    
    return markdown.trim();
  }

  /**
   * Extrait le texte des rich_text de Notion
   */
  extractText(richText) {
    if (!richText || !Array.isArray(richText)) return '';
    return richText.map(text => text.plain_text || text.text?.content || '').join('');
  }
}

// CLI interface
if (require.main === module) {
  const sync = new NotionSync();
  const args = process.argv.slice(2);
  
  if (args.includes('--to-notion')) {
    sync.syncToNotion();
  } else if (args.includes('--from-notion')) {
    sync.syncFromNotion();
  } else {
    console.log('Usage:');
    console.log('  node sync.js --to-notion     # Synchronise vers Notion');
    console.log('  node sync.js --from-notion   # Synchronise depuis Notion');
  }
}

module.exports = NotionSync; 