'use client'

import { useAuth } from '@/hooks/useAuth'
import ProtectedLayout from '@/components/Layout/ProtectedLayout'

export default function DashboardPage() {
  const { user, signOut } = useAuth()

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard GS Sync Connect
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">
                  Connecté en tant que {user?.email}
                </span>
                <button
                  onClick={signOut}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Se déconnecter
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Synchronisations actives
                </h3>
                <p className="text-blue-700">0</p>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Jobs en cours
                </h3>
                <p className="text-green-700">0</p>
              </div>
              
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  Erreurs récentes
                </h3>
                <p className="text-yellow-700">0</p>
              </div>
            </div>
            
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Actions rapides
              </h2>
              <div className="flex space-x-4">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Nouvelle synchronisation
                </button>
                <button className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors">
                  Voir les logs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
} 