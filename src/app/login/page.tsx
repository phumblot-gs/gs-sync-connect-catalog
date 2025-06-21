import AuthForm from '@/components/Auth/AuthForm'

export const dynamic = 'force-dynamic'

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