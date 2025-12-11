import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { adminApi } from '@/services/api';
import type { FinancialSummary, RevenueReport } from '@/types';
import { Button } from '@/components/common/Button';
import { StatCard } from '@/components/admin/StatCard';

export default function AdminFinancialsPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, revenueData] = await Promise.all([
        adminApi.getFinancialSummary({ startDate, endDate }),
        adminApi.getRevenueReport({ startDate, endDate }),
      ]);
      setSummary(summaryData);
      setRevenue(revenueData);
    } catch (error: any) {
      toast.error('Erro ao carregar dados financeiros');
      console.error('Failed to load financial data:', error);
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

  return (
    <>
      <Head><title>Dashboard Financeiro - Lumera</title></Head>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Financeiro</h1>
            <p className="text-gray-600 mt-1">Visao geral das financas da plataforma</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Link href="/admin/transactions">
              <Button variant="outline">Ver Transacoes</Button>
            </Link>
            <Link href="/admin/payouts">
              <Button variant="outline">Ver Repasses</Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input w-full"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Carregando dados financeiros...</p>
          </div>
        ) : summary && revenue ? (
          <>
            {/* Revenue Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Receita Paga"
                value={formatCurrency(summary.revenue.paid)}
                color="success"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                title="Receita Pendente"
                value={formatCurrency(summary.revenue.pending)}
                color="warning"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                title="Reembolsos"
                value={formatCurrency(summary.revenue.refunded)}
                color="info"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                }
              />
              <StatCard
                title="Receita Liquida"
                value={formatCurrency(revenue.finalRevenue)}
                color="primary"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>

            {/* Orders Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Pedidos Pagos"
                value={summary.orders.paid}
                color="success"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                }
              />
              <StatCard
                title="Pedidos Pendentes"
                value={summary.orders.pending}
                color="warning"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              />
              <StatCard
                title="Pedidos Reembolsados"
                value={summary.orders.refunded}
                color="info"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              />
              <StatCard
                title="Pedidos Falharam"
                value={summary.orders.failed}
                color="warning"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>

            {/* Revenue Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhamento de Receita</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Receita Bruta</span>
                    <span className="font-medium text-gray-900">{formatCurrency(revenue.grossRevenue)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Descontos</span>
                    <span className="font-medium text-red-600">-{formatCurrency(revenue.discounts)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Receita Liquida</span>
                    <span className="font-medium text-gray-900">{formatCurrency(revenue.netRevenue)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Reembolsos</span>
                    <span className="font-medium text-red-600">-{formatCurrency(revenue.refunds)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg border border-primary-200">
                    <span className="font-semibold text-primary-900">Receita Final</span>
                    <span className="font-bold text-primary-600">{formatCurrency(revenue.finalRevenue)}</span>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Divisao de Receita (Split)</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Receita da Plataforma</span>
                    <span className="font-medium text-gray-900">{formatCurrency(summary.splits.platformRevenue)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Receita dos Organizadores</span>
                    <span className="font-medium text-gray-900">{formatCurrency(summary.splits.organizerRevenue)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <span className="text-yellow-800">Valor Pendente</span>
                    <span className="font-medium text-yellow-600">{formatCurrency(summary.splits.pendingAmount)}</span>
                  </div>
                </div>

                {summary.organizerBalance && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium text-gray-900 mb-3">Seu Saldo</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Disponivel para saque</span>
                        <span className="font-semibold text-green-600">{formatCurrency(summary.organizerBalance.availableBalance)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Saldo pendente</span>
                        <span className="font-medium text-yellow-600">{formatCurrency(summary.organizerBalance.pendingBalance)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/admin/orders" className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Gestao de Pedidos</h3>
                    <p className="text-sm text-gray-500">Ver todos os pedidos</p>
                  </div>
                </div>
              </Link>

              <Link href="/admin/transactions" className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Transacoes</h3>
                    <p className="text-sm text-gray-500">Historico de split</p>
                  </div>
                </div>
              </Link>

              <Link href="/admin/payouts" className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Repasses</h3>
                    <p className="text-sm text-gray-500">Saques dos organizadores</p>
                  </div>
                </div>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Nenhum dado disponivel para o periodo selecionado
          </div>
        )}
      </div>
    </>
  );
}
