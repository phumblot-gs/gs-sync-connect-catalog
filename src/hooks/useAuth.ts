'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, isBuildMode } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Si nous sommes en mode build, ne pas essayer de se connecter
    if (isBuildMode()) {
      setLoading(false)
      return
    }

    // Si supabase n'est pas disponible, ne pas essayer de se connecter
    if (!supabase) {
      setLoading(false)
      return
    }

    // Récupérer la session initiale
    const getSession = async () => {
      if (!supabase) return
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Écouter les changements d'authentification
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
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