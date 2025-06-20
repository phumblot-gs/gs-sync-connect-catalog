# Phase 1 : Foundation - Architecture et Environnements

## 🏗️ Architecture Microservices

### Vue d'ensemble
- **Frontend** : Next.js (React + TypeScript) sur Vercel
- **API Gateway** : Next.js API Routes sur Vercel
- **Microservices** : Node.js containers Docker sur Vercel
- **Base de données** : PostgreSQL sur Supabase
- **Authentification** : Supabase Auth
- **Stockage** : Supabase Storage (buckets)
- **Cron/Planification** : Supabase Edge Functions
- **Monitoring** : Sentry
- **Secrets** : Supabase + Vercel Environment Variables

---

## 📋 Tâches Architecture et Environnements

### 1. Configuration du projet principal (Frontend + API Gateway)

#### 1.1 Initialisation du projet Next.js
```bash
# Créer le projet principal
npx create-next-app@latest gs-sync-frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd gs-sync-frontend

# Installer les dépendances Supabase
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/auth-ui-react @supabase/auth-ui-shared

# Installer les dépendances pour l'API
npm install axios jsonwebtoken bcryptjs

# Installer les dépendances pour le monitoring
npm install @sentry/nextjs

# Installer les dépendances pour les tests
npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

#### 1.2 Configuration TypeScript
```typescript
// tsconfig.json - Ajouter les configurations
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    },
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

#### 1.3 Configuration Supabase
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client pour les Edge Functions
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

#### 1.4 Configuration Sentry
```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})

export { Sentry }
```

### 2. Configuration des Microservices

#### 2.1 Structure des microservices
```bash
# Créer la structure des microservices
mkdir -p microservices
cd microservices

# Microservice de synchronisation
mkdir sync-service
cd sync-service
npm init -y
npm install express cors helmet morgan dotenv axios jsonwebtoken
npm install --save-dev @types/express @types/cors @types/node jest supertest
```

#### 2.2 Dockerfile pour les microservices
```dockerfile
# microservices/sync-service/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

#### 2.3 Configuration Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  sync-service:
    build: ./microservices/sync-service
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=development
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - GRAND_SHOOTING_API_URL=${GRAND_SHOOTING_API_URL}
    volumes:
      - ./microservices/sync-service:/app
      - /app/node_modules
```

### 3. Configuration Supabase

#### 3.1 Installation Supabase CLI
```bash
# Installer Supabase CLI
npm install -g supabase

# Initialiser le projet Supabase
supabase init

# Lier au projet Supabase existant
supabase link --project-ref YOUR_PROJECT_REF
```

#### 3.2 Configuration de la base de données
```sql
-- supabase/migrations/001_initial_schema.sql

-- Table des comptes Grand Shooting
CREATE TABLE grand_shooting_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id VARCHAR(255) UNIQUE NOT NULL,
  api_key TEXT NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('principal', 'secondary')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des synchronisations
CREATE TABLE synchronizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  principal_account_id UUID REFERENCES grand_shooting_accounts(id),
  secondary_account_id UUID REFERENCES grand_shooting_accounts(id),
  webhook_enabled BOOLEAN DEFAULT false,
  batch_enabled BOOLEAN DEFAULT false,
  batch_frequency VARCHAR(50), -- 'hourly', 'daily', 'weekly'
  batch_schedule VARCHAR(100), -- cron expression
  mapping_config JSONB,
  filter_config JSONB,
  status VARCHAR(20) DEFAULT 'inactive',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de la pile de traitement
CREATE TABLE processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_id UUID REFERENCES synchronizations(id),
  job_type VARCHAR(20) CHECK (job_type IN ('webhook', 'batch')) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 2,
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des logs de synchronisation
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_id UUID REFERENCES synchronizations(id),
  log_type VARCHAR(20) CHECK (log_type IN ('info', 'error', 'warning')) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des tokens API utilisateurs
CREATE TABLE user_api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_processing_queue_status ON processing_queue(status);
CREATE INDEX idx_processing_queue_sync_id ON processing_queue(sync_id);
CREATE INDEX idx_sync_logs_sync_id ON sync_logs(sync_id);
CREATE INDEX idx_sync_logs_created_at ON sync_logs(created_at);
```

#### 3.3 Edge Functions Supabase
```typescript
// supabase/functions/process-queue/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Logique de traitement de la pile
    const { data: pendingJobs } = await supabase
      .from('processing_queue')
      .select('*')
      .eq('status', 'pending')
      .limit(10)

    // Traitement des jobs...
    
    return new Response(
      JSON.stringify({ processed: pendingJobs.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### 4. Configuration des environnements

#### 4.1 Variables d'environnement
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
GRAND_SHOOTING_API_URL=https://api.grand-shooting.com
JWT_SECRET=your_jwt_secret

# .env.development
NODE_ENV=development
SUPABASE_URL=your_dev_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_role_key

# .env.production
NODE_ENV=production
SUPABASE_URL=your_prod_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key
```

