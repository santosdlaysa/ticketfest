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
  const { checkAuth, isAuthenticated } = useAuthStore();
  const { fetchCart } = useCartStore();
  const hasCheckedAuth = useRef(false);

  const isAuthPage = router.pathname.startsWith('/auth');

  useEffect(() => {
    // Only check auth once on initial load, and only if not already authenticated
    // This prevents overwriting the auth state after a successful login
    if (!hasCheckedAuth.current && !isAuthPage && !isAuthenticated) {
      hasCheckedAuth.current = true;
      checkAuth();
    }
    fetchCart();
  }, [isAuthPage, isAuthenticated]);

  const isAdminPage = router.pathname.startsWith('/admin');
  const isUserPage = router.pathname.startsWith('/user');

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
