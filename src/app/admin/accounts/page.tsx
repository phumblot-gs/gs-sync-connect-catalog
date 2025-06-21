'use client';

import { useEffect, useState, useCallback } from 'react';
import ProtectedLayout from '@/components/Layout/ProtectedLayout';
import CreateAccountForm from '@/components/Admin/CreateAccountForm';

// TODO: Define a proper type for the account data
type Account = {
  id: string;
  name: string;
  base_url: string;
  bearer_token: string;
  status: string;
  created_at: string;
};

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/accounts');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch accounts');
      }
      const data = await response.json();
      setAccounts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return (
    <ProtectedLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Account Management</h1>

        <CreateAccountForm onAccountCreated={fetchAccounts} />
        
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Existing Accounts</h2>
          {isLoading && <p>Loading accounts...</p>}
          {error && <p className="text-red-500">{error}</p>}
          
          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base URL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accounts.map((account) => (
                    <tr key={account.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{account.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{account.base_url}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {account.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {/* TODO: Add Edit/Delete/Test buttons here */}
                        <a href="#" className="text-indigo-600 hover:text-indigo-900">Edit</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
} 