#### 4.2 Configuration Vercel
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    },
    {
      "src": "microservices/sync-service/package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/sync/(.*)",
      "dest": "/microservices/sync-service/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "SUPABASE_URL": "@supabase_url",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key",
    "GRAND_SHOOTING_API_URL": "@grand_shooting_api_url",
    "JWT_SECRET": "@jwt_secret"
  }
}
```

### 5. Configuration des tests

#### 5.1 Configuration Jest
```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
```

#### 5.2 Setup Jest
```javascript
// jest.setup.js
import '@testing-library/jest-dom'
```

---

## 🔌 Intégration API Grand Shooting

### 1. Configuration du client API

#### 1.1 Client API Grand Shooting
```typescript
// src/lib/grand-shooting-api.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios'

export interface GrandShootingReference {
  reference_id: number
  ref: string
  ean: string
  eans: string[]
  eans_extended: Array<{
    ean: string
    smalltext: string
    star: boolean
    extra: Record<string, any>
  }>
  univers: string
  gamme: string
  family: string
  sku: string
  brand: string
  smalltext: string
  product_ref: string
  product_smalltext: string
  gender: string
  color: string
  hexa_color: string
  size: string
  collection: string
  comment: string
  tags: string[]
  online: string
  extra: Record<string, any>
}

export class GrandShootingAPI {
  private client: AxiosInstance

