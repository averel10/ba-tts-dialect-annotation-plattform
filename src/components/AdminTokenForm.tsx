'use client';

import { useState } from 'react';
import { setUserAsAdmin } from '@/app/actions/set-user-admin';
import { useRouter } from 'next/navigation';

interface AdminTokenFormProps {
  userEmail: string;
}

export function AdminTokenForm({ userEmail }: AdminTokenFormProps) {
  const [adminToken, setAdminToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await setUserAsAdmin(userEmail, adminToken);
      
      if (result.success) {
        setSuccess(true);
        setAdminToken('');
        // Refresh the page to verify admin status
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else {
        setError(result.error || 'Invalid admin token');
      }
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-8">
            <h2 className="text-white text-xl font-bold">Admin-Zugriff erforderlich</h2>
            <p className="text-amber-100 text-sm mt-2">
              Sie benötigen Admin-Rechte, um diese Seite zu besuchen
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-lg">
                <p className="text-sm font-medium">
                  ✓ Admin-Status erfolgreich aktiviert! Seite wird aktualisiert...
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* User Info */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Benutzer:</span> {userEmail}
              </p>
            </div>

            {/* Admin Token Input */}
            <div>
              <label htmlFor="adminToken" className="block text-sm font-medium text-gray-700 mb-2">
                Admin-Token
              </label>
              <input
                id="adminToken"
                type="password"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                placeholder="Admin-Token eingeben"
                required
                disabled={loading || success}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Geben Sie den Admin-Token ein, um Admin-Rechte zu aktivieren
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors mt-6 flex items-center justify-center gap-2"
            >
              {loading && (
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              )}
              {loading ? 'Wird überprüft...' : success ? 'Admin aktiviert ✓' : 'Admin aktivieren'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
