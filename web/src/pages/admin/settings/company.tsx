import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { companyApi, CompanySettings } from '@/services/api';

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
];

const TAX_REGIMES = [
  { value: 'simples_nacional', label: 'Simples Nacional' },
  { value: 'lucro_presumido', label: 'Lucro Presumido' },
  { value: 'lucro_real', label: 'Lucro Real' },
  { value: 'mei', label: 'MEI' },
];

interface CompanyForm {
  companyName: string;
  tradingName: string;
  cnpj: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  companyCity: string;
  companyState: string;
  companyZipCode: string;
  taxRegime: string;
}

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CompanyForm>();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await companyApi.getSettings();
      reset({
        companyName: data.companySettings.companyName || '',
        tradingName: data.companySettings.tradingName || '',
        cnpj: data.companySettings.cnpj || '',
        companyEmail: data.companySettings.companyEmail || '',
        companyPhone: data.companySettings.companyPhone || '',
        companyAddress: data.companySettings.companyAddress || '',
        companyCity: data.companySettings.companyCity || '',
        companyState: data.companySettings.companyState || 'SP',
        companyZipCode: data.companySettings.companyZipCode || '',
        taxRegime: data.companySettings.taxRegime || '',
      });
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('Erro ao carregar configurações');
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CompanyForm) => {
    try {
      setSaving(true);
      await companyApi.updateSettings(data);
      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  };

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .substring(0, 9);
  };

  if (loading) {
    return (
      <AdminLayout>
        <Head><title>Dados da Empresa - Lumera</title></Head>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Dados da Empresa - Lumera</title>
      </Head>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <Link
            href="/admin/settings"
            className="text-primary-600 hover:underline flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para Configurações
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Dados da Empresa</h1>
          <p className="text-gray-600 mt-2">
            Configure as informações da sua empresa para emissão de notas e recebimento
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-6">
          {/* Identificação */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Identificação</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Razão Social *"
                placeholder="Nome oficial da empresa"
                error={errors.companyName?.message}
                {...register('companyName', { required: 'Razão social é obrigatória' })}
              />
              <Input
                label="Nome Fantasia"
                placeholder="Nome comercial"
                {...register('tradingName')}
              />
              <Input
                label="CNPJ *"
                placeholder="00.000.000/0000-00"
                error={errors.cnpj?.message}
                {...register('cnpj', {
                  required: 'CNPJ é obrigatório',
                  onChange: (e) => {
                    e.target.value = formatCNPJ(e.target.value);
                  },
                })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Regime Tributário
                </label>
                <select
                  className="input w-full"
                  {...register('taxRegime')}
                >
                  <option value="">Selecione</option>
                  {TAX_REGIMES.map((regime) => (
                    <option key={regime.value} value={regime.value}>
                      {regime.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contato */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Contato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email da Empresa *"
                type="email"
                placeholder="contato@empresa.com.br"
                error={errors.companyEmail?.message}
                {...register('companyEmail', {
                  required: 'Email é obrigatório',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido',
                  },
                })}
              />
              <Input
                label="Telefone"
                placeholder="(11) 99999-9999"
                {...register('companyPhone', {
                  onChange: (e) => {
                    e.target.value = formatPhone(e.target.value);
                  },
                })}
              />
            </div>
          </div>

          {/* Endereço */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Endereço</h2>
            <div className="space-y-4">
              <Input
                label="Endereço Completo *"
                placeholder="Rua, número, complemento, bairro"
                error={errors.companyAddress?.message}
                {...register('companyAddress', { required: 'Endereço é obrigatório' })}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Cidade *"
                  placeholder="São Paulo"
                  error={errors.companyCity?.message}
                  {...register('companyCity', { required: 'Cidade é obrigatória' })}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado *
                  </label>
                  <select
                    className="input w-full"
                    {...register('companyState', { required: 'Estado é obrigatório' })}
                  >
                    {BRAZILIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="CEP"
                  placeholder="00000-000"
                  {...register('companyZipCode', {
                    onChange: (e) => {
                      e.target.value = formatCEP(e.target.value);
                    },
                  })}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t">
            <Link href="/admin/settings" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" isLoading={saving} className="flex-1">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
