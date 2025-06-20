import { createClient } from '@supabase/supabase-js'

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

// Vérifier si nous sommes dans un environnement de build avec des valeurs factices
const isBuildEnvironment = process.env.NODE_ENV === 'production' && 
  (config.url?.includes('dummy') || config.anonKey?.includes('dummy'))

if (!config.url || !config.anonKey) {
  throw new Error('Configuration Supabase manquante')
}

// Créer le client Supabase seulement si nous ne sommes pas en mode build factice
export const supabase = isBuildEnvironment 
  ? null 
  : createClient(config.url, config.anonKey)

// Client admin (pour Edge Functions ou API sécurisée)
// Seulement créé si serviceRoleKey est disponible et pas en mode build factice
export const supabaseAdmin = (config.serviceRoleKey && !isBuildEnvironment)
  ? createClient(config.url, config.serviceRoleKey)
  : null

// Export de la configuration pour debug
export const supabaseConfig = {
  url: config.url,
  environment: process.env.NODE_ENV || 'development',
  hasServiceRoleKey: !!config.serviceRoleKey,
  isBuildEnvironment
}

// Fonction utilitaire pour vérifier si le client admin est disponible
export const hasAdminClient = () => !!supabaseAdmin

// Fonction utilitaire pour vérifier si nous sommes en mode build
export const isBuildMode = () => isBuildEnvironment 