import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Button } from '@/components/common/Button';
import { checkinWebApi, eventsApi, CheckinStats } from '@/services/api';
import type { Event } from '@/types';

export default function CheckinDashboardPage() {
  const router = useRouter();
  const { id } = router.query;
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<CheckinStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    let active = true;
    setLoading(true);
    Promise.all([eventsApi.getById(id), checkinWebApi.getStats(id)])
      .then(([eventData, statsData]) => {
        if (!active) return;
        setEvent(eventData);
        setStats(statsData);
      })
      .catch((error: any) => {
        toast.error(error.response?.data?.error || 'Não foi possível carregar o painel');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  return (
    <>
      <Head><title>Painel de entradas - Lumera</title></Head>
      <main className="p-4 sm:p-6">
        <Link href={`/admin/events/${id}/checkin`} className="text-primary-400 hover:underline">
          ← Voltar ao scanner
        </Link>
        <header className="my-6">
          <p className="text-sm font-medium uppercase tracking-wider text-vip-300">Dashboard do evento</p>
          <h1 className="mt-2 text-3xl font-bold text-lumera-luminoso">Entradas e presença</h1>
          {event && <p className="mt-1 text-lumera-muted">{event.name}</p>}
        </header>

        {loading ? (
          <div className="card p-10 text-center text-lumera-muted">Carregando dados do evento...</div>
        ) : stats ? (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo de check-in">
              <div className="card p-5"><p className="text-sm text-lumera-muted">Total de ingressos</p><p className="mt-2 text-3xl font-bold text-lumera-luminoso">{stats.total}</p></div>
              <div className="card p-5"><p className="text-sm text-lumera-muted">Entradas realizadas</p><p className="mt-2 text-3xl font-bold text-green-400">{stats.checkedIn}</p></div>
              <div className="card p-5"><p className="text-sm text-lumera-muted">Aguardando entrada</p><p className="mt-2 text-3xl font-bold text-yellow-400">{stats.pending}</p></div>
              <div className="card p-5"><p className="text-sm text-lumera-muted">Presença</p><p className="mt-2 text-3xl font-bold text-primary-400">{stats.percentageCheckedIn.toFixed(1)}%</p>
                <div className="mt-3 h-2 w-full rounded-full bg-lumera-border"><div className="h-2 rounded-full bg-primary-500" style={{ width: `${Math.min(100, stats.percentageCheckedIn)}%` }} /></div>
              </div>
            </section>
            <Link href={`/admin/events/${id}/checkin`} className="mt-6 inline-flex">
              <Button>Abrir scanner de ingressos</Button>
            </Link>
          </>
        ) : (
          <div className="card p-8 text-center text-lumera-muted">Não há dados de check-in disponíveis.</div>
        )}
      </main>
    </>
  );
}
