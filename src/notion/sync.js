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
      
      // Récupérer l'entrée Notion
      const { entry } = await this.notionClient.getProjectContent();
      // Récupérer tous les blocks récursivement
      const blocks = await this.getAllBlocks(entry.id);
      // Convertir les blocs en Markdown
      const markdown = this.blocksToMarkdown(blocks);
      // Sauvegarder localement
      await fs.writeFile(this.localPrdPath, markdown.trim() + '\n', 'utf8');
      
      console.log('✅ Synchronisation depuis la database Notion terminée !');
      return true;
    } catch (error) {
      console.error('❌ Erreur de synchronisation:', error.message);
      return false;
    }
  }

  /**
   * Ajoute une fonction pour récupérer tous les blocks récursivement (avec pagination et children) depuis Notion
   */
  async getAllBlocks(pageId) {
    const notion = this.notionClient.notion;
    async function fetchBlocks(parentId) {
      let blocks = [];
      let cursor = undefined;
      do {
        const resp = await notion.blocks.children.list({ block_id: parentId, start_cursor: cursor });
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

  /**
   * Améliore la conversion Notion -> Markdown avec gestion de l'imbrication, du texte riche, etc.
   */
  blocksToMarkdown(blocks, depth = 0, listType = null, numIndex = 1) {
    let markdown = '';
    const indent = '  '.repeat(depth);
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      switch (block.type) {
        case 'heading_1':
          markdown += `\n# ${this.richTextToMarkdown(block.heading_1.rich_text)}\n\n`;
          break;
        case 'heading_2':
          markdown += `\n## ${this.richTextToMarkdown(block.heading_2.rich_text)}\n\n`;
          break;
        case 'heading_3':
          markdown += `\n### ${this.richTextToMarkdown(block.heading_3.rich_text)}\n\n`;
          break;
        case 'paragraph':
          markdown += `\n${this.richTextToMarkdown(block.paragraph.rich_text)}\n`;
          break;
        case 'bulleted_list_item':
          markdown += `\n${indent}- ${this.richTextToMarkdown(block.bulleted_list_item.rich_text)}`;
          if (block.bulleted_list_item.children && block.bulleted_list_item.children.length > 0) {
            markdown += this.blocksToMarkdown(block.bulleted_list_item.children, depth + 1, 'bulleted');
          } else if (block.children && block.children.length > 0) {
            markdown += this.blocksToMarkdown(block.children, depth + 1, 'bulleted');
          }
          break;
        case 'numbered_list_item':
          // Trouver la position réelle dans la séquence de la liste numérotée
          let number = numIndex;
          // Chercher les blocks précédents de même type pour incrémenter
          if (listType !== 'numbered') number = 1;
          markdown += `\n${indent}${number}. ${this.richTextToMarkdown(block.numbered_list_item.rich_text)}`;
          if (block.numbered_list_item.children && block.numbered_list_item.children.length > 0) {
            markdown += this.blocksToMarkdown(block.numbered_list_item.children, depth + 1, 'numbered', 1);
          } else if (block.children && block.children.length > 0) {
            markdown += this.blocksToMarkdown(block.children, depth + 1, 'numbered', 1);
          }
          // Incrémenter l'index pour le prochain item de la même liste
          numIndex++;
          break;
        case 'to_do':
          const checked = block.to_do.checked ? 'x' : ' ';
          markdown += `\n${indent}- [${checked}] ${this.richTextToMarkdown(block.to_do.rich_text)}`;
          if (block.to_do.children && block.to_do.children.length > 0) {
            markdown += this.blocksToMarkdown(block.to_do.children, depth + 1);
          } else if (block.children && block.children.length > 0) {
            markdown += this.blocksToMarkdown(block.children, depth + 1);
          }
          break;
        case 'image':
          if (block.image.type === 'external') {
            markdown += `\n${indent}![${block.image.caption?.[0]?.plain_text || ''}](${block.image.external.url})`;
          } else if (block.image.type === 'file') {
            markdown += `\n${indent}![${block.image.caption?.[0]?.plain_text || ''}](${block.image.file.url})`;
          }
          break;
        case 'code':
          markdown += `\n${indent}\`\`\`${block.code.language || ''}\n${block.code.rich_text?.map(rt => rt.plain_text || rt.text?.content || '').join('') || ''}\n\`\`\`\n`;
          break;
        default:
          if (block.children && block.children.length > 0) {
            markdown += this.blocksToMarkdown(block.children, depth);
          }
          break;
      }
      // Si la liste est numérotée, passer l'index au prochain item
      if (block.type === 'numbered_list_item' && listType === 'numbered') {
        numIndex++;
      }
    }
    return markdown;
  }

  /**
   * Conversion du rich_text Notion en markdown (gras, italique, souligné, code, liens)
   */
  richTextToMarkdown(richTextArr) {
    if (!richTextArr || !Array.isArray(richTextArr)) return '';
    return richTextArr.map(rt => {
      let text = rt.plain_text || rt.text?.content || '';
      if (rt.annotations) {
        if (rt.annotations.bold) text = `**${text}**`;
        if (rt.annotations.italic) text = `*${text}*`;
        if (rt.annotations.underline) text = `__${text}__`;
        if (rt.annotations.code) text = '`' + text + '`';
      }
      if (rt.href || (rt.text && rt.text.link && rt.text.link.url)) {
        const url = rt.href || rt.text.link.url;
        text = `[${text}](${url})`;
      }
      return text;
    }).join('');
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