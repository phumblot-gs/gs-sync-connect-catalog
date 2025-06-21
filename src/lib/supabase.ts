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
    // Déterminer l'environnement métier
    const getEnvironment = (): Environment => {
      if (process.env.NODE_ENV === 'development') {
        return 'development'
      }
      
      // Côté client : utiliser NEXT_PUBLIC_APP_ENV
      // Côté serveur : utiliser VERCEL_ENV
      const appEnv = process.env.NEXT_PUBLIC_APP_ENV || process.env.VERCEL_ENV
      
      if (appEnv === 'staging' || appEnv === 'preview') {
        return 'staging'
      }
      
      return 'production'
    }

    const env = getEnvironment()
    
    console.log('🔧 Supabase Config Debug:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
      env,
      NEXT_PUBLIC_SUPABASE_URL_DEV: process.env.NEXT_PUBLIC_SUPABASE_URL_DEV ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'
    });
    
    switch (env) {
      case 'development':
        return {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL_DEV || process.env.NEXT_PUBLIC_SUPABASE_URL,
          anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY_DEV || process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      case 'staging':
        return {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL_STAGING || process.env.NEXT_PUBLIC_SUPABASE_URL,
          anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY_STAGING || process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      case 'production':
        return {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
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