  constructor(apiKey: string, baseURL: string = 'https://api.grand-shooting.com') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    // Intercepteur pour le rate limiting
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 429) {
          // Rate limit atteint, attendre et réessayer
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(this.client.request(error.config))
            }, 1000) // Attendre 1 seconde
            })
        }
        return Promise.reject(error)
      }
    )
  }

  async getReferences(params?: {
    limit?: number
    offset?: number
    updated_since?: string
  }): Promise<GrandShootingReference[]> {
    const response: AxiosResponse<GrandShootingReference[]> = await this.client.get('/reference', { params })
    return response.data
  }

  async createReference(reference: Omit<GrandShootingReference, 'reference_id'>): Promise<GrandShootingReference> {
    const response: AxiosResponse<GrandShootingReference> = await this.client.post('/reference', reference)
    return response.data
  }

  async updateReference(referenceId: number, reference: Partial<GrandShootingReference>): Promise<GrandShootingReference> {
    const response: AxiosResponse<GrandShootingReference> = await this.client.put(`/reference/${referenceId}`, reference)
    return response.data
  }

  async deleteReference(referenceId: number): Promise<void> {
    await this.client.delete(`/reference/${referenceId}`)
  }

  async getReference(referenceId: number): Promise<GrandShootingReference> {
    const response: AxiosResponse<GrandShootingReference> = await this.client.get(`/reference/${referenceId}`)
    return response.data
  }
}
```

#### 1.2 Tests unitaires pour l'API
```typescript
// src/lib/__tests__/grand-shooting-api.test.ts
import { GrandShootingAPI, GrandShootingReference } from '../grand-shooting-api'
import axios from 'axios'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('GrandShootingAPI', () => {
  let api: GrandShootingAPI
  const mockApiKey = 'test-api-key'

  beforeEach(() => {
    api = new GrandShootingAPI(mockApiKey)
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.grand-shooting.com',
        headers: {
          'Authorization': `Bearer ${mockApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      })
    })
  })

  describe('getReferences', () => {
    it('should fetch references successfully', async () => {
      const mockReferences: GrandShootingReference[] = [
        {
          reference_id: 1,
          ref: 'TEST_REF',
          ean: '1234567890123',
          eans: ['1234567890123'],
          eans_extended: [],
          univers: 'RTW',
          gamme: 'Test',
          family: 'Test',
          sku: 'TEST_SKU',
          brand: 'Test Brand',
          smalltext: 'Test Description',
          product_ref: 'TEST_PRODUCT',
          product_smalltext: 'Test Product',
          gender: 'Woman',
          color: 'Red',
          hexa_color: '#FF0000',
          size: 'M',
          collection: 'FW24',
          comment: 'Test comment',
          tags: ['test'],
          online: '2024-01-01',
          extra: {}
        }
      ]

      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: mockReferences })
      } as any)

      const result = await api.getReferences()
      expect(result).toEqual(mockReferences)
    })

    it('should handle rate limiting', async () => {
      const mockClient = {
        get: jest.fn()
          .mockRejectedValueOnce({ response: { status: 429 } })
          .mockResolvedValueOnce({ data: [] })
      }
      mockedAxios.create.mockReturnValue(mockClient as any)

      jest.useFakeTimers()
      const promise = api.getReferences()
      
      jest.advanceTimersByTime(1000)
      const result = await promise
      
      expect(result).toEqual([])
      jest.useRealTimers()
    })
  })

  describe('createReference', () => {
    it('should create reference successfully', async () => {
      const mockReference: GrandShootingReference = {
        reference_id: 1,
        ref: 'NEW_REF',
        ean: '1234567890123',
        eans: ['1234567890123'],
        eans_extended: [],
        univers: 'RTW',
        gamme: 'Test',
        family: 'Test',
        sku: 'NEW_SKU',
        brand: 'Test Brand',
        smalltext: 'New Description',
        product_ref: 'NEW_PRODUCT',
        product_smalltext: 'New Product',
        gender: 'Woman',
        color: 'Blue',
        hexa_color: '#0000FF',
        size: 'L',
        collection: 'FW24',
        comment: 'New comment',
        tags: ['new'],
        online: '2024-01-01',
        extra: {}
      }

      const mockClient = {
        post: jest.fn().mockResolvedValue({ data: mockReference })
      }
      mockedAxios.create.mockReturnValue(mockClient as any)

      const newReference = { ...mockReference }
      delete newReference.reference_id

      const result = await api.createReference(newReference)
      expect(result).toEqual(mockReference)
      expect(mockClient.post).toHaveBeenCalledWith('/reference', newReference)
    })
  })
})
```

#### 1.3 Service de synchronisation
```typescript
// src/lib/sync-service.ts
import { GrandShootingAPI, GrandShootingReference } from './grand-shooting-api'
import { supabase } from './supabase'

export interface SyncJob {
  id: string
  sync_id: string
  job_type: 'webhook' | 'batch'
  payload: any
  status: 'pending' | 'processing' | 'completed' | 'failed'
  attempts: number
  max_attempts: number
  error_message?: string
}

export class SyncService {
  async processJob(job: SyncJob): Promise<void> {
    try {
      // Récupérer la configuration de synchronisation
      const { data: sync } = await supabase
        .from('synchronizations')
        .select('*, principal_account:grand_shooting_accounts!principal_account_id(*), secondary_account:grand_shooting_accounts!secondary_account_id(*)')
        .eq('id', job.sync_id)
        .single()

      if (!sync) {
        throw new Error('Synchronization not found')
      }

      // Créer les clients API
      const principalAPI = new GrandShootingAPI(sync.principal_account.api_key)
      const secondaryAPI = new GrandShootingAPI(sync.secondary_account.api_key)

      // Traiter selon le type de job
      if (job.job_type === 'webhook') {
        await this.processWebhookJob(job, sync, principalAPI, secondaryAPI)
      } else {
        await this.processBatchJob(job, sync, principalAPI, secondaryAPI)
      }

      // Marquer le job comme terminé
      await supabase
        .from('processing_queue')
        .update({ 
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', job.id)

    } catch (error) {
      // Marquer le job comme échoué
      await supabase
        .from('processing_queue')
        .update({ 
          status: 'failed',
          error_message: error.message,
          attempts: job.attempts + 1
        })
        .eq('id', job.id)

      // Logger l'erreur
      await supabase
        .from('sync_logs')
        .insert({
          sync_id: job.sync_id,
          log_type: 'error',
          message: error.message,
          metadata: { job_id: job.id, job_type: job.job_type }
        })

      throw error
    }
  }

  private async processWebhookJob(
    job: SyncJob,
    sync: any,
    principalAPI: GrandShootingAPI,
    secondaryAPI: GrandShootingAPI
  ): Promise<void> {
    const { reference_id, action } = job.payload

    switch (action) {
      case 'create':
      case 'update':
        const reference = await principalAPI.getReference(reference_id)
        const mappedReference = this.applyMapping(reference, sync.mapping_config)
        await secondaryAPI.updateReference(reference_id, mappedReference)
        break
      case 'delete':
        await secondaryAPI.deleteReference(reference_id)
        break
    }
  }

  private async processBatchJob(
    job: SyncJob,
    sync: any,
    principalAPI: GrandShootingAPI,
    secondaryAPI: GrandShootingAPI
  ): Promise<void> {
    const { updated_since } = job.payload
    const references = await principalAPI.getReferences({ updated_since })

    for (const reference of references) {
      const mappedReference = this.applyMapping(reference, sync.mapping_config)
      await secondaryAPI.updateReference(reference.reference_id, mappedReference)
    }
  }

  private applyMapping(reference: GrandShootingReference, mappingConfig: any): any {
    if (!mappingConfig) return reference

    const mapped: any = {}
    for (const [sourceField, targetField] of Object.entries(mappingConfig)) {
      const value = this.getNestedValue(reference, sourceField)
      this.setNestedValue(mapped, targetField, value)
    }

    return mapped
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {}
      return current[key]
    }, obj)
    target[lastKey] = value
  }
}
```

---

## 🔐 Authentification et Interface de Connexion

### 1. Configuration Supabase Auth

#### 1.1 Configuration Google OAuth dans Supabase
```bash
# Dans le dashboard Supabase :
# 1. Aller dans Authentication > Providers
# 2. Activer Google
# 3. Configurer les credentials Google OAuth
# 4. Ajouter les URLs de redirection :
#    - http://localhost:3000/auth/callback (dev)
#    - https://your-domain.vercel.app/auth/callback (prod)
```

#### 1.2 Composant d'authentification
```typescript
// src/components/Auth/AuthForm.tsx
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
        onLoadingChange={setLoading}
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
```

#### 1.3 Page de callback
```typescript
// src/app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(requestUrl.origin)
}
```

#### 1.4 Middleware d'authentification
```typescript
// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Rediriger vers /login si pas de session et page protégée
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Rediriger vers /dashboard si session et page de login
  if (session && req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/login']
}
```

#### 1.5 Hook d'authentification
```typescript
// src/hooks/useAuth.ts
'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Récupérer la session initiale
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { user, loading, signOut }
}
```

#### 1.6 Page de login
```typescript
// src/app/login/page.tsx
import AuthForm from '@/components/Auth/AuthForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            GS Sync Connect
          </h1>
          <p className="mt-2 text-gray-600">
            Connectez-vous pour accéder à votre dashboard
          </p>
        </div>
        
        <AuthForm />
      </div>
    </div>
  )
}
```

#### 1.7 Layout protégé
```typescript
// src/components/Layout/ProtectedLayout.tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
```

#### 1.8 Tests d'authentification
```typescript
// src/components/Auth/__tests__/AuthForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AuthForm from '../AuthForm'
import { supabase } from '@/lib/supabase'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
    }
  }
}))

describe('AuthForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders login form', () => {
    render(<AuthForm />)
    
    expect(screen.getByText('Connexion')).toBeInTheDocument()
    expect(screen.getByText('Se connecter avec Google')).toBeInTheDocument()
  })

  it('handles Google sign in', async () => {
    const mockSignIn = jest.fn().mockResolvedValue({ data: {}, error: null })
    ;(supabase.auth.signInWithOAuth as jest.Mock).mockImplementation(mockSignIn)

    render(<AuthForm />)
    
    const googleButton = screen.getByText('Se connecter avec Google')
    fireEvent.click(googleButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback')
        }
      })
    })
  })
})
```

### 2. Gestion des tokens API utilisateurs

#### 2.1 Service de génération de tokens
```typescript
// src/lib/api-token-service.ts
import { supabase } from './supabase'
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
    const { error } = await supabase
      .from('user_api_tokens')
      .delete()
      .eq('id', tokenId)
      .eq('user_id', userId)

    if (error) throw new Error('Failed to revoke API token')
  }

  async getUserTokens(userId: string): Promise<ApiToken[]> {
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
```

#### 2.2 Middleware pour l'API
```typescript
// src/middleware/api-auth.ts
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
```

---

## 🚀 Commandes de déploiement

### 1. Déploiement local
```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec les vraies valeurs

# Lancer les migrations Supabase
supabase db push

# Lancer en développement
npm run dev

# Lancer les microservices
docker-compose up -d
```

### 2. Déploiement Vercel
```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod

# Configurer les variables d'environnement dans Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
# etc...
```

### 3. Tests
```bash
# Tests unitaires
npm test

# Tests d'intégration
npm run test:integration

# Tests E2E
npm run test:e2e
```

---

## 📝 Checklist de validation

- [ ] Projet Next.js initialisé avec TypeScript
- [ ] Configuration Supabase (base de données, auth, storage)
- [ ] Microservices Docker configurés
- [ ] Variables d'environnement configurées
- [ ] Tests unitaires en place
- [ ] Authentification Google OAuth fonctionnelle
- [ ] API Grand Shooting intégrée et testée
- [ ] Système de tokens API utilisateurs
- [ ] Déploiement Vercel configuré
- [ ] Monitoring Sentry configuré
- [ ] Documentation mise à jour 