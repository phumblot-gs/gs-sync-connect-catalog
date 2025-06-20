'use client'

import { useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'

export default function AuthForm() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Connexion</h2>
      
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={['google']}
        redirectTo={`${window.location.origin}/auth/callback`}
        localization={{
          variables: {
            sign_in: {
              email_label: 'Email',
              password_label: 'Mot de passe',
              button_label: 'Se connecter',
              loading_button_label: 'Connexion...',
              social_provider_text: 'Se connecter avec {{provider}}',
              link_text: 'Déjà un compte ? Se connecter'
            }
          }
        }}
      />
      
      {loading && (
        <div className="mt-4 text-center text-gray-600">
          Connexion en cours...
        </div>
      )}
    </div>
  )
} 