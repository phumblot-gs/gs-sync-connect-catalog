import { supabase, isBuildMode } from './supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export interface ApiToken {
  id: string
  name: string
  token_hash: string
  expires_at?: string
  created_at: string
}

export class ApiTokenService {
  async generateToken(userId: string, name: string, expiresInDays?: number): Promise<string> {
    // Si nous sommes en mode build, retourner un token factice
    if (isBuildMode()) {
      return 'dummy-token-for-build'
    }

    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    const token = this.generateRandomToken()
    const tokenHash = await bcrypt.hash(token, 12)
    
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null

    const { data, error } = await supabase
      .from('user_api_tokens')
      .insert({
        user_id: userId,
        name,
        token_hash: tokenHash,
        expires_at: expiresAt
      })
      .select()
      .single()

    if (error) throw new Error('Failed to create API token')

    return token
  }

  async validateToken(token: string): Promise<string | null> {
    // Si nous sommes en mode build, retourner null
    if (isBuildMode()) {
      return null
    }

    if (!supabase) {
      return null
    }

    const { data: tokens } = await supabase
      .from('user_api_tokens')
      .select('*')

    for (const tokenRecord of tokens || []) {
      if (tokenRecord.expires_at && new Date(tokenRecord.expires_at) < new Date()) {
        continue // Token expiré
      }

      const isValid = await bcrypt.compare(token, tokenRecord.token_hash)
      if (isValid) {
        return tokenRecord.user_id
      }
    }

    return null
  }

  async revokeToken(tokenId: string, userId: string): Promise<void> {
    // Si nous sommes en mode build, ne rien faire
    if (isBuildMode()) {
      return
    }

    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    const { error } = await supabase
      .from('user_api_tokens')
      .delete()
      .eq('id', tokenId)
      .eq('user_id', userId)

    if (error) throw new Error('Failed to revoke API token')
  }

  async getUserTokens(userId: string): Promise<ApiToken[]> {
    // Si nous sommes en mode build, retourner un tableau vide
    if (isBuildMode()) {
      return []
    }

    if (!supabase) {
      return []
    }

    const { data, error } = await supabase
      .from('user_api_tokens')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error('Failed to fetch API tokens')

    return data || []
  }

  private generateRandomToken(): string {
    return jwt.sign(
      { 
        type: 'api_token',
        timestamp: Date.now()
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1y' }
    )
  }
} 