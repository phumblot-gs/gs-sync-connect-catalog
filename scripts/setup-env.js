#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

async function generateEnvFile(environment) {
  console.log(`\n🔧 Configuration de l'environnement : ${environment.toUpperCase()}`)
  console.log('='.repeat(50))

  const envVars = {}

  // Supabase URL
  envVars[`NEXT_PUBLIC_SUPABASE_URL_${environment.toUpperCase()}`] = await question(
    `URL Supabase ${environment} (ex: https://abc123.supabase.co): `
  )

  // Supabase Anon Key
  envVars[`NEXT_PUBLIC_SUPABASE_ANON_KEY_${environment.toUpperCase()}`] = await question(
    `Clé anonyme Supabase ${environment}: `
  )

  // Supabase Service Role Key
  envVars[`SUPABASE_SERVICE_ROLE_KEY_${environment.toUpperCase()}`] = await question(
    `Clé service role Supabase ${environment}: `
  )

  // JWT Secret
  const jwtSecret = await question(
    `JWT Secret ${environment} (ou appuyer sur Entrée pour générer): `
  )
  envVars.JWT_SECRET = jwtSecret || generateJWTSecret()

  // Sentry DSN (optionnel)
  const sentryDSN = await question(
    `Sentry DSN ${environment} (optionnel, appuyer sur Entrée pour ignorer): `
  )
  if (sentryDSN) {
    envVars.NEXT_PUBLIC_SENTRY_DSN = sentryDSN
  }

  // API Grand Shooting
  envVars.GRAND_SHOOTING_API_URL = 'https://api.grand-shooting.com'

  // Générer le contenu du fichier
  let content = `# ========================================\n`
  content += `# ENVIRONNEMENT : ${environment.toUpperCase()}\n`
  content += `# ========================================\n\n`

  content += `# Configuration Supabase ${environment}\n`
  content += `${envVars[`NEXT_PUBLIC_SUPABASE_URL_${environment.toUpperCase()}`]}\n`
  content += `${envVars[`NEXT_PUBLIC_SUPABASE_ANON_KEY_${environment.toUpperCase()}`]}\n`
  content += `${envVars[`SUPABASE_SERVICE_ROLE_KEY_${environment.toUpperCase()}`]}\n\n`

  content += `# Configuration API Grand Shooting\n`
  content += `GRAND_SHOOTING_API_URL=${envVars.GRAND_SHOOTING_API_URL}\n\n`

  content += `# JWT Secret pour les tokens API\n`
  content += `JWT_SECRET=${envVars.JWT_SECRET}\n\n`

  if (envVars.NEXT_PUBLIC_SENTRY_DSN) {
    content += `# Sentry\n`
    content += `NEXT_PUBLIC_SENTRY_DSN=${envVars.NEXT_PUBLIC_SENTRY_DSN}\n\n`
  }

  // Écrire le fichier
  const envFile = `.env.${environment}`
  fs.writeFileSync(envFile, content)
  
  console.log(`\n✅ Fichier ${envFile} créé avec succès !`)
  return envFile
}

function generateJWTSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function main() {
  console.log('🚀 Configuration des variables d\'environnement')
  console.log('='.repeat(50))
  console.log('Ce script va t\'aider à configurer les variables d\'environnement')
  console.log('pour les 3 environnements : development, staging, production\n')

  const environments = ['development', 'staging', 'production']
  const createdFiles = []

  for (const env of environments) {
    const answer = await question(`Configurer l'environnement ${env} ? (y/N): `)
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      const envFile = await generateEnvFile(env)
      createdFiles.push(envFile)
    }
  }

  console.log('\n🎉 Configuration terminée !')
  console.log('='.repeat(50))
  
  if (createdFiles.length > 0) {
    console.log('Fichiers créés :')
    createdFiles.forEach(file => console.log(`  - ${file}`))
    
    console.log('\n📋 Prochaines étapes :')
    console.log('1. Vérifier les valeurs dans les fichiers .env.*')
    console.log('2. Tester la connexion : npm run dev')
    console.log('3. Appliquer les migrations : npm run supabase:dev')
  }

  rl.close()
}

main().catch(console.error) 