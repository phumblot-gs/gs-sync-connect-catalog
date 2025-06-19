const NotionSync = require('./sync');
const FeaturesSync = require('./features-sync');

class AllSync {
  constructor() {
    this.prdSync = new NotionSync();
    this.featuresSync = new FeaturesSync();
  }

  /**
   * Synchronise PRD et features vers Notion
   */
  async syncAllToNotion() {
    try {
      console.log('🚀 Synchronisation complète vers Notion (PRD + Features)...');
      console.log('='.repeat(60));
      
      // Synchroniser le PRD
      console.log('📄 Synchronisation du PRD...');
      const prdSuccess = await this.prdSync.syncToNotion();
      
      console.log(''); // Ligne vide pour séparer
      
      // Synchroniser les features
      console.log('📋 Synchronisation des features...');
      const featuresSuccess = await this.featuresSync.syncFeaturesToNotion();
      
      console.log(''); // Ligne vide pour séparer
      console.log('='.repeat(60));
      
      if (prdSuccess && featuresSuccess) {
        console.log('✅ Synchronisation complète vers Notion terminée avec succès !');
        return true;
      } else {
        console.log('⚠️ Synchronisation terminée avec des erreurs');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation complète:', error.message);
      return false;
    }
  }

  /**
   * Synchronise PRD et features depuis Notion
   */
  async syncAllFromNotion() {
    try {
      console.log('🚀 Synchronisation complète depuis Notion (PRD + Features)...');
      console.log('='.repeat(60));
      
      // Synchroniser le PRD
      console.log('📄 Synchronisation du PRD...');
      const prdSuccess = await this.prdSync.syncFromNotion();
      
      console.log(''); // Ligne vide pour séparer
      
      // Synchroniser les features
      console.log('📋 Synchronisation des features...');
      const featuresSuccess = await this.featuresSync.syncFeaturesFromNotion();
      
      console.log(''); // Ligne vide pour séparer
      console.log('='.repeat(60));
      
      if (prdSuccess && featuresSuccess) {
        console.log('✅ Synchronisation complète depuis Notion terminée avec succès !');
        return true;
      } else {
        console.log('⚠️ Synchronisation terminée avec des erreurs');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation complète:', error.message);
      return false;
    }
  }
}

// CLI interface
if (require.main === module) {
  const sync = new AllSync();
  const args = process.argv.slice(2);
  
  if (args.includes('--to-notion')) {
    sync.syncAllToNotion();
  } else if (args.includes('--from-notion')) {
    sync.syncAllFromNotion();
  } else {
    console.log('Usage:');
    console.log('  node sync-all.js --to-notion     # Synchronise PRD + Features vers Notion');
    console.log('  node sync-all.js --from-notion   # Synchronise PRD + Features depuis Notion');
  }
}

module.exports = AllSync; 