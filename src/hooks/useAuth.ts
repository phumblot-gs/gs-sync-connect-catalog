'use client'

import { useEffect, useState } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase, isBuildMode } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Si nous sommes en mode build, ne pas essayer de se connecter
    if (isBuildMode()) {
      console.log('🔧 useAuth: Mode build détecté');
      setLoading(false)
      return
    }

    // Si supabase n'est pas disponible, ne pas essayer de se connecter
    if (!supabase) {
      console.log('🔧 useAuth: Supabase non disponible');
      setLoading(false)
      return
    }

    // Récupérer la session initiale
    const getSession = async () => {
      if (!supabase) return
      console.log('🔧 useAuth: Récupération de la session...');
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔧 useAuth: Session récupérée:', {
        hasSession: !!session,
        userEmail: session?.user?.email || 'N/A'
      });
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Écouter les changements d'authentification
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          console.log('🔧 useAuth: Auth state changed:', {
            event,
            hasSession: !!session,
            userEmail: session?.user?.email || 'N/A'
          });
          setUser(session?.user ?? null)
          setLoading(false)
        }
      )

      return () => subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
  }

  return { user, loading, signOut }
} 