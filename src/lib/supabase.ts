import { createClient } from '@supabase/supabase-js'

// Détection du mode CI - doit être fait AVANT toute autre logique
const isCIEnvironment = process.env.GITHUB_ACTIONS === 'true'

// Variables pour les exports
let supabase: any
let supabaseAdmin: any
let supabaseConfig: any
let hasAdminClient: () => boolean
let isBuildMode: () => boolean

// En mode CI, on utilise des valeurs factices
if (isCIEnvironment) {
  console.log('🔧 Mode CI détecté - Utilisation de valeurs factices pour Supabase')
  
  supabase = createClient(
    'https://dummy.supabase.co',
    'dummy-key-for-build-only'
  )
  supabaseAdmin = null
  
  supabaseConfig = {
    url: 'https://dummy.supabase.co',
    environment: 'ci',
    hasServiceRoleKey: false,
    isCIEnvironment: true
  }
  
  hasAdminClient = () => false
  isBuildMode = () => true
  
} else {
  // Mode normal - logique existante
  type Environment = 'development' | 'staging' | 'production'

  const getSupabaseConfig = () => {
    const env = (process.env.NODE_ENV || 'development') as Environment
    
    switch (env) {
      case 'development':
        return {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL_DEV || process.env.NEXT_PUBLIC_SUPABASE_URL,
          anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY_DEV || process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      case 'staging':
        return {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL_STAGING,
          anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING,
          serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY_STAGING
        }
      case 'production':
        return {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL_PROD,
          anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD,
          serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY_PROD
        }
      default:
        throw new Error(`Environnement non supporté: ${env}`)
    }
  }

  const config = getSupabaseConfig()

  if (!config.url || !config.anonKey) {
    throw new Error('Configuration Supabase manquante')
  }

  supabase = createClient(config.url, config.anonKey)
  
  supabaseAdmin = config.serviceRoleKey 
    ? createClient(config.url, config.serviceRoleKey)
    : null

  supabaseConfig = {
    url: config.url,
    environment: process.env.NODE_ENV || 'development',
    hasServiceRoleKey: !!config.serviceRoleKey,
    isCIEnvironment: false
  }

  hasAdminClient = () => !!supabaseAdmin
  isBuildMode = () => false
}

// Exports
export { supabase, supabaseAdmin, supabaseConfig, hasAdminClient, isBuildMode }
