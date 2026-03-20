'use client';

import { authClient } from '@/lib/auth-client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function Header() {
  const router = useRouter();
  const { data: session, isPending: loading } = authClient.useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await authClient.signOut({});
      router.push('/');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-5">
          {/* Logo */}
          <Link href="/" className="font-bold hover:text-blue-100 transition-colors text-lg sm:text-2xl">
            <span className="hidden sm:inline">TTS Dialektannotations-Plattform</span>
            <span className="sm:hidden">Dialektannotation</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
            title={mobileMenuOpen ? 'Menü schließen' : 'Menü öffnen'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Fullscreen Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-blue-700 z-40 flex flex-col p-4 space-y-4">
          {loading ? (
            <span className="text-sm text-blue-100">Laden...</span>
          ) : session ? (
            <>
              <div className="text-center py-4 border-b border-blue-600">
                <p className="text-xs text-blue-100 uppercase tracking-wide">Willkommen zurück</p>
                <p className="text-sm font-semibold">{session.user?.email}</p>
              </div>
              {(session.user as any)?.admin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors text-center"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
              >
                Abmelden
              </button>
            </>
          ) : (
            <Link
              href="/user/sign-in"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors text-center"
            >
              Anmelden
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
