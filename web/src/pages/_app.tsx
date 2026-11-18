import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout/Layout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/contexts/AuthContext';
import { useCartStore } from '@/contexts/CartContext';
import { useEffect, useRef } from 'react';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { checkAuth, isAuthenticated, _hasHydrated } = useAuthStore();
  const { fetchCart } = useCartStore();
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
      console.error('Não foi possível registrar o service worker da Lumera:', error);
    });
  }, []);

  const isAuthPage = router.pathname.startsWith('/auth');

  const isAdminPage = router.pathname.startsWith('/admin');
  const isUserPage = router.pathname.startsWith('/user');

  useEffect(() => {
    // Espera a hidratação do estado do localStorage
    if (!_hasHydrated) return;

    // Only check auth once on initial load, and only if not already authenticated.
    // Skip for admin/user pages - they have their own auth guards (AdminLayout/UserLayout).
    // This prevents race conditions where a stale checkAuth response clears auth state.
    if (!hasCheckedAuth.current && !isAuthPage && !isAdminPage && !isUserPage && !isAuthenticated) {
      hasCheckedAuth.current = true;
      checkAuth();
    }
    fetchCart();
  }, [_hasHydrated, isAuthPage, isAuthenticated, isAdminPage, isUserPage]);

  // Admin pages use AdminLayout
  if (isAdminPage) {
    return (
      <ErrorBoundary>
        <AdminLayout>
          <Component {...pageProps} />
        </AdminLayout>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
            ariaProps: {
              role: 'status',
              'aria-live': 'polite',
            },
          }}
        />
      </ErrorBoundary>
    );
  }

  // User pages use their own UserLayout (includes Header)
  if (isUserPage) {
    return (
      <ErrorBoundary>
        <Component {...pageProps} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
            ariaProps: {
              role: 'status',
              'aria-live': 'polite',
            },
          }}
        />
      </ErrorBoundary>
    );
  }

  // Public pages use Layout (with Header and Footer)
  return (
    <ErrorBoundary>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ErrorBoundary>
  );
}
