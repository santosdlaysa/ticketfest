import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { adminApi, eventsApi } from '@/services/api';
import type { SalesReport, Event } from '@/types';
import { Button } from '@/components/common/Button';
import { StatCard } from '@/components/admin/StatCard';
import { SalesChart } from '@/components/admin/SalesChart';

export default function AdminReportsPage() {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [eventId, setEventId] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    loadReport();
  }, [startDate, endDate, groupBy, eventId]);

  const loadEvents = async () => {
    try {
      const data = await eventsApi.getAll({ limit: 100 });
      setEvents(data.events);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getSalesReport({
        startDate,
        endDate,
        groupBy,
        eventId: eventId || undefined,
      });
      setReport(data);
    } catch (error: any) {
      toast.error('Erro ao carregar relatorio');
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'orders' | 'sales') => {
    try {
      const blob = await adminApi.exportReport({
        type,
        startDate,
        endDate,
        eventId: eventId || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${startDate}_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Exportado com sucesso');
    } catch (error) {
      toast.error('Erro ao exportar');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const paymentMethodLabels: Record<string, string> = {
    CREDIT_CARD: 'Cartao de Credito',
    DEBIT_CARD: 'Cartao de Debito',
    PIX: 'PIX',
    BOLETO: 'Boleto',
  };

  return (
    <>
      <Head><title>Relatorios de Vendas - Lumera</title></Head>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-lumera-luminoso">Relatorios de Vendas</h1>
            <p className="text-lumera-muted mt-1">Analise detalhada das suas vendas</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Button variant="outline" onClick={() => handleExport('orders')}>
              Exportar Pedidos
            </Button>
            <Button variant="outline" onClick={() => handleExport('sales')}>
              Exportar Vendas
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-lumera-muted mb-1">Data Inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-lumera-muted mb-1">Data Final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-lumera-muted mb-1">Agrupar por</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
                className="input w-full"
              >
                <option value="day">Dia</option>
                <option value="week">Semana</option>
                <option value="month">Mes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-lumera-muted mb-1">Evento</label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="input w-full"
              >
                <option value="">Todos os eventos</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-lumera-muted">Carregando relatorio...</p>
          </div>
        ) : report ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Receita Total"
                value={formatCurrency(report.summary.totalRevenue)}
                color="success"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                title="Ingressos Vendidos"
                value={report.summary.totalTickets}
                color="primary"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                }
              />
              <StatCard
                title="Total de Pedidos"
                value={report.summary.totalOrders}
                color="info"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              />
              <StatCard
                title="Ticket Medio"
                value={formatCurrency(report.summary.averageOrderValue)}
                color="warning"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Sales by Period */}
              {report.salesByPeriod.length > 0 && (
                <div className="lg:col-span-2">
                  <SalesChart
                    data={report.salesByPeriod.map((item) => ({
                      date: item.date,
                      amount: item.revenue,
                      tickets: item.tickets,
                    }))}
                    type="area"
                    dataKey="amount"
                    title="Vendas por Periodo"
                  />
                </div>
              )}
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales by Event */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-lumera-luminoso mb-4">Vendas por Evento</h3>
                {report.salesByEvent.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-lumera-muted uppercase">
                          <th className="pb-3">Evento</th>
                          <th className="pb-3 text-right">Ingressos</th>
                          <th className="pb-3 text-right">Pedidos</th>
                          <th className="pb-3 text-right">Receita</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-lumera-border">
                        {report.salesByEvent.map((item) => (
                          <tr key={item.eventId}>
                            <td className="py-3 text-sm text-lumera-luminoso">{item.name}</td>
                            <td className="py-3 text-sm text-lumera-muted text-right">{item.tickets}</td>
                            <td className="py-3 text-sm text-lumera-muted text-right">{item.orders}</td>
                            <td className="py-3 text-sm font-medium text-lumera-luminoso text-right">{formatCurrency(item.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-lumera-muted text-center py-4">Nenhuma venda no periodo</p>
                )}
              </div>

              {/* Sales by Payment Method */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-lumera-luminoso mb-4">Vendas por Metodo de Pagamento</h3>
                {report.salesByPaymentMethod.length > 0 ? (
                  <div className="space-y-4">
                    {report.salesByPaymentMethod.map((item) => {
                      const percentage = (item.revenue / report.summary.totalRevenue) * 100;
                      return (
                        <div key={item.method}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-lumera-muted">{paymentMethodLabels[item.method] || item.method}</span>
                            <span className="text-sm font-medium text-lumera-luminoso">{formatCurrency(item.revenue)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-lumera-border rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-lumera-muted w-12 text-right">{percentage.toFixed(1)}%</span>
                          </div>
                          <p className="text-xs text-lumera-muted mt-1">{item.count} pedidos</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-lumera-muted text-center py-4">Nenhuma venda no periodo</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-lumera-muted">
            Nenhum dado disponivel para o periodo selecionado
          </div>
        )}
      </div>
    </>
  );
}
