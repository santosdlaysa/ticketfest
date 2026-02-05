import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { adminApi } from '@/services/api';
import type { SplitTransaction } from '@/types';
import { Button } from '@/components/common/Button';

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
  COMPLETED: 'Concluido',
  FAILED: 'Falhou',
  REFUNDED: 'Estornado',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-300',
  PROCESSING: 'bg-blue-500/20 text-blue-300',
  COMPLETED: 'bg-green-500/20 text-green-300',
  FAILED: 'bg-red-500/20 text-red-300',
  REFUNDED: 'bg-purple-100 text-purple-800',
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<SplitTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadTransactions();
  }, [page, status, startDate, endDate]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getTransactions({
        page,
        limit: 20,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setTransactions(data.transactions);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error: any) {
      toast.error('Erro ao carregar transacoes');
      console.error('Failed to load transactions:', error);
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
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate totals
  const totals = transactions.reduce(
    (acc, t) => {
      if (t.status === 'COMPLETED') {
        acc.total += t.totalAmount;
        acc.platform += t.platformAmount + t.platformFee;
        acc.organizer += t.organizerAmount;
      }
      return acc;
    },
    { total: 0, platform: 0, organizer: 0 }
  );

  return (
    <>
      <Head><title>Historico de Transacoes - Lumera</title></Head>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-lumera-luminoso">Historico de Transacoes</h1>
            <p className="text-lumera-muted mt-1">
              {total} transacoes encontradas
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="card p-6">
              <p className="text-sm text-lumera-muted">Total Transacionado</p>
              <p className="text-2xl font-bold text-lumera-luminoso">{formatCurrency(totals.total)}</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-lumera-muted">Receita Plataforma</p>
              <p className="text-2xl font-bold text-primary-400">{formatCurrency(totals.platform)}</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-lumera-muted">Receita Organizadores</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(totals.organizer)}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-lumera-muted mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="input w-full"
              >
                <option value="">Todos</option>
                <option value="PENDING">Pendente</option>
                <option value="PROCESSING">Processando</option>
                <option value="COMPLETED">Concluido</option>
                <option value="FAILED">Falhou</option>
                <option value="REFUNDED">Estornado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-lumera-muted mb-1">Data Inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-lumera-muted mb-1">Data Final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="input w-full"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStatus('');
                  setStartDate('');
                  setEndDate('');
                  setPage(1);
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
              <p className="mt-4 text-lumera-muted">Carregando transacoes...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-lumera-muted">
              Nenhuma transacao encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-lumera-obsidian">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-lumera-muted uppercase tracking-wider">
                      ID / Pedido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-lumera-muted uppercase tracking-wider">
                      Evento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-lumera-muted uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-lumera-muted uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-lumera-muted uppercase tracking-wider">
                      Plataforma
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-lumera-muted uppercase tracking-wider">
                      Organizador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-lumera-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-lumera-muted uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-lumera-surface divide-y divide-lumera-border">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-primary-500/10">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-lumera-luminoso">{transaction.id.slice(0, 8)}...</div>
                        <div className="text-xs text-lumera-muted">Pedido: {transaction.orderId.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-lumera-luminoso">{transaction.order.event.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-lumera-luminoso">{transaction.order.user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-lumera-luminoso">{formatCurrency(transaction.totalAmount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-primary-400">{formatCurrency(transaction.platformAmount)}</div>
                        {transaction.platformFee > 0 && (
                          <div className="text-xs text-lumera-muted">+{formatCurrency(transaction.platformFee)} taxa</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-green-400">{formatCurrency(transaction.organizerAmount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[transaction.status]}`}>
                          {statusLabels[transaction.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-lumera-muted">
                        <div>{formatDate(transaction.createdAt)}</div>
                        {transaction.processedAt && (
                          <div className="text-xs">Processado: {formatDate(transaction.processedAt)}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-lumera-muted">
                Pagina {page} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Proxima
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
