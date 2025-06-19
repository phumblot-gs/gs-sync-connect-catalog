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
      let markdown = this.blocksToMarkdown(blocks);
      
      // Normaliser l'espacement final
      markdown = markdown
        .replace(/\n{3,}/g, '\n\n') // Remplacer 3+ sauts de ligne consécutifs par 2
        .replace(/^\n+/, '') // Supprimer les sauts de ligne en début de document
        .trim(); // Supprimer les espaces en fin de document
      
      // Ajouter le saut de ligne final
      markdown += '\n';
      
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
      const nextBlock = blocks[i + 1];
      const prevBlock = blocks[i - 1];
      
      switch (block.type) {
        case 'heading_1':
          // Ligne vierge avant le titre (sauf si premier block au niveau racine)
          if (i > 0 || depth > 0) markdown += '\n\n';
          markdown += `# ${this.richTextToMarkdown(block.heading_1.rich_text)}`;
          // Ligne vierge après le titre
          markdown += '\n';
          break;
          
        case 'heading_2':
          if (i > 0 || depth > 0) markdown += '\n\n';
          markdown += `## ${this.richTextToMarkdown(block.heading_2.rich_text)}`;
          markdown += '\n';
          break;
          
        case 'heading_3':
          if (i > 0 || depth > 0) markdown += '\n\n';
          markdown += `### ${this.richTextToMarkdown(block.heading_3.rich_text)}`;
          markdown += '\n';
          break;
          
        case 'paragraph':
          const paragraphText = this.richTextToMarkdown(block.paragraph.rich_text);
          if (paragraphText.trim()) {
            // Ligne vierge avant le paragraphe si nécessaire
            if (i > 0 && prevBlock && !this.isListItem(prevBlock)) {
              markdown += '\n';
            } else if (i > 0) {
              markdown += '\n';
            }
            markdown += paragraphText;
          }
          break;
          
        case 'bulleted_list_item':
          markdown += `\n${indent}- ${this.richTextToMarkdown(block.bulleted_list_item.rich_text)}`;
          if (block.bulleted_list_item.children && block.bulleted_list_item.children.length > 0) {
            markdown += this.blocksToMarkdown(block.bulleted_list_item.children, depth + 1, 'bulleted');
          } else if (block.children && block.children.length > 0) {
            markdown += this.blocksToMarkdown(block.children, depth + 1, 'bulleted');
          }
          // Ajouter une ligne vierge après la liste si c'est le dernier item de la liste
          if (!nextBlock || !this.isListItem(nextBlock)) {
            markdown += '\n';
          }
          break;
          
        case 'numbered_list_item':
          // Compter les items de liste numérotée précédents au même niveau
          let actualNumber = 1;
          for (let j = 0; j < i; j++) {
            if (blocks[j].type === 'numbered_list_item') {
              actualNumber++;
            }
          }
          // Si on est dans une sous-liste, commencer à 1
          if (listType === 'numbered') {
            actualNumber = numIndex;
          }
          
          markdown += `\n${indent}${actualNumber}. ${this.richTextToMarkdown(block.numbered_list_item.rich_text)}`;
          if (block.numbered_list_item.children && block.numbered_list_item.children.length > 0) {
            markdown += this.blocksToMarkdown(block.numbered_list_item.children, depth + 1, 'numbered', 1);
          } else if (block.children && block.children.length > 0) {
            markdown += this.blocksToMarkdown(block.children, depth + 1, 'numbered', 1);
          }
          // Ajouter une ligne vierge après la liste si c'est le dernier item de la liste
          if (!nextBlock || !this.isListItem(nextBlock)) {
            markdown += '\n';
          }
          break;
          
        case 'to_do':
          const checked = block.to_do.checked ? 'x' : ' ';
          markdown += `\n${indent}- [${checked}] ${this.richTextToMarkdown(block.to_do.rich_text)}`;
          if (block.to_do.children && block.to_do.children.length > 0) {
            markdown += this.blocksToMarkdown(block.to_do.children, depth + 1);
          } else if (block.children && block.children.length > 0) {
            markdown += this.blocksToMarkdown(block.children, depth + 1);
          }
          // Ajouter une ligne vierge après la liste de todos si c'est le dernier item
          if (!nextBlock || !this.isListItem(nextBlock)) {
            markdown += '\n';
          }
          break;
          
        case 'image':
          // Ligne vierge avant l'image
          if (i > 0) markdown += '\n';
          if (block.image.type === 'external') {
            markdown += `${indent}![${block.image.caption?.[0]?.plain_text || ''}](${block.image.external.url})`;
          } else if (block.image.type === 'file') {
            markdown += `${indent}![${block.image.caption?.[0]?.plain_text || ''}](${block.image.file.url})`;
          }
          // Ligne vierge après l'image
          if (nextBlock) markdown += '\n';
          break;
          
        case 'code':
          // Ligne vierge avant le bloc de code
          if (i > 0) markdown += '\n\n';
          markdown += `${indent}\`\`\`${block.code.language || ''}\n${block.code.rich_text?.map(rt => rt.plain_text || rt.text?.content || '').join('') || ''}\n\`\`\``;
          // Ligne vierge après le bloc de code
          if (nextBlock) markdown += '\n';
          break;
          
        default:
          if (block.children && block.children.length > 0) {
            markdown += this.blocksToMarkdown(block.children, depth);
          }
          break;
      }
      
      // Incrémenter l'index pour les listes numérotées imbriquées
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
      
      // Appliquer les annotations dans un ordre cohérent
      if (rt.annotations) {
        if (rt.annotations.code) {
          text = '`' + text + '`';
        } else {
          if (rt.annotations.bold) text = `**${text}**`;
          if (rt.annotations.italic) text = `*${text}*`;
          if (rt.annotations.underline) text = `__${text}__`;
        }
      }
      
      // Gérer les liens
      if (rt.href || (rt.text && rt.text.link && rt.text.link.url)) {
        const url = rt.href || rt.text.link.url;
        text = `[${text}](${url})`;
      }
      
      return text;
    }).join('');
  }

  // Fonction utilitaire pour détecter si un block est un item de liste
  isListItem(block) {
    return block && (
      block.type === 'bulleted_list_item' || 
      block.type === 'numbered_list_item' || 
      block.type === 'to_do'
    );
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