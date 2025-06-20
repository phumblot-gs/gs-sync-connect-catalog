'use client'

import { supabaseConfig } from '@/lib/supabase'

const getEnvironmentColor = (env: string) => {
  switch (env) {
    case 'development':
      return 'bg-blue-500 text-white'
    case 'staging':
      return 'bg-yellow-500 text-black'
    case 'production':
      return 'bg-green-500 text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}

const getEnvironmentLabel = (env: string) => {
  switch (env) {
    case 'development':
      return 'DEV'
    case 'staging':
      return 'STAGING'
    case 'production':
      return 'PROD'
    default:
      return env.toUpperCase()
  }
}

export default function EnvironmentBanner() {
  const environment = supabaseConfig.environment
  
  // Ne pas afficher en production
  if (environment === 'production') {
    return null
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${getEnvironmentColor(environment)} text-center py-1 text-sm font-medium`}>
      Environnement : {getEnvironmentLabel(environment)}
    </div>
  )
} 