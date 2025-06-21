import Link from 'next/link';

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Accès Refusé</h1>
        <p className="text-gray-700 mb-6">
          Vous n'avez pas l'autorisation d'accéder à cette application. Votre tentative de connexion a été enregistrée.
        </p>
        <p className="text-gray-600 mb-8">
          Si vous pensez qu'il s'agit d'une erreur, veuillez contacter l'administrateur du système.
        </p>
        <Link 
          href="/login" 
          className="px-6 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Retour à la page de connexion
        </Link>
      </div>
    </div>
  );
} 