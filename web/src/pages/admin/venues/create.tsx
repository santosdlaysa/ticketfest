import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { venuesApi } from '@/services/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

interface VenueFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  capacity: string;
  description: string;
  phone: string;
  email: string;
  images: string;
}

const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

export default function CreateVenue() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VenueFormData>({
    defaultValues: {
      state: 'SP',
    },
  });


  const onSubmit = async (data: VenueFormData) => {
    try {
      setSubmitting(true);

      const venueData = {
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode || undefined,
        capacity: data.capacity ? parseInt(data.capacity) : undefined,
        description: data.description || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        images: data.images
          ? data.images.split(',').map((url) => url.trim()).filter(Boolean)
          : [],
      };

      await venuesApi.create(venueData);
      toast.success('Local criado com sucesso!');
      router.push('/admin/venues');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar local');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head><title>Criar Local - Lumera</title></Head>
      <div className="p-6 max-w-3xl">
        <div className="mb-8">
          <Link
            href="/admin/venues"
            className="text-primary-400 hover:underline flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para Locais
          </Link>
          <h1 className="text-3xl font-bold">Criar Novo Local</h1>
          <p className="text-lumera-muted mt-2">
            Cadastre um novo local para seus eventos
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-6">
          {/* Informações Básicas */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Informações Básicas</h2>
            <div className="space-y-4">
              <Input
                label="Nome do Local *"
                placeholder="Ex: Teatro Municipal"
                error={errors.name?.message}
                {...register('name', {
                  required: 'Nome é obrigatório',
                  minLength: { value: 2, message: 'Nome deve ter pelo menos 2 caracteres' },
                })}
              />

              <div>
                <label className="block text-sm font-medium text-lumera-muted mb-1">
                  Descrição
                </label>
                <textarea
                  rows={3}
                  className="input w-full"
                  placeholder="Descreva o local..."
                  {...register('description')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Capacidade"
                  type="number"
                  placeholder="Ex: 5000"
                  {...register('capacity')}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="contato@local.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <Input
                label="Telefone"
                placeholder="(11) 99999-9999"
                {...register('phone')}
              />
            </div>
          </div>

          {/* Endereço */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Endereço</h2>
            <div className="space-y-4">
              <Input
                label="Endereço Completo *"
                placeholder="Rua, número, bairro"
                error={errors.address?.message}
                {...register('address', {
                  required: 'Endereço é obrigatório',
                  minLength: { value: 5, message: 'Endereço deve ter pelo menos 5 caracteres' },
                })}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Cidade *"
                  placeholder="São Paulo"
                  error={errors.city?.message}
                  {...register('city', {
                    required: 'Cidade é obrigatória',
                  })}
                />

                <div>
                  <label className="block text-sm font-medium text-lumera-muted mb-1">
                    Estado *
                  </label>
                  <select
                    className="input w-full"
                    {...register('state', { required: 'Estado é obrigatório' })}
                  >
                    {BRAZILIAN_STATES.map((state) => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="CEP"
                  placeholder="00000-000"
                  {...register('zipCode')}
                />
              </div>
            </div>
          </div>

          {/* Imagens */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Imagens</h2>
            <div>
              <label className="block text-sm font-medium text-lumera-muted mb-1">
                URLs das Imagens
              </label>
              <textarea
                rows={2}
                className="input w-full"
                placeholder="Cole URLs de imagens separadas por vírgula"
                {...register('images')}
              />
              <p className="text-sm text-lumera-muted mt-1">
                Adicione URLs de imagens do local, separadas por vírgula
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <Link href="/admin/venues" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" isLoading={submitting} className="flex-1">
              Criar Local
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
