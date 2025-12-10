import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { eventsApi } from '@/services/api';
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
  images: string;
  status: 'DRAFT' | 'PUBLISHED';
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

export default function CreateEvent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<EventForm>();


  const onSubmit = async (data: EventForm) => {
    setLoading(true);
    try {
      // Processar imagens (separadas por vírgula)
      const images = data.images
        ? data.images.split(',').map(url => url.trim()).filter(url => url)
        : [];

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
      };

      const event = await eventsApi.create(eventData);
      toast.success('Evento criado com sucesso!');
      router.push(`/admin/events`);
    } catch (error: any) {
      console.error('Erro ao criar evento:', error);
      toast.error(error.response?.data?.error || 'Erro ao criar evento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Criar Evento - Lumera</title></Head>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Criar Novo Evento</h1>
            <p className="text-gray-600 mt-2">
              Preencha os dados do seu evento
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-6">
            {/* Informações Básicas */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Informações Básicas</h2>
              <div className="space-y-4">
                <Input
                  label="Nome do Evento *"
                  {...register('name', {
                    required: 'Nome é obrigatório',
                    minLength: { value: 3, message: 'Nome deve ter pelo menos 3 caracteres' }
                  })}
                  error={errors.name?.message}
                  placeholder="Ex: Festival de Música 2025"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição *
                  </label>
                  <textarea
                    {...register('description', {
                      required: 'Descrição é obrigatória',
                      minLength: { value: 10, message: 'Descrição deve ter pelo menos 10 caracteres' }
                    })}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Descreva seu evento de forma detalhada..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria *
                    </label>
                    <select
                      {...register('category', { required: 'Categoria é obrigatória' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      <option value="">Selecione uma categoria</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <select
                      {...register('status', { required: 'Status é obrigatório' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      <option value="DRAFT">Rascunho</option>
                      <option value="PUBLISHED">Publicado</option>
                    </select>
                    {errors.status && (
                      <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
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
                />

                <Input
                  label="Data de Término (opcional)"
                  type="datetime-local"
                  {...register('endDate')}
                  error={errors.endDate?.message}
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
                    minLength: { value: 3, message: 'Local deve ter pelo menos 3 caracteres' }
                  })}
                  error={errors.location?.message}
                  placeholder="Ex: Centro de Convenções"
                />

                <Input
                  label="Endereço Completo *"
                  {...register('address', {
                    required: 'Endereço é obrigatório',
                    minLength: { value: 5, message: 'Endereço deve ter pelo menos 5 caracteres' }
                  })}
                  error={errors.address?.message}
                  placeholder="Ex: Av. Paulista, 1000 - São Paulo, SP"
                />
              </div>
            </div>

            {/* Imagens */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Imagens</h2>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  URLs das Imagens (separadas por vírgula)
                </label>
                <textarea
                  {...register('images')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="https://exemplo.com/imagem1.jpg, https://exemplo.com/imagem2.jpg"
                />
                <p className="text-sm text-gray-500">
                  Cole as URLs das imagens do evento, separadas por vírgula
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
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
                isLoading={loading}
                className="flex-1"
              >
                Criar Evento
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
