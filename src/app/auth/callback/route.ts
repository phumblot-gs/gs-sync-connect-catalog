import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin

  console.log('🔧 Auth Callback called:', {
    url: requestUrl.toString(),
    hasCode: !!code,
    error,
    errorDescription,
    allParams: Object.fromEntries(requestUrl.searchParams.entries()),
    origin
  });

  // Si Google renvoie une erreur
  if (error) {
    console.error('❌ Google OAuth Error:', { error, errorDescription });
    return NextResponse.redirect(`${origin}/login?error=${error}&description=${errorDescription}`)
  }

  if (code) {
    console.log('🔧 Processing auth code...');
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      console.log('✅ Session établie avec succès via callback');
      return NextResponse.redirect(`${origin}/dashboard`)
    } else {
      console.error('❌ Erreur lors de l\'établissement de la session:', error);
      return NextResponse.redirect(`${origin}/login?error=auth_error`)
    }
  }

  console.log('🔧 No code provided, redirecting to login');
  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/login`)
} 