'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase, isBuildMode } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthForm() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  // Si l'utilisateur est connecté et autorisé, le rediriger vers le dashboard
  useEffect(() => {
    if (user) {
      // Synchroniser la session avec le serveur
      const syncSession = async () => {
        try {
          console.log('🔧 Synchronisation de la session avec le serveur...');
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session) {
            const response = await fetch('/api/auth/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session })
            });
            
            if (response.ok) {
              console.log('✅ Session synchronisée, redirection vers dashboard');
              router.push('/dashboard');
            } else {
              console.error('❌ Erreur lors de la synchronisation');
            }
          }
        } catch (error) {
          console.error('❌ Erreur sync:', error);
          // Même en cas d'erreur, on essaie de rediriger
          router.push('/dashboard');
        }
      }
      
      syncSession();
    }
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: 'select_account consent',
          access_type: 'offline'
        }
      },
    });
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    
    // Déconnexion de Supabase
    await supabase.auth.signOut();
    
    // Forcer la déconnexion Google en ouvrant une nouvelle fenêtre
    // puis recharger la page
    const googleLogoutUrl = 'https://accounts.google.com/logout';
    const popup = window.open(googleLogoutUrl, 'google-logout', 'width=500,height=500');
    
    // Fermer la popup après 2 secondes et recharger la page
    setTimeout(() => {
      if (popup) popup.close();
      window.location.reload();
    }, 2000);
  };

  // En mode build, on affiche un message
  if (isBuildMode()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Mode Build</h2>
          <p className="text-gray-600 text-center">
            Cette page n'est pas disponible en mode build statique.
          </p>
        </div>
      </div>
    );
  }

  // Pendant le chargement de la session, on affiche un spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Chargement...</h2>
          <p className="text-gray-600">Vérification de votre session...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur est déjà connecté
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Déjà Connecté</h2>
            <p className="text-gray-600 mb-2">Connecté en tant que :</p>
            <p className="font-semibold text-indigo-600 text-lg mb-6">{user.email}</p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors duration-200 shadow-md"
            >
              Accéder au Dashboard
            </button>
            <button
              onClick={handleSignOut}
              className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              Se déconnecter
            </button>
            <button
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 border border-indigo-300 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors duration-200"
            >
              Se connecter avec un autre compte Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si pas de client Supabase
  if (!supabase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Erreur de configuration</h2>
          <p className="text-red-600">
            Impossible de se connecter à Supabase.
          </p>
        </div>
      </div>
    );
  }

  // Formulaire de connexion par défaut
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GS Sync Connect</h1>
          <p className="text-gray-600">Connectez-vous pour accéder à votre dashboard</p>
        </div>
        
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
        >
          <svg className="w-5 h-5 mr-3" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
            <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.3 512 0 398.8 0 256S110.3 0 244 0c73 0 135.3 29.1 181.5 75.5l-65.2 63.3C337.3 114.6 295.6 96 244 96 156.4 96 86.1 164.3 86.1 256s70.3 160 157.9 160c58.2 0 102.3-24.8 131.7-52.8 22.5-21.1 33.8-50 36.8-82.7H244v-71.3h239.1c1.3 6.9 2.1 14.1 2.1 21.8z"></path>
          </svg>
          Se connecter avec Google
        </button>
      </div>
    </div>
  )
} 