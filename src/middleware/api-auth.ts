import { NextRequest, NextResponse } from 'next/server'
import { ApiTokenService } from '@/lib/api-token-service'

export async function validateApiToken(request: NextRequest): Promise<NextResponse | null> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid authorization header' },
      { status: 401 }
    )
  }

  const token = authHeader.substring(7)
  const tokenService = new ApiTokenService()
  const userId = await tokenService.validateToken(token)

  if (!userId) {
    return NextResponse.json(
      { error: 'Invalid or expired API token' },
      { status: 401 }
    )
  }

  // Ajouter l'userId à la requête pour utilisation ultérieure
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', userId)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
} 