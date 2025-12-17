import React, { useState, useRef } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { eventsApi, uploadApi } from '@/services/api';
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
  status: 'DRAFT' | 'PUBLISHED';
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

export default function CreateEvent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<EventForm>();

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

  const onSubmit = async (data: EventForm) => {
    setLoading(true);
    try {
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

            {/* Regras e Restrições */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Regras e Restrições</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Classificação Etária
                    </label>
                    <select
                      {...register('ageRestriction')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      <option value="">Livre</option>
                      <option value="10">10 anos</option>
                      <option value="12">12 anos</option>
                      <option value="14">14 anos</option>
                      <option value="16">16 anos</option>
                      <option value="18">18 anos</option>
                      <option value="21">21 anos</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                      Idade mínima para participar do evento
                    </p>
                  </div>

                  <Input
                    label="Dress Code"
                    {...register('dressCode')}
                    placeholder="Ex: Traje Social, Casual, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Regras do Evento
                  </label>
                  <textarea
                    {...register('rules')}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Digite as regras do evento (uma por linha)&#10;Ex:&#10;- Proibido entrada de bebidas&#10;- Proibido fumar no local&#10;- Obrigatório apresentar documento com foto"
                  />
                  <p className="text-sm text-gray-500 mt-1">
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
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <svg
                      className="w-12 h-12 text-gray-400 mb-3"
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
                        <span className="text-gray-600">Enviando...</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-primary-600 font-medium">
                          Clique para enviar imagens
                        </span>
                        <span className="text-sm text-gray-500 mt-1">
                          PNG, JPG, GIF ou WebP (max. 5MB cada)
                        </span>
                      </>
                    )}
                  </label>
                </div>

                {/* Preview das imagens */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={url}
                            alt={`Imagem ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-sm text-gray-500">
                  {uploadedImages.length > 0
                    ? `${uploadedImages.length} imagem(ns) selecionada(s)`
                    : 'Nenhuma imagem selecionada'}
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
