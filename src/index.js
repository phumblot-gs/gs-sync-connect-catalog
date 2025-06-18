const NotionClient = require('./notion/client');
const NotionSync = require('./notion/sync');

async function main() {
  console.log('🚀 GS Sync Connect Catalog - Notion Integration');
  console.log('='.repeat(50));
  
  try {
    // Test de connexion
    const client = new NotionClient();
    const connected = await client.testConnection();
    
    if (!connected) {
      console.log('\n❌ Impossible de se connecter à Notion.');
      console.log('Vérifiez votre fichier .env et les permissions de votre intégration.');
      return;
    }
    
    console.log('\n📋 Options disponibles :');
    console.log('1. npm run init-prd        # Initialiser le PRD local');
    console.log('2. npm run sync-to-notion  # Synchroniser vers Notion');
    console.log('3. npm run sync-from-notion # Synchroniser depuis Notion');
    console.log('4. npm start               # Test de connexion');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

if (require.main === module) {
  main();
} 