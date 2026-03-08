'use client';

import { authClient } from '@/lib/auth-client';
import Link from 'next/link';

export function Header() {
  const { data: session, isPending: loading } = authClient.useSession();

  const handleSignOut = async () => {
    try {
      await authClient.signOut({});
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-5">
          <Link href="/" className="text-2xl font-bold hover:text-blue-100 transition-colors">
            TTS Dialektannotations-Plattform
          </Link>

          <nav className="flex items-center gap-6">
            {loading ? (
              <span className="text-sm text-blue-100">Laden...</span>
            ) : session ? (
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-blue-100 uppercase tracking-wide">Willkommen zurück</p>
                  <p className="text-sm font-semibold">{session.user?.email}</p>
                </div>
                {(session.user as any)?.admin && (
                  <Link
                    href="/admin"
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  Abmelden
                </button>
              </div>
            ) : (
              <Link
                href="/user/sign-in"
                className="px-5 py-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                Anmelden
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
