import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { companyApi, BankDetails } from '@/services/api';

const BANKS = [
  { code: '001', name: 'Banco do Brasil' },
  { code: '033', name: 'Santander' },
  { code: '104', name: 'Caixa Econômica Federal' },
  { code: '237', name: 'Bradesco' },
  { code: '341', name: 'Itaú Unibanco' },
  { code: '260', name: 'Nubank' },
  { code: '077', name: 'Inter' },
  { code: '336', name: 'C6 Bank' },
  { code: '212', name: 'Banco Original' },
  { code: '756', name: 'Sicoob' },
  { code: '748', name: 'Sicredi' },
  { code: '422', name: 'Banco Safra' },
  { code: '745', name: 'Citibank' },
  { code: '399', name: 'HSBC' },
];

interface BankForm {
  bankCode: string;
  accountType: string;
  agencyNumber: string;
  agencyDigit: string;
  accountNumber: string;
  accountDigit: string;
  holderName: string;
  holderDocument: string;
  holderType: string;
}

export default function BankSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verified, setVerified] = useState(false);
  const [balance, setBalance] = useState({ available: 0, pending: 0 });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<BankForm>();
  const selectedBank = watch('bankCode');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await companyApi.getSettings();
      setVerified(data.verified);
      setBalance({
        available: data.availableBalance,
        pending: data.pendingBalance,
      });
      reset({
        bankCode: data.bankDetails.bankCode || '',
        accountType: data.bankDetails.accountType || 'CHECKING',
        agencyNumber: data.bankDetails.agencyNumber || '',
        agencyDigit: data.bankDetails.agencyDigit || '',
        accountNumber: data.bankDetails.accountNumber || '',
        accountDigit: data.bankDetails.accountDigit || '',
        holderName: data.bankDetails.holderName || '',
        holderDocument: data.bankDetails.holderDocument || '',
        holderType: data.bankDetails.holderType || 'INDIVIDUAL',
      });
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('Erro ao carregar dados bancários');
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: BankForm) => {
    try {
      setSaving(true);
      // Bank details are updated through split-payment routes, not company routes
      // For now, show a message that this needs to be done elsewhere
      toast.error('Atualize os dados bancários na seção de Repasses');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar dados bancários');
    } finally {
      setSaving(false);
    }
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .substring(0, 14);
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

  const selectedBankName = BANKS.find((b) => b.code === selectedBank)?.name || '';

  if (loading) {
    return (
      <AdminLayout>
        <Head><title>Dados Bancários - Lumera</title></Head>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Dados Bancários - Lumera</title>
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
          <h1 className="text-3xl font-bold text-gray-900">Dados Bancários</h1>
          <p className="text-gray-600 mt-2">
            Configure sua conta bancária para receber os repasses das vendas
          </p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="card p-4">
            <div className="text-sm text-gray-600">Saldo Disponível</div>
            <div className="text-2xl font-bold text-green-600">
              R$ {balance.available.toFixed(2)}
            </div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-gray-600">Saldo Pendente</div>
            <div className="text-2xl font-bold text-yellow-600">
              R$ {balance.pending.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div className={`card p-4 mb-6 ${verified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center gap-3">
            {verified ? (
              <>
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-medium text-green-800">Conta Verificada</div>
                  <div className="text-sm text-green-700">Sua conta está pronta para receber repasses</div>
                </div>
              </>
            ) : (
              <>
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <div className="font-medium text-yellow-800">Verificação Pendente</div>
                  <div className="text-sm text-yellow-700">Complete seus dados para habilitar os repasses</div>
                </div>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-6">
          {/* Banco */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Dados da Conta</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banco *
                </label>
                <select
                  className="input w-full"
                  {...register('bankCode', { required: 'Banco é obrigatório' })}
                >
                  <option value="">Selecione o banco</option>
                  {BANKS.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.code} - {bank.name}
                    </option>
                  ))}
                </select>
                {errors.bankCode && (
                  <p className="text-red-500 text-sm mt-1">{errors.bankCode.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Conta *
                </label>
                <select
                  className="input w-full"
                  {...register('accountType', { required: 'Tipo é obrigatório' })}
                >
                  <option value="CHECKING">Conta Corrente</option>
                  <option value="SAVINGS">Poupança</option>
                </select>
              </div>
            </div>
          </div>

          {/* Agência e Conta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  label="Agência *"
                  placeholder="0000"
                  error={errors.agencyNumber?.message}
                  {...register('agencyNumber', { required: 'Agência é obrigatória' })}
                />
              </div>
              <div className="w-20">
                <Input
                  label="Dígito"
                  placeholder="0"
                  {...register('agencyDigit')}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  label="Conta *"
                  placeholder="00000000"
                  error={errors.accountNumber?.message}
                  {...register('accountNumber', { required: 'Conta é obrigatória' })}
                />
              </div>
              <div className="w-20">
                <Input
                  label="Dígito *"
                  placeholder="0"
                  error={errors.accountDigit?.message}
                  {...register('accountDigit', { required: 'Dígito é obrigatório' })}
                />
              </div>
            </div>
          </div>

          {/* Titular */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Dados do Titular</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome do Titular *"
                placeholder="Nome completo"
                error={errors.holderName?.message}
                {...register('holderName', { required: 'Nome é obrigatório' })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Pessoa *
                </label>
                <select
                  className="input w-full"
                  {...register('holderType', { required: 'Tipo é obrigatório' })}
                >
                  <option value="INDIVIDUAL">Pessoa Física</option>
                  <option value="COMPANY">Pessoa Jurídica</option>
                </select>
              </div>
              <Input
                label="CPF/CNPJ do Titular *"
                placeholder="000.000.000-00"
                error={errors.holderDocument?.message}
                {...register('holderDocument', {
                  required: 'Documento é obrigatório',
                  onChange: (e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    e.target.value = value.length <= 11 ? formatCPF(e.target.value) : formatCNPJ(e.target.value);
                  },
                })}
              />
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
