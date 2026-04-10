'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

type AuthMode = 'signin' | 'signup';

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        const response = await authClient.signIn.email({
          email,
          password,
        });
        if (response.error) {
          setError(response.error.message || 'Authentifizierung fehlgeschlagen');
        } else {
          router.push('/');
        }
      } else {
        if (password !== confirmPassword) {
          setError('Die Passwörter stimmen nicht überein');
          setLoading(false);
          return;
        }
        const response = await authClient.signUp.email({
          email,
          name: email.split('@')[0],
          password,
        });
        if (response.error) {
          setError(response.error.message || 'Registrierung fehlgeschlagen');
        } else {
          router.push('/');
        }

      }
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="w-full">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setMode('signin');
                setError('');
              }}
              className={`flex-1 py-4 px-6 font-semibold text-center transition-colors ${
                mode === 'signin'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              Anmelden
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`flex-1 py-4 px-6 font-semibold text-center transition-colors ${
                mode === 'signup'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              Registrieren
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              {mode === 'signup' && (
                <p className="text-xs text-gray-500 mt-1">
                  Mindestens 8 Zeichen
                </p>
              )}
            </div>

            {/* Confirm Password Input (Sign Up Only) */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Passwort bestätigen
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors mt-6 flex items-center justify-center gap-2"
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
              {loading ? 'Wird geladen...' : mode === 'signin' ? 'Anmelden' : 'Konto erstellen'}
            </button>

            {/* Info Text */}
            <p className="text-center text-sm text-gray-600 mt-6">
              {mode === 'signin' ? (
                <>
                  Du hast noch kein Konto?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError('');
                    }}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Registrieren
                  </button>
                </>
              ) : (
                <>
                  Du hast bereits ein Konto?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError('');
                    }}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Anmelden
                  </button>
                </>
              )}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
