import React, { useEffect, useState, useCallback, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { eventsApi, checkinWebApi, CheckinStats, TicketForCheckin, CheckinHistoryItem } from '@/services/api';
import type { Event } from '@/types';

export default function CheckinDashboard() {
  const router = useRouter();
  const { id } = router.query;
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<CheckinStats | null>(null);
  const [tickets, setTickets] = useState<TicketForCheckin[]>([]);
  const [history, setHistory] = useState<CheckinHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchStatus, setSearchStatus] = useState<'all' | 'checked_in' | 'pending'>('all');
  const [searching, setSearching] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [qrScanMode, setQrScanMode] = useState(false);
  const [qrInput, setQrInput] = useState('');

  // Load initial data
  useEffect(() => {
    if (id && typeof id === 'string') {
      loadData(id);
    }
  }, [id]);

  const loadData = async (eventId: string) => {
    try {
      setLoading(true);
      const [eventData, statsData, ticketsData, historyData] = await Promise.all([
        eventsApi.getById(eventId),
        checkinWebApi.getStats(eventId),
        checkinWebApi.searchTickets(eventId, { limit: 50 }),
        checkinWebApi.getHistory(eventId, 10),
      ]);
      setEvent(eventData);
      setStats(statsData);
      setTickets(ticketsData.tickets);
      setHistory(historyData.history);
    } catch (error: any) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    if (!id || typeof id !== 'string') return;
    try {
      const statsData = await checkinWebApi.getStats(id);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao atualizar stats:', error);
    }
  };

  const refreshHistory = async () => {
    if (!id || typeof id !== 'string') return;
    try {
      const historyData = await checkinWebApi.getHistory(id, 10);
      setHistory(historyData.history);
    } catch (error) {
      console.error('Erro ao atualizar histórico:', error);
    }
  };

  // Search with debounce
  const handleSearch = useCallback(async () => {
    if (!id || typeof id !== 'string') return;

    try {
      setSearching(true);
      const result = await checkinWebApi.searchTickets(id, {
        query: searchQuery,
        status: searchStatus,
        limit: 50,
      });
      setTickets(result.tickets);
    } catch (error: any) {
      toast.error('Erro ao buscar ingressos');
    } finally {
      setSearching(false);
    }
  }, [id, searchQuery, searchStatus]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchStatus, handleSearch]);

  // Check-in actions
  const handleCheckin = async (ticketInstanceId: string) => {
    try {
      setProcessingId(ticketInstanceId);
      await checkinWebApi.manualCheckin(ticketInstanceId);
      toast.success('Check-in realizado com sucesso!');

      // Update local state
      setTickets(prev => prev.map(t =>
        t.id === ticketInstanceId
          ? { ...t, checkedIn: true, checkedInAt: new Date().toISOString() }
          : t
      ));

      refreshStats();
      refreshHistory();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao realizar check-in');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUndoCheckin = async (ticketInstanceId: string) => {
    if (!confirm('Tem certeza que deseja desfazer o check-in?')) return;

    try {
      setProcessingId(ticketInstanceId);
      await checkinWebApi.undoCheckin(ticketInstanceId);
      toast.success('Check-in desfeito');

      // Update local state
      setTickets(prev => prev.map(t =>
        t.id === ticketInstanceId
          ? { ...t, checkedIn: false, checkedInAt: undefined }
          : t
      ));

      refreshStats();
      refreshHistory();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao desfazer check-in');
    } finally {
      setProcessingId(null);
    }
  };

  // QR Code validation
  const handleQrScan = async (code: string) => {
    if (!code.trim()) return;

    try {
      setProcessingId('qr');
      const result = await checkinWebApi.validateTicket(code, true);

      if (result.valid && result.ticket) {
        toast.success(`Check-in realizado: ${result.ticket.attendeeName}`);
        refreshStats();
        refreshHistory();
        handleSearch();
      } else if (result.alreadyCheckedIn) {
        toast.error(`Ingresso já validado: ${result.ticket?.attendeeName || ''}`);
      } else {
        toast.error(result.message || 'QR Code inválido');
      }

      setQrInput('');
      searchInputRef.current?.focus();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao validar QR Code');
    } finally {
      setProcessingId(null);
    }
  };

  const handleQrInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleQrScan(qrInput);
    }
  };

  if (loading || !event) {
    return (
      <>
        <Head><title>Check-in - Lumera</title></Head>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Check-in - {event.name} - Lumera</title>
      </Head>

      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/events"
            className="text-primary-400 hover:underline flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para Eventos
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-lumera-luminoso">Check-in</h1>
              <p className="text-lumera-muted mt-1">{event.name}</p>
            </div>
            <Button
              variant={qrScanMode ? 'primary' : 'outline'}
              onClick={() => setQrScanMode(!qrScanMode)}
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              {qrScanMode ? 'Modo Scanner Ativo' : 'Ativar Scanner'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card p-4">
              <div className="text-2xl font-bold text-lumera-luminoso">{stats.total}</div>
              <div className="text-sm text-lumera-muted">Total de Ingressos</div>
            </div>
            <div className="card p-4">
              <div className="text-2xl font-bold text-green-400">{stats.checkedIn}</div>
              <div className="text-sm text-lumera-muted">Check-ins Realizados</div>
            </div>
            <div className="card p-4">
              <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
              <div className="text-sm text-lumera-muted">Aguardando</div>
            </div>
            <div className="card p-4">
              <div className="text-2xl font-bold text-primary-400">
                {stats.percentageCheckedIn.toFixed(1)}%
              </div>
              <div className="text-sm text-lumera-muted">Taxa de Check-in</div>
              <div className="w-full bg-lumera-border rounded-full h-2 mt-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${stats.percentageCheckedIn}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* QR Scanner Input */}
        {qrScanMode && (
          <div className="card p-6 mb-6 bg-primary-500/10 border-primary-500/30">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-500/20 rounded-lg">
                <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-primary-300 mb-1">
                  Scanner de QR Code
                </label>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  onKeyDown={handleQrInputKeyDown}
                  className="w-full px-4 py-3 border-2 border-primary-500/30 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                  placeholder="Escaneie ou digite o QR Code e pressione Enter"
                  autoFocus
                />
              </div>
              <Button
                onClick={() => handleQrScan(qrInput)}
                isLoading={processingId === 'qr'}
                disabled={!qrInput.trim()}
              >
                Validar
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-2">
            <div className="card">
              {/* Search Bar */}
              <div className="p-4 border-b border-lumera-border">
                <div className="flex gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      placeholder="Buscar por nome, email ou QR Code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <select
                    className="input"
                    value={searchStatus}
                    onChange={(e) => setSearchStatus(e.target.value as 'all' | 'checked_in' | 'pending')}
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Aguardando</option>
                    <option value="checked_in">Check-in Feito</option>
                  </select>
                </div>
              </div>

              {/* Tickets Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-lumera-obsidian border-b border-lumera-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-lumera-muted uppercase">
                        Participante
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-lumera-muted uppercase">
                        Ingresso
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-lumera-muted uppercase">
                        Status
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-lumera-muted uppercase">
                        Ação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lumera-border">
                    {searching ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-lumera-muted">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                        </td>
                      </tr>
                    ) : tickets.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-lumera-muted">
                          Nenhum ingresso encontrado
                        </td>
                      </tr>
                    ) : (
                      tickets.map((ticket) => (
                        <tr key={ticket.id} className={`hover:bg-primary-500/10 ${ticket.checkedIn ? 'bg-green-500/10' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-lumera-luminoso">{ticket.attendeeName}</div>
                            <div className="text-sm text-lumera-muted">{ticket.attendeeEmail}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-lumera-luminoso">{ticket.ticketName}</div>
                            <div className="text-xs text-lumera-muted font-mono">{ticket.qrCode.substring(0, 8)}...</div>
                          </td>
                          <td className="px-4 py-3">
                            {ticket.checkedIn ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Check-in OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                Aguardando
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {ticket.checkedIn ? (
                              <button
                                onClick={() => handleUndoCheckin(ticket.id)}
                                disabled={processingId === ticket.id}
                                className="text-sm text-red-400 hover:text-red-300 font-medium disabled:opacity-50"
                              >
                                {processingId === ticket.id ? 'Processando...' : 'Desfazer'}
                              </button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleCheckin(ticket.id)}
                                isLoading={processingId === ticket.id}
                              >
                                Check-in
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-lumera-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Últimos Check-ins
              </h3>
              {history.length === 0 ? (
                <p className="text-lumera-muted text-sm text-center py-4">
                  Nenhum check-in realizado ainda
                </p>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-2 rounded hover:bg-primary-500/10">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-lumera-luminoso truncate">
                          {item.attendeeName}
                        </p>
                        <p className="text-xs text-lumera-muted truncate">
                          {item.ticketName}
                        </p>
                        <p className="text-xs text-lumera-muted">
                          {new Date(item.checkedInAt).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
