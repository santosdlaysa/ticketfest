import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, _hasHydrated } = useAuthStore();

  useEffect(() => {
    // Espera a hidratação do estado do localStorage
    if (!_hasHydrated || isLoading) return;

    if (!isAuthenticated) {
      // Usuário não logado vai para a lista de eventos
      router.replace('/events');
    } else if (user?.role === 'ADMIN' || user?.role === 'ORGANIZER') {
      // Admin e organizador vão para o painel admin
      router.replace('/admin');
    } else {
      // Usuário comum vai para a lista de eventos
      router.replace('/events');
    }
  }, [router, user, isAuthenticated, isLoading, _hasHydrated]);

  return (
    <main className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4" aria-hidden="true"></div>
        <span className="sr-only">Carregando...</span>
        <p className="text-gray-600">Carregando...</p>
      </div>
    </main>
  );
}
