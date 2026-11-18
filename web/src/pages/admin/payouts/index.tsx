import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { adminApi } from '@/services/api';
import type { Payout } from '@/types';
import { Button } from '@/components/common/Button';

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
  COMPLETED: 'Concluido',
  FAILED: 'Falhou',
  CANCELLED: 'Cancelado',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-300',
  PROCESSING: 'bg-blue-500/20 text-blue-300',
  COMPLETED: 'bg-green-500/20 text-green-300',
  FAILED: 'bg-red-500/20 text-red-300',
  CANCELLED: 'bg-lumera-surface-alt text-lumera-luminoso',
};

const methodLabels: Record<string, string> = {
  BANK_TRANSFER: 'Transferencia Bancaria',
  PIX: 'PIX',
};

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [status, setStatus] = useState('');

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadPayouts();
  }, [page, status]);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getPayouts({
        page,
        limit: 20,
        status: status || undefined,
      });
      setPayouts(data.payouts);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error: any) {
      toast.error('Erro ao carregar repasses');
      console.error('Failed to load payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (payoutId: string) => {
    if (!confirm('Tem certeza que deseja aprovar este repasse?')) return;

    try {
      await adminApi.approvePayout(payoutId);
      toast.success('Repasse aprovado com sucesso');
      loadPayouts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao aprovar repasse');
    }
  };

  const openRejectModal = (payoutId: string) => {
    setSelectedPayoutId(payoutId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedPayoutId || !rejectReason.trim()) {
      toast.error('Informe o motivo da rejeicao');
      return;
    }

    try {
      await adminApi.rejectPayout(selectedPayoutId, rejectReason);
      toast.success('Repasse rejeitado');
      setShowRejectModal(false);
      loadPayouts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao rejeitar repasse');
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

  return (
    <>
      <Head><title>Gestao de Repasses - Lumera</title></Head>
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-lumera-luminoso">Gestao de Repasses</h1>
            <p className="text-lumera-muted mt-1">
              {total} repasses encontrados
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payouts Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-5 sm:p-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
              <p className="mt-4 text-lumera-muted">Carregando repasses...</p>
            </div>
          ) : payouts.length === 0 ? (
            <div className="p-5 sm:p-8 text-center text-lumera-muted">
              Nenhum repasse encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-lumera-obsidian">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-lumera-muted uppercase tracking-wider">
                      Organizador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-lumera-muted uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-lumera-muted uppercase tracking-wider">
                      Metodo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-lumera-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-lumera-muted uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-lumera-muted uppercase tracking-wider">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-lumera-surface divide-y divide-lumera-border">
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-primary-500/10">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-lumera-luminoso">{payout.organizerAccount.user.name}</div>
                          <div className="text-sm text-lumera-muted">{payout.organizerAccount.user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-lumera-luminoso">{formatCurrency(payout.amount)}</div>
                          {payout.fee > 0 && (
                            <div className="text-xs text-lumera-muted">Taxa: {formatCurrency(payout.fee)}</div>
                          )}
                          <div className="text-xs text-green-400">Liquido: {formatCurrency(payout.netAmount)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-lumera-luminoso">{methodLabels[payout.payoutMethod]}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[payout.status]}`}>
                          {statusLabels[payout.status]}
                        </span>
                        {payout.failureReason && (
                          <p className="text-xs text-red-400 mt-1">{payout.failureReason}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-lumera-muted">
                          <div>Solicitado: {formatDate(payout.requestedAt)}</div>
                          {payout.processedAt && (
                            <div>Processado: {formatDate(payout.processedAt)}</div>
                          )}
                          {payout.completedAt && (
                            <div>Concluido: {formatDate(payout.completedAt)}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {payout.status === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={() => handleApprove(payout.id)}>
                              Aprovar
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-400" onClick={() => openRejectModal(payout.id)}>
                              Rejeitar
                            </Button>
                          </div>
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
            <div className="px-4 sm:px-6 py-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-lumera-surface rounded-lg p-4 sm:p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-lumera-luminoso mb-4">Rejeitar Repasse</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-lumera-muted mb-1">Motivo da rejeicao</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="input w-full"
                  placeholder="Informe o motivo da rejeicao..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                  Cancelar
                </Button>
                <Button className="bg-red-600 hover:bg-red-700" onClick={handleReject}>
                  Rejeitar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
