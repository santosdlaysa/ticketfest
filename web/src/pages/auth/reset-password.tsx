import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authApi } from '@/services/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordForm>();

  const password = watch('password');

  useEffect(() => {
    if (token && typeof token === 'string') {
      verifyToken(token);
    }
  }, [token]);

  const verifyToken = async (tokenStr: string) => {
    try {
      await authApi.verifyResetToken(tokenStr);
      setTokenValid(true);
    } catch (error: any) {
      setTokenValid(false);
      setErrorMessage(error.response?.data?.error || 'Token invalido ou expirado');
    } finally {
      setVerifying(false);
    }
  };

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token || typeof token !== 'string') return;

    setLoading(true);
    try {
      await authApi.resetPassword(token, data.password);
      setSuccess(true);
      toast.success('Senha redefinida com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <>
        <Head><title>Redefinir senha - Lumera</title></Head>
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Verificando link...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Redefinir senha - Lumera</title></Head>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-lumera rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
              <span className="text-white font-bold text-3xl">L</span>
            </div>
            <h1 className="text-3xl font-bold text-lumera-obsidian">
              {success ? 'Senha redefinida!' : tokenValid ? 'Nova senha' : 'Link invalido'}
            </h1>
          </div>

          {success ? (
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Tudo pronto!</h2>
              <p className="text-gray-600 mb-6">
                Sua senha foi alterada com sucesso. Voce ja pode fazer login com sua nova senha.
              </p>
              <Link href="/auth/login">
                <Button className="w-full">
                  Ir para o login
                </Button>
              </Link>
            </div>
          ) : tokenValid ? (
            <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-4">
              <p className="text-gray-600 text-center mb-4">
                Digite sua nova senha abaixo
              </p>

              <Input
                label="Nova senha"
                type="password"
                placeholder="Minimo 6 caracteres"
                {...register('password', {
                  required: 'Senha obrigatoria',
                  minLength: {
                    value: 6,
                    message: 'A senha deve ter pelo menos 6 caracteres'
                  }
                })}
                error={errors.password?.message}
              />

              <Input
                label="Confirmar senha"
                type="password"
                placeholder="Digite novamente"
                {...register('confirmPassword', {
                  required: 'Confirmacao obrigatoria',
                  validate: value => value === password || 'As senhas nao conferem'
                })}
                error={errors.confirmPassword?.message}
              />

              <Button type="submit" className="w-full" isLoading={loading}>
                Redefinir senha
              </Button>
            </form>
          ) : (
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Link invalido</h2>
              <p className="text-gray-600 mb-6">
                {errorMessage || 'Este link de recuperacao expirou ou ja foi utilizado.'}
              </p>
              <div className="space-y-3">
                <Link href="/auth/forgot-password">
                  <Button className="w-full">
                    Solicitar novo link
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="ghost" className="w-full">
                    Voltar para o login
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
