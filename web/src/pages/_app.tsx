import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout/Layout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/contexts/AuthContext';
import { useCartStore } from '@/contexts/CartContext';
import { useEffect } from 'react';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { checkAuth } = useAuthStore();
  const { fetchCart } = useCartStore();

  useEffect(() => {
    checkAuth();
    fetchCart();
  }, []);

  const isAdminPage = router.pathname.startsWith('/admin');

  if (isAdminPage) {
    return (
      <>
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
          }}
        />
      </>
    );
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
