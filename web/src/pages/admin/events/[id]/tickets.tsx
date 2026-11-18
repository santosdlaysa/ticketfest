import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { eventsApi, ticketsApi } from '@/services/api';
import type { Event, Ticket } from '@/types';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { BatchManager } from '@/components/admin/BatchManager';

interface TicketForm {
  name: string;
  description: string;
  price: number;
  quantity: number;
  salesStart: string;
  salesEnd: string;
  features: string;
}

export default function ManageTickets() {
  const router = useRouter();
  const { id } = router.query;
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [batchManagerTicket, setBatchManagerTicket] = useState<Ticket | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<TicketForm>();

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadEventAndTickets(id);
    }
  }, [id]);

  const loadEventAndTickets = async (eventId: string) => {
    try {
      setLoading(true);
      const [eventData, ticketsData] = await Promise.all([
        eventsApi.getById(eventId),
        ticketsApi.getByEvent(eventId),
      ]);
      setEvent(eventData);
      setTickets(ticketsData);
    } catch (error: any) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: TicketForm) => {
    if (!id || typeof id !== 'string') return;

    setSubmitting(true);
    try {
      const features = data.features
        ? data.features.split(',').map(f => f.trim()).filter(f => f)
        : [];

      const ticketData = {
        eventId: id,
        name: data.name,
        description: data.description,
        price: Number(data.price),
        quantity: Number(data.quantity),
        salesStart: new Date(data.salesStart).toISOString(),
        salesEnd: new Date(data.salesEnd).toISOString(),
        features,
      };

      if (editingTicket) {
        await ticketsApi.update(editingTicket.id, ticketData);
        toast.success('Ingresso atualizado com sucesso!');
      } else {
        await ticketsApi.create(ticketData);
        toast.success('Ingresso criado com sucesso!');
      }

      setShowForm(false);
      setEditingTicket(null);
      reset();
      loadEventAndTickets(id);
    } catch (error: any) {
      console.error('Erro ao salvar ingresso:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar ingresso');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setValue('name', ticket.name);
    setValue('description', ticket.description || '');
    setValue('price', ticket.price);
    setValue('quantity', ticket.quantity);
    setValue('salesStart', new Date(ticket.salesStart).toISOString().slice(0, 16));
    setValue('salesEnd', new Date(ticket.salesEnd).toISOString().slice(0, 16));
    setValue('features', ticket.features.join(', '));
    setShowForm(true);
  };

  const handleDelete = async (ticketId: string) => {
    if (!confirm('Tem certeza que deseja deletar este ingresso?')) {
      return;
    }

    try {
      setDeletingId(ticketId);
      await ticketsApi.delete(ticketId);
      toast.success('Ingresso deletado com sucesso');
      if (id && typeof id === 'string') {
        loadEventAndTickets(id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao deletar ingresso');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTicket(null);
    reset();
  };

  if (loading || !event) {
    return (
      <>
        <Head><title>Gerenciar Ingressos - Lumera</title></Head>
        <div className="p-4 sm:p-6">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-lumera-muted">Carregando...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Gerenciar Ingressos - {event.name} - Lumera</title></Head>
      <div className="p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin/events"
              className="text-primary-400 hover:text-primary-300 mb-4 inline-flex items-center"
            >
              ← Voltar para Meus Eventos
            </Link>
            <h1 className="text-3xl font-bold mt-2">{event.name}</h1>
            <p className="text-lumera-muted mt-2">
              Gerencie os ingressos disponíveis para este evento
            </p>
          </div>

          {/* Formulário de Adicionar/Editar */}
          {showForm ? (
            <div className="card p-4 sm:p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">
                {editingTicket ? 'Editar Ingresso' : 'Adicionar Novo Ingresso'}
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nome do Ingresso *"
                    {...register('name', { required: 'Nome é obrigatório' })}
                    error={errors.name?.message}
                    placeholder="Ex: Pista, Camarote, VIP"
                  />

                  <Input
                    label="Preço (R$) *"
                    type="number"
                    step="0.01"
                    {...register('price', {
                      required: 'Preço é obrigatório',
                      min: { value: 0, message: 'Preço deve ser positivo' }
                    })}
                    error={errors.price?.message}
                    placeholder="0.00"
                  />

                  <Input
                    label="Quantidade Disponível *"
                    type="number"
                    {...register('quantity', {
                      required: 'Quantidade é obrigatória',
                      min: { value: 1, message: 'Mínimo 1' }
                    })}
                    error={errors.quantity?.message}
                    placeholder="100"
                  />

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-lumera-muted mb-1">
                      Descrição
                    </label>
                    <textarea
                      {...register('description')}
                      rows={2}
                      className="w-full px-4 py-2 border border-lumera-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Descrição opcional do ingresso"
                    />
                  </div>

                  <Input
                    label="Início das Vendas *"
                    type="datetime-local"
                    {...register('salesStart', { required: 'Data de início é obrigatória' })}
                    error={errors.salesStart?.message}
                  />

                  <Input
                    label="Fim das Vendas *"
                    type="datetime-local"
                    {...register('salesEnd', { required: 'Data de fim é obrigatória' })}
                    error={errors.salesEnd?.message}
                  />

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-lumera-muted mb-1">
                      Benefícios/Características (separados por vírgula)
                    </label>
                    <textarea
                      {...register('features')}
                      rows={2}
                      className="w-full px-4 py-2 border border-lumera-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Ex: Acesso à pista, Open bar, Área VIP"
                    />
                    <p className="text-sm text-lumera-muted mt-1">
                      Digite os benefícios separados por vírgula
                    </p>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-lumera-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelForm}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    isLoading={submitting}
                    className="flex-1"
                  >
                    {editingTicket ? 'Atualizar' : 'Adicionar'} Ingresso
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="mb-8">
              <Button onClick={() => setShowForm(true)}>
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
                Adicionar Ingresso
              </Button>
            </div>
          )}

          {/* Lista de Ingressos */}
          {tickets.length === 0 ? (
            <div className="card p-12 text-center">
              <svg
                className="mx-auto h-16 w-16 text-lumera-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-lumera-luminoso">
                Nenhum ingresso cadastrado
              </h3>
              <p className="mt-2 text-lumera-muted">
                Adicione ingressos para que os usuários possam comprar
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="card p-4 sm:p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{ticket.name}</h3>
                      {ticket.description && (
                        <p className="text-lumera-muted mt-1">{ticket.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-400">
                        R$ {Number(ticket.price).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-lumera-muted">Disponível:</span>
                      <p className="font-semibold">
                        {ticket.quantity - ticket.sold} / {ticket.quantity}
                      </p>
                    </div>
                    <div>
                      <span className="text-lumera-muted">Vendidos:</span>
                      <p className="font-semibold">{ticket.sold}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-lumera-muted">Período de vendas:</span>
                      <p className="font-semibold">
                        {new Date(ticket.salesStart).toLocaleDateString('pt-BR')} até{' '}
                        {new Date(ticket.salesEnd).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {ticket.features.length > 0 && (
                    <div className="mb-4">
                      <span className="text-sm text-lumera-muted">Benefícios:</span>
                      <ul className="mt-1 space-y-1">
                        {ticket.features.map((feature, idx) => (
                          <li key={idx} className="text-sm flex items-center">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBatchManagerTicket(ticket)}
                    >
                      Lotes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(ticket)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(ticket.id)}
                      isLoading={deletingId === ticket.id}
                      className="text-red-400 border-red-400 hover:bg-red-500/10"
                    >
                      Deletar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Batch Manager Modal */}
      {batchManagerTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-lumera-surface rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <BatchManager
                ticketId={batchManagerTicket.id}
                ticketName={batchManagerTicket.name}
                onClose={() => setBatchManagerTicket(null)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
