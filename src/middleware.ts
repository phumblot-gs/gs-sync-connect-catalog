import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Utiliser getUser() est crucial ici. Il rafraîchit la session.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Debug: Afficher les informations de l'utilisateur
  console.log('🔧 Middleware Debug:', {
    pathname: request.nextUrl.pathname,
    hasUser: !!user,
    userEmail: user?.email || 'N/A',
    cookies: request.cookies.getAll().map(c => c.name),
  });

  // Liste des utilisateurs autorisés à accéder à l'application
  const allowedUsers = [
    'phf@grand-shooting.com',
    // Ajoutez d'autres emails autorisés ici
  ];

  // Si l'utilisateur est connecté mais n'est pas dans la liste autorisée
  // et qu'il n'est pas déjà sur la page d'accès refusé.
  if (user && !allowedUsers.includes(user.email!) && request.nextUrl.pathname !== '/access-denied') {
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }

  const protectedPaths = ['/dashboard', '/admin']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une page protégée,
  // on le redirige vers la page de connexion.
  if (!user && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si l'utilisateur est connecté et autorisé, mais essaie d'accéder à la page de connexion,
  // on le redirige vers le dashboard.
  if (user && allowedUsers.includes(user.email!) && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/access-denied', '/auth/callback'],
} 