import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { statsApi } from '@/services/api';
import type { OrganizerStats } from '@/types';
import { Button } from '@/components/common/Button';
import { StatCard } from '@/components/admin/StatCard';
import { SalesChart } from '@/components/admin/SalesChart';

// Mock stats for development without backend
const mockStats: OrganizerStats = {
  totalEvents: 5,
  publishedEvents: 3,
  draftEvents: 2,
  cancelledEvents: 0,
  completedEvents: 0,
  totalTicketsSold: 150,
  totalRevenue: 15000,
  todayCheckIns: 0,
  upcomingEvents: [
    { id: '1', name: 'Rock in Rio 2025', slug: 'rock-in-rio', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), location: 'Rio de Janeiro', status: 'PUBLISHED', totalTickets: 100, soldTickets: 75, revenue: 7500, ordersCount: 50 },
    { id: '2', name: 'Festival de Verão', slug: 'festival-verao', date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), location: 'São Paulo', status: 'PUBLISHED', totalTickets: 200, soldTickets: 50, revenue: 5000, ordersCount: 30 },
  ],
  draftEventsList: [
    { id: '3', name: 'Evento Teste', slug: 'evento-teste', date: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  salesByDay: [
    { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 1500, tickets: 15 },
    { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 2000, tickets: 20 },
    { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 1800, tickets: 18 },
    { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 3000, tickets: 30 },
    { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 2500, tickets: 25 },
    { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 2200, tickets: 22 },
    { date: new Date().toISOString().split('T')[0], amount: 2000, tickets: 20 },
  ],
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<OrganizerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await statsApi.getOrganizerStats();
      setStats(data);
    } catch (error: any) {
      // Use mock data if API fails
      console.warn('Using mock stats:', error);
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays < 7) return `Em ${diffDays} dias`;
    if (diffDays < 30) return `Em ${Math.ceil(diffDays / 7)} semanas`;
    return formatDate(dateStr);
  };

  if (loading) {
    return (
      <>
        <Head><title>Dashboard - Lumera</title></Head>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Carregando dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Dashboard - Lumera</title></Head>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Bem-vindo ao painel de controle!
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Link href="/admin/events/create">
              <Button>
                <svg
                  className="w-5 h-5 mr-2"
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
                Novo Evento
              </Button>
            </Link>
            <Link href="/admin/events">
              <Button variant="outline">Ver Eventos</Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total de Eventos"
            value={stats?.totalEvents || 0}
            subtitle={`${stats?.publishedEvents || 0} publicados`}
            color="primary"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            title="Ingressos Vendidos"
            value={stats?.totalTicketsSold || 0}
            color="success"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            }
          />
          <StatCard
            title="Receita Total"
            value={formatCurrency(stats?.totalRevenue || 0)}
            color="info"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Check-ins Hoje"
            value={stats?.todayCheckIns || 0}
            color="warning"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Charts and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Sales Chart */}
          <div className="lg:col-span-2">
            {stats?.salesByDay && stats.salesByDay.length > 0 ? (
              <SalesChart
                data={stats.salesByDay}
                type="area"
                dataKey="amount"
                title="Vendas dos Últimos 7 Dias"
              />
            ) : (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Vendas dos Últimos 7 Dias
                </h3>
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  Nenhuma venda registrada no período
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Resumo de Status
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600">Publicados</span>
                </div>
                <span className="font-semibold">{stats?.publishedEvents || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span className="text-gray-600">Rascunhos</span>
                </div>
                <span className="font-semibold">{stats?.draftEvents || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-600">Cancelados</span>
                </div>
                <span className="font-semibold">{stats?.cancelledEvents || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                  <span className="text-gray-600">Concluídos</span>
                </div>
                <span className="font-semibold">{stats?.completedEvents || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Events Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Próximos Eventos
              </h3>
              <Link href="/admin/events" className="text-primary-600 text-sm hover:underline">
                Ver todos
              </Link>
            </div>
            {stats?.upcomingEvents && stats.upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {stats.upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/admin/events/${event.id}/tickets`}
                        className="font-medium text-gray-900 hover:text-primary-600 truncate block"
                      >
                        {event.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <span>{getRelativeDate(event.date)}</span>
                        <span>•</span>
                        <span>{event.location}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {event.soldTickets}/{event.totalTickets}
                      </p>
                      <p className="text-xs text-gray-500">ingressos</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-2">Nenhum evento próximo</p>
                <Link href="/admin/events/create">
                  <Button className="mt-4" size="sm">
                    Criar Evento
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Draft Events */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Eventos em Rascunho
              </h3>
              <span className="badge badge-gray">{stats?.draftEvents || 0}</span>
            </div>
            {stats?.draftEventsList && stats.draftEventsList.length > 0 ? (
              <div className="space-y-4">
                {stats.draftEventsList.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="font-medium text-gray-900 hover:text-primary-600 truncate block"
                      >
                        {event.name}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        Atualizado em {formatDate(event.updatedAt)}
                      </p>
                    </div>
                    <Link href={`/admin/events/${event.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="mt-2">Nenhum rascunho pendente</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/admin/events/create"
              className="card p-4 text-center hover:shadow-lg transition-shadow"
            >
              <svg
                className="w-8 h-8 mx-auto text-primary-600"
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
              <p className="mt-2 text-sm font-medium">Criar Evento</p>
            </Link>
            <Link
              href="/admin/events"
              className="card p-4 text-center hover:shadow-lg transition-shadow"
            >
              <svg
                className="w-8 h-8 mx-auto text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              <p className="mt-2 text-sm font-medium">Gerenciar Eventos</p>
            </Link>
            <Link
              href="/admin/venues"
              className="card p-4 text-center hover:shadow-lg transition-shadow"
            >
              <svg
                className="w-8 h-8 mx-auto text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="mt-2 text-sm font-medium">Locais</p>
            </Link>
            <Link
              href="/admin/checkin"
              className="card p-4 text-center hover:shadow-lg transition-shadow"
            >
              <svg
                className="w-8 h-8 mx-auto text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              <p className="mt-2 text-sm font-medium">Check-in</p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
