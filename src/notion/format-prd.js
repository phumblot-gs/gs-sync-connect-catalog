const fs = require('fs').promises;
const path = require('path');
const NotionClient = require('./client');
const NotionSync = require('./sync');

class PrdFormatter {
  constructor() {
    this.notionClient = new NotionClient();
    this.notionSync = new NotionSync();
    this.localPrdPath = path.join(__dirname, '../../PRD.md');
  }

  /**
   * Formate le fichier PRD.md selon le format de sortie Notion
   */
  async formatPrdForNotion() {
    try {
      console.log('📝 Formatage du PRD.md selon le format Notion...');
      
      // Lire le fichier PRD local
      const prdContent = await fs.readFile(this.localPrdPath, 'utf8');
      console.log('📖 PRD local lu avec succès');
      
      // Convertir en blocks Notion (comme lors de l'import)
      const blocks = this.notionClient.markdownToBlocks(prdContent);
      console.log(`🔄 Conversion en ${blocks.length} blocks Notion`);
      
      // Reconvertir en markdown (comme lors de l'export)
      let formattedMarkdown = this.notionSync.blocksToMarkdown(blocks);
      
      // Normaliser l'espacement final (même logique que syncFromNotion)
      formattedMarkdown = formattedMarkdown
        .replace(/\n{3,}/g, '\n\n') // Remplacer 3+ sauts de ligne consécutifs par 2
        .replace(/^\n+/, '') // Supprimer les sauts de ligne en début de document
        .trim(); // Supprimer les espaces en fin de document
      
      // Ajouter le saut de ligne final
      formattedMarkdown += '\n';
      
      // Sauvegarder le fichier formaté
      await fs.writeFile(this.localPrdPath, formattedMarkdown, 'utf8');
      
      console.log('✅ PRD.md formaté avec succès selon le format Notion !');
      console.log('💡 Le fichier est maintenant prêt pour un commit sans diff de mise en forme.');
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error('❌ Fichier PRD.md introuvable. Exécutez d\'abord "npm run init-prd"');
      } else {
        console.error('❌ Erreur de formatage:', error.message);
      }
      return false;
    }
  }
}

// Exécution du script
async function main() {
  const formatter = new PrdFormatter();
  const success = await formatter.formatPrdForNotion();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = PrdFormatter; 