import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type Environment = 'development' | 'staging' | 'production'

export async function POST(request: NextRequest) {
  try {
    const { session } = await request.json()
    
    console.log('🔧 Sync API called:', {
      hasSession: !!session,
      userEmail: session?.user?.email || 'N/A'
    });
    
    if (!session) {
      return NextResponse.json({ error: 'No session provided' }, { status: 400 })
    }

    const cookieStore = cookies()
    
    // Utiliser la même logique de configuration que le middleware
    const getSupabaseConfig = () => {
      const env = (process.env.NODE_ENV || 'development') as Environment
      
      switch (env) {
        case 'development':
          return {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL_DEV || process.env.NEXT_PUBLIC_SUPABASE_URL,
            anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          }
        case 'staging':
          return {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL_STAGING,
            anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING,
          }
        case 'production':
          return {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL_PROD,
            anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD,
          }
        default:
          return {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL,
            anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          }
      }
    }

    const config = getSupabaseConfig()
    
    const supabase = createServerClient(
      config.url!,
      config.anonKey!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Établir la session côté serveur
    const { error } = await supabase.auth.setSession(session)
    
    if (error) {
      console.error('❌ Erreur sync session:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    console.log('✅ Session synchronisée côté serveur pour:', session.user.email)
    return NextResponse.json({ success: true })
    
  } catch (err) {
    console.error('❌ Erreur dans sync API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 