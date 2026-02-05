import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { eventsApi, uploadApi } from '@/services/api';
import type { Event } from '@/types';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

interface EventForm {
  name: string;
  description: string;
  date: string;
  endDate?: string;
  location: string;
  address: string;
  category: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  ageRestriction?: number;
  dressCode?: string;
  rules?: string;
}

const CATEGORIES = [
  'Música',
  'Tecnologia',
  'Comédia',
  'Teatro',
  'Esporte',
  'Gastronomia',
  'Educação',
  'Arte',
  'Negócios',
  'Outro',
];

export default function EditEvent() {
  const router = useRouter();
  const { id } = router.query;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventForm>();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadApi.uploadImage(file));
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map(r => r.url);
      setUploadedImages(prev => [...prev, ...newUrls]);
      toast.success(`${files.length} imagem(ns) enviada(s) com sucesso!`);
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast.error(error.response?.data?.error || 'Erro ao enviar imagem');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (id) {
      loadEvent();
    }
  }, [id]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const data = await eventsApi.getById(id as string);
      setEvent(data);

      // Format date for datetime-local input
      const formatDateForInput = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toISOString().slice(0, 16);
      };

      // Set existing images
      if (data.images && data.images.length > 0) {
        setUploadedImages(data.images);
      }

      // Reset form with event data
      reset({
        name: data.name,
        description: data.description,
        date: formatDateForInput(data.date),
        endDate: data.endDate ? formatDateForInput(data.endDate) : '',
        location: data.location,
        address: data.address,
        category: data.category,
        status: data.status,
        ageRestriction: (data as any).ageRestriction || undefined,
        dressCode: (data as any).dressCode || '',
        rules: (data as any).rules || '',
      });
    } catch (error: any) {
      toast.error('Erro ao carregar evento');
      console.error(error);
      router.push('/admin/events');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: EventForm) => {
    if (!id) return;

    // Check if event is completed
    if (event?.status === 'COMPLETED') {
      toast.error('Não é possível editar um evento concluído');
      return;
    }

    try {
      setSubmitting(true);

      // Usar imagens do estado
      const images = uploadedImages;

      // Formatar data para ISO
      const eventData = {
        name: data.name,
        description: data.description,
        date: new Date(data.date).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        location: data.location,
        address: data.address,
        category: data.category,
        images,
        status: data.status,
        ageRestriction: data.ageRestriction ? Number(data.ageRestriction) : undefined,
        dressCode: data.dressCode || undefined,
        rules: data.rules || undefined,
      };

      await eventsApi.update(id as string, eventData);
      toast.success('Evento atualizado com sucesso!');
      router.push('/admin/events');
    } catch (error: any) {
      console.error('Erro ao atualizar evento:', error);
      toast.error(error.response?.data?.error || 'Erro ao atualizar evento');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      DRAFT: { label: 'Rascunho', className: 'badge badge-gray' },
      PUBLISHED: { label: 'Publicado', className: 'badge badge-success' },
      CANCELLED: { label: 'Cancelado', className: 'badge badge-error' },
      COMPLETED: { label: 'Concluído', className: 'badge badge-primary' },
    };
    return statusMap[status] || statusMap.DRAFT;
  };

  if (loading || !event) {
    return (
      <>
        <Head><title>Editar Evento - Lumera</title></Head>
        <div className="p-6">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-lumera-muted">Carregando evento...</p>
          </div>
        </div>
      </>
    );
  }

  const isCompleted = event.status === 'COMPLETED';
  const hasSoldTickets = event.tickets?.some((t) => t.sold > 0);

  return (
    <>
      <Head><title>Editar {event.name} - Lumera</title></Head>
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
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
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">Editar Evento</h1>
              <span className={getStatusInfo(event.status).className}>
                {getStatusInfo(event.status).label}
              </span>
            </div>
            <p className="text-lumera-muted mt-2">
              Atualize as informações do seu evento
            </p>
          </div>

          {isCompleted && (
            <div className="mb-6 p-4 bg-yellow-500/20 border border-lumera-border rounded-lg">
              <div className="flex items-center gap-2 text-yellow-300">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-medium">Este evento está concluído e não pode ser editado.</span>
              </div>
            </div>
          )}

          {hasSoldTickets && !isCompleted && (
            <div className="mb-6 p-4 bg-blue-500/20 border border-lumera-border rounded-lg">
              <div className="flex items-center gap-2 text-blue-300">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Este evento já possui ingressos vendidos. Algumas alterações podem afetar os compradores.
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-6">
            {/* Informações Básicas */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Informações Básicas</h2>
              <div className="space-y-4">
                <Input
                  label="Nome do Evento *"
                  {...register('name', {
                    required: 'Nome é obrigatório',
                    minLength: { value: 3, message: 'Nome deve ter pelo menos 3 caracteres' },
                  })}
                  error={errors.name?.message}
                  placeholder="Ex: Festival de Música 2025"
                  disabled={isCompleted}
                />

                <div>
                  <label className="block text-sm font-medium text-lumera-muted mb-1">
                    Descrição *
                  </label>
                  <textarea
                    {...register('description', {
                      required: 'Descrição é obrigatória',
                      minLength: { value: 10, message: 'Descrição deve ter pelo menos 10 caracteres' },
                    })}
                    rows={5}
                    className="w-full px-4 py-2 border border-lumera-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-lumera-surface-alt disabled:cursor-not-allowed"
                    placeholder="Descreva seu evento de forma detalhada..."
                    disabled={isCompleted}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-lumera-muted mb-1">
                      Categoria *
                    </label>
                    <select
                      {...register('category', { required: 'Categoria é obrigatória' })}
                      className="w-full px-4 py-2 border border-lumera-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-lumera-surface-alt disabled:cursor-not-allowed"
                      disabled={isCompleted}
                    >
                      <option value="">Selecione uma categoria</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-400">{errors.category.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-lumera-muted mb-1">
                      Status *
                    </label>
                    <select
                      {...register('status', { required: 'Status é obrigatório' })}
                      className="w-full px-4 py-2 border border-lumera-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-lumera-surface-alt disabled:cursor-not-allowed"
                      disabled={isCompleted}
                    >
                      <option value="DRAFT">Rascunho</option>
                      <option value="PUBLISHED">Publicado</option>
                      <option value="CANCELLED">Cancelado</option>
                      {isCompleted && <option value="COMPLETED">Concluído</option>}
                    </select>
                    {errors.status && (
                      <p className="mt-1 text-sm text-red-400">{errors.status.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Data e Horário */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Data e Horário</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Data de Início *"
                  type="datetime-local"
                  {...register('date', { required: 'Data de início é obrigatória' })}
                  error={errors.date?.message}
                  disabled={isCompleted}
                />

                <Input
                  label="Data de Término (opcional)"
                  type="datetime-local"
                  {...register('endDate')}
                  error={errors.endDate?.message}
                  disabled={isCompleted}
                />
              </div>
            </div>

            {/* Localização */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Localização</h2>
              <div className="space-y-4">
                <Input
                  label="Local/Venue *"
                  {...register('location', {
                    required: 'Local é obrigatório',
                    minLength: { value: 3, message: 'Local deve ter pelo menos 3 caracteres' },
                  })}
                  error={errors.location?.message}
                  placeholder="Ex: Centro de Convenções"
                  disabled={isCompleted}
                />

                <Input
                  label="Endereço Completo *"
                  {...register('address', {
                    required: 'Endereço é obrigatório',
                    minLength: { value: 5, message: 'Endereço deve ter pelo menos 5 caracteres' },
                  })}
                  error={errors.address?.message}
                  placeholder="Ex: Av. Paulista, 1000 - São Paulo, SP"
                  disabled={isCompleted}
                />
              </div>
            </div>

            {/* Regras e Restrições */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Regras e Restrições</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-lumera-muted mb-1">
                      Classificação Etária
                    </label>
                    <select
                      {...register('ageRestriction')}
                      className="w-full px-4 py-2 border border-lumera-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-lumera-surface-alt disabled:cursor-not-allowed"
                      disabled={isCompleted}
                    >
                      <option value="">Livre</option>
                      <option value="10">10 anos</option>
                      <option value="12">12 anos</option>
                      <option value="14">14 anos</option>
                      <option value="16">16 anos</option>
                      <option value="18">18 anos</option>
                      <option value="21">21 anos</option>
                    </select>
                    <p className="text-sm text-lumera-muted mt-1">
                      Idade mínima para participar do evento
                    </p>
                  </div>

                  <Input
                    label="Dress Code"
                    {...register('dressCode')}
                    placeholder="Ex: Traje Social, Casual, etc."
                    disabled={isCompleted}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-lumera-muted mb-1">
                    Regras do Evento
                  </label>
                  <textarea
                    {...register('rules')}
                    rows={4}
                    className="w-full px-4 py-2 border border-lumera-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-lumera-surface-alt disabled:cursor-not-allowed"
                    placeholder="Digite as regras do evento (uma por linha)"
                    disabled={isCompleted}
                  />
                  <p className="text-sm text-lumera-muted mt-1">
                    Informe as regras e orientações para os participantes
                  </p>
                </div>
              </div>
            </div>

            {/* Imagens */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Imagens</h2>
              <div className="space-y-4">
                {/* Upload Area */}
                {!isCompleted && (
                  <div className="border-2 border-dashed border-lumera-border rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload-edit"
                    />
                    <label
                      htmlFor="image-upload-edit"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <svg
                        className="w-12 h-12 text-lumera-muted mb-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {uploading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-lumera-muted">Enviando...</span>
                        </div>
                      ) : (
                        <>
                          <span className="text-primary-400 font-medium">
                            Clique para enviar imagens
                          </span>
                          <span className="text-sm text-lumera-muted mt-1">
                            PNG, JPG, GIF ou WebP (max. 5MB cada)
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                )}

                {/* Preview das imagens */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-video relative rounded-lg overflow-hidden bg-lumera-surface-alt">
                          <Image
                            src={url}
                            alt={`Imagem ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-sm text-lumera-muted">
                  {uploadedImages.length > 0
                    ? `${uploadedImages.length} imagem(ns) selecionada(s)`
                    : 'Nenhuma imagem selecionada'}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-lumera-border">
              <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
              <div className="flex flex-wrap gap-3">
                <Link href={`/admin/events/${id}/tickets`}>
                  <Button type="button" variant="outline">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    Gerenciar Ingressos
                  </Button>
                </Link>
                <Link href={`/events/${event.slug}`}>
                  <Button type="button" variant="outline">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Ver Página Pública
                  </Button>
                </Link>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4 border-t border-lumera-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/events')}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={submitting}
                className="flex-1"
                disabled={isCompleted}
              >
                Salvar Alterações
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
