const fs = require('fs');
const path = require('path');

function addStandardVars(envFile, envName) {
  console.log(`🔧 Ajout des variables standard pour ${envName}...`);
  
  const envPath = path.join(process.cwd(), envFile);
  let content = fs.readFileSync(envPath, 'utf8');
  
  // Extraire les valeurs selon l'environnement
  let urlMatch, anonKeyMatch, serviceRoleMatch;
  
  if (envName === 'staging') {
    urlMatch = content.match(/NEXT_PUBLIC_SUPABASE_URL_STAGING=(.+)/);
    anonKeyMatch = content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING=(.+)/);
    serviceRoleMatch = content.match(/SUPABASE_SERVICE_ROLE_KEY_STAGING=(.+)/);
  } else if (envName === 'production') {
    urlMatch = content.match(/NEXT_PUBLIC_SUPABASE_URL_PROD=(.+)/);
    anonKeyMatch = content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD=(.+)/);
    serviceRoleMatch = content.match(/SUPABASE_SERVICE_ROLE_KEY_PROD=(.+)/);
  }
  
  if (urlMatch && anonKeyMatch && serviceRoleMatch) {
    const url = urlMatch[1];
    const anonKey = anonKeyMatch[1];
    const serviceRoleKey = serviceRoleMatch[1];
    
    // Vérifier si les variables standard existent déjà
    if (!content.includes('NEXT_PUBLIC_SUPABASE_URL=')) {
      // Ajouter les variables standard après les variables spécifiques
      const insertPoint = content.indexOf('# Configuration API Grand Shooting');
      const newVars = `\n# Variables standard pour le middleware Supabase (nécessaires pour createMiddlewareClient)
NEXT_PUBLIC_SUPABASE_URL=${url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}
SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}

`;
      
      content = content.slice(0, insertPoint) + newVars + content.slice(insertPoint);
      
      // Écrire le fichier modifié
      fs.writeFileSync(envPath, content);
      console.log(`✅ Variables standard ajoutées pour ${envName} !`);
    } else {
      console.log(`ℹ️  Les variables standard existent déjà pour ${envName}`);
    }
  } else {
    console.log(`❌ Impossible de trouver les variables ${envName} dans le fichier`);
  }
}

// Traiter les deux environnements
addStandardVars('.env.staging', 'staging');
addStandardVars('.env.production', 'production');

console.log('\n🎉 Configuration terminée !');
console.log('📋 Prochaines étapes :');
console.log('1. Tester staging : NODE_ENV=staging npm run dev');
console.log('2. Tester production : NODE_ENV=production npm run dev'); 