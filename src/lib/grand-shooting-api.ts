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
  private requestQueue: Array<() => Promise<any>> = []
  private processing = false
  private lastRequestTime = 0
  private readonly RATE_LIMIT_DELAY = 250 // 4 req/s = 250ms entre chaque requête

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
    this.client.interceptors.request.use(async (config) => {
      await this.waitForRateLimit()
      return config
    })

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

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      const waitTime = this.RATE_LIMIT_DELAY - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.lastRequestTime = Date.now()
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

  async getAccountInfo(): Promise<any> {
    const response = await this.client.get('/account')
    return response.data
  }
} 