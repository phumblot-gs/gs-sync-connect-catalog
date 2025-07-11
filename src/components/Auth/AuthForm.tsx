'use client'

import { useState, useEffect } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase, isBuildMode } from '@/lib/supabase'

export default function AuthForm() {
  const [redirectTo, setRedirectTo] = useState('');

  useEffect(() => {
    // This code runs only on the client side
    setRedirectTo(`${window.location.origin}/auth/callback`);
  }, []);

  // Si nous sommes en mode build, afficher un message
  if (isBuildMode()) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Mode Build</h2>
        <p className="text-gray-600 text-center">
          Cette page n'est pas disponible en mode build statique.
        </p>
      </div>
    );
  }

  if (!redirectTo) {
    // Render a loading state or nothing while waiting for the client-side redirect URL
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md animate-pulse">
        <h2 className="text-2xl font-bold mb-6 text-center">Chargement...</h2>
        <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
        <div className="h-12 bg-gray-300 rounded w-full"></div>
      </div>
    );
  }

  // Vérifier que supabase est disponible
  if (!supabase) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Erreur de configuration</h2>
        <p className="text-red-600 text-center">
          Impossible de se connecter à Supabase.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Connexion</h2>
      
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={['google']}
        redirectTo={redirectTo}
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
    </div>
  )
} 