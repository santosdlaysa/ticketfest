import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { organizerAccountApi } from '@/services/api';

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
  const [hasAccount, setHasAccount] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CompanyForm>();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await organizerAccountApi.getMyAccount();
      setHasAccount(true);
      reset({
        companyName: data.companyInfo.companyName || '',
        tradingName: data.companyInfo.tradingName || '',
        cnpj: data.companyInfo.cnpj || '',
        companyEmail: data.companyInfo.companyEmail || '',
        companyPhone: data.companyInfo.companyPhone || '',
        companyAddress: data.companyInfo.companyAddress || '',
        companyCity: data.companyInfo.companyCity || '',
        companyState: data.companyInfo.companyState || 'SP',
        companyZipCode: data.companyInfo.companyZipCode || '',
        taxRegime: data.companyInfo.taxRegime || '',
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        setHasAccount(false);
      } else {
        toast.error('Erro ao carregar configuracoes');
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CompanyForm) => {
    try {
      setSaving(true);

      const companyInfo = {
        companyName: data.companyName,
        tradingName: data.tradingName || null,
        cnpj: data.cnpj.replace(/\D/g, ''),
        companyEmail: data.companyEmail || null,
        companyPhone: data.companyPhone || null,
        companyAddress: data.companyAddress || null,
        companyCity: data.companyCity || null,
        companyState: data.companyState || null,
        companyZipCode: data.companyZipCode || null,
        taxRegime: data.taxRegime || null,
      };

      if (!hasAccount) {
        await organizerAccountApi.createAccount({ companyInfo });
        setHasAccount(true);
        toast.success('Conta de organizador criada com sucesso!');
      } else {
        await organizerAccountApi.updateCompanyInfo(companyInfo);
        toast.success('Dados da empresa atualizados com sucesso!');
      }

      await loadSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar configuracoes');
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
      <>
        <Head><title>Dados da Empresa - Lumera</title></Head>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Dados da Empresa - Lumera</title>
      </Head>

      <div className="p-6 max-w-3xl">
        <div className="mb-8">
          <Link
            href="/admin/settings"
            className="text-primary-400 hover:underline flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para Configuracoes
          </Link>
          <h1 className="text-3xl font-bold text-lumera-luminoso">Dados da Empresa</h1>
          <p className="text-lumera-muted mt-2">
            Configure as informacoes da sua empresa para emissao de notas e recebimento
          </p>
        </div>

        {/* No Account Message */}
        {!hasAccount && (
          <div className="card p-4 mb-6 bg-blue-500/20 border-lumera-border">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="font-medium text-blue-400">Crie sua conta de organizador</div>
                <div className="text-sm text-blue-400/80">
                  Preencha os dados abaixo para comecar a receber os repasses das vendas dos seus eventos
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-6">
          {/* Identificacao */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Identificacao</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Razao Social *"
                placeholder="Nome oficial da empresa"
                error={errors.companyName?.message}
                {...register('companyName', { required: 'Razao social e obrigatoria' })}
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
                  required: 'CNPJ e obrigatorio',
                  onChange: (e) => {
                    e.target.value = formatCNPJ(e.target.value);
                  },
                })}
              />
              <div>
                <label className="block text-sm font-medium text-lumera-muted mb-1">
                  Regime Tributario
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
                label="Email da Empresa"
                type="email"
                placeholder="contato@empresa.com.br"
                error={errors.companyEmail?.message}
                {...register('companyEmail', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email invalido',
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

          {/* Endereco */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Endereco</h2>
            <div className="space-y-4">
              <Input
                label="Endereco Completo"
                placeholder="Rua, numero, complemento, bairro"
                {...register('companyAddress')}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Cidade"
                  placeholder="Sao Paulo"
                  {...register('companyCity')}
                />
                <div>
                  <label className="block text-sm font-medium text-lumera-muted mb-1">
                    Estado
                  </label>
                  <select
                    className="input w-full"
                    {...register('companyState')}
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
          <div className="flex gap-4 pt-4 border-t border-lumera-border">
            <Link href="/admin/settings" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" isLoading={saving} className="flex-1">
              {hasAccount ? 'Salvar Alteracoes' : 'Criar Conta de Organizador'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
