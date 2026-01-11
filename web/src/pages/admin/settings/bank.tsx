import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { organizerAccountApi } from '@/services/api';

const BANKS = [
  { code: '001', name: 'Banco do Brasil' },
  { code: '033', name: 'Santander' },
  { code: '104', name: 'Caixa Economica Federal' },
  { code: '237', name: 'Bradesco' },
  { code: '341', name: 'Itau Unibanco' },
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
  pixKeyType: string;
  pixKey: string;
}

export default function BankSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verified, setVerified] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);
  const [balance, setBalance] = useState({ available: 0, pending: 0 });
  const [requestingVerification, setRequestingVerification] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<BankForm>();
  const selectedBank = watch('bankCode');
  const holderType = watch('holderType');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await organizerAccountApi.getMyAccount();
      setHasAccount(true);
      setVerified(data.verified);
      setBalance({
        available: data.balance.available,
        pending: data.balance.pending,
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
        pixKeyType: data.bankDetails.pixKeyType || '',
        pixKey: data.bankDetails.pixKey || '',
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        setHasAccount(false);
      } else {
        toast.error('Erro ao carregar dados bancarios');
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: BankForm) => {
    try {
      setSaving(true);

      const bankName = BANKS.find(b => b.code === data.bankCode)?.name || '';

      const bankDetails = {
        bankCode: data.bankCode,
        bankName,
        accountType: data.accountType as 'CHECKING' | 'SAVINGS',
        accountNumber: data.accountNumber,
        accountDigit: data.accountDigit,
        agencyNumber: data.agencyNumber,
        agencyDigit: data.agencyDigit || null,
        holderName: data.holderName,
        holderDocument: data.holderDocument.replace(/\D/g, ''),
        holderType: data.holderType as 'INDIVIDUAL' | 'COMPANY',
        pixKeyType: data.pixKeyType as any || null,
        pixKey: data.pixKey || null,
      };

      if (!hasAccount) {
        await organizerAccountApi.createAccount({ bankDetails });
        setHasAccount(true);
        toast.success('Conta de organizador criada com sucesso!');
      } else {
        await organizerAccountApi.updateBankDetails(bankDetails);
        toast.success('Dados bancarios atualizados com sucesso!');
      }

      setVerified(false); // Bank details change requires re-verification
      await loadSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar dados bancarios');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestVerification = async () => {
    try {
      setRequestingVerification(true);
      await organizerAccountApi.requestVerification();
      toast.success('Solicitacao de verificacao enviada!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao solicitar verificacao');
    } finally {
      setRequestingVerification(false);
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

  if (loading) {
    return (
      <>
        <Head><title>Dados Bancarios - Lumera</title></Head>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Dados Bancarios - Lumera</title>
      </Head>

      <div className="p-6 max-w-3xl">
        <div className="mb-8">
          <Link
            href="/admin/settings"
            className="text-primary-600 hover:underline flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para Configuracoes
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Dados Bancarios</h1>
          <p className="text-gray-600 mt-2">
            Configure sua conta bancaria para receber os repasses das vendas
          </p>
        </div>

        {/* Balance Cards */}
        {hasAccount && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="card p-4">
              <div className="text-sm text-gray-600">Saldo Disponivel</div>
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
        )}

        {/* Verification Status */}
        {hasAccount && (
          <div className={`card p-4 mb-6 ${verified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {verified ? (
                  <>
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <div className="font-medium text-green-800">Conta Verificada</div>
                      <div className="text-sm text-green-700">Sua conta esta pronta para receber repasses</div>
                    </div>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <div className="font-medium text-yellow-800">Verificacao Pendente</div>
                      <div className="text-sm text-yellow-700">Complete seus dados e solicite verificacao</div>
                    </div>
                  </>
                )}
              </div>
              {!verified && hasAccount && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRequestVerification}
                  isLoading={requestingVerification}
                >
                  Solicitar Verificacao
                </Button>
              )}
            </div>
          </div>
        )}

        {/* No Account Message */}
        {!hasAccount && (
          <div className="card p-4 mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="font-medium text-blue-800">Crie sua conta de organizador</div>
                <div className="text-sm text-blue-700">
                  Preencha os dados abaixo para comecar a receber os repasses das vendas dos seus eventos
                </div>
              </div>
            </div>
          </div>
        )}

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
                  {...register('bankCode', { required: 'Banco e obrigatorio' })}
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
                  {...register('accountType', { required: 'Tipo e obrigatorio' })}
                >
                  <option value="CHECKING">Conta Corrente</option>
                  <option value="SAVINGS">Poupanca</option>
                </select>
              </div>
            </div>
          </div>

          {/* Agencia e Conta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  label="Agencia *"
                  placeholder="0000"
                  error={errors.agencyNumber?.message}
                  {...register('agencyNumber', { required: 'Agencia e obrigatoria' })}
                />
              </div>
              <div className="w-20">
                <Input
                  label="Digito"
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
                  {...register('accountNumber', { required: 'Conta e obrigatoria' })}
                />
              </div>
              <div className="w-20">
                <Input
                  label="Digito *"
                  placeholder="0"
                  error={errors.accountDigit?.message}
                  {...register('accountDigit', { required: 'Digito e obrigatorio' })}
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
                {...register('holderName', { required: 'Nome e obrigatorio' })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Pessoa *
                </label>
                <select
                  className="input w-full"
                  {...register('holderType', { required: 'Tipo e obrigatorio' })}
                >
                  <option value="INDIVIDUAL">Pessoa Fisica</option>
                  <option value="COMPANY">Pessoa Juridica</option>
                </select>
              </div>
              <Input
                label={holderType === 'COMPANY' ? 'CNPJ do Titular *' : 'CPF do Titular *'}
                placeholder={holderType === 'COMPANY' ? '00.000.000/0000-00' : '000.000.000-00'}
                error={errors.holderDocument?.message}
                {...register('holderDocument', {
                  required: 'Documento e obrigatorio',
                  onChange: (e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    e.target.value = value.length <= 11 ? formatCPF(e.target.value) : formatCNPJ(e.target.value);
                  },
                })}
              />
            </div>
          </div>

          {/* PIX */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Chave PIX (Opcional)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Chave
                </label>
                <select
                  className="input w-full"
                  {...register('pixKeyType')}
                >
                  <option value="">Nenhuma</option>
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="EMAIL">Email</option>
                  <option value="PHONE">Telefone</option>
                  <option value="RANDOM">Chave Aleatoria</option>
                </select>
              </div>
              <Input
                label="Chave PIX"
                placeholder="Digite sua chave PIX"
                {...register('pixKey')}
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
              {hasAccount ? 'Salvar Alteracoes' : 'Criar Conta de Organizador'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
