import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authApi } from '@/services/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setSubmitted(true);
      toast.success('Email enviado com sucesso!');
    } catch (error: any) {
      // Always show success to prevent email enumeration
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Esqueci minha senha - Lumera</title></Head>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-lumera rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
              <span className="text-white font-bold text-3xl">L</span>
            </div>
            <h1 className="text-3xl font-bold text-lumera-obsidian">Esqueceu sua senha?</h1>
            <p className="text-gray-600 mt-2">
              {submitted
                ? 'Verifique seu email para continuar'
                : 'Digite seu email para receber um link de recuperacao'
              }
            </p>
          </div>

          {submitted ? (
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Email enviado!</h2>
              <p className="text-gray-600 mb-6">
                Se o email informado estiver cadastrado, voce recebera um link para redefinir sua senha.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Nao recebeu? Verifique sua caixa de spam ou tente novamente.
              </p>
              <div className="space-y-3">
                <Button onClick={() => setSubmitted(false)} variant="outline" className="w-full">
                  Tentar novamente
                </Button>
                <Link href="/auth/login">
                  <Button variant="ghost" className="w-full">
                    Voltar para o login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="seu@email.com"
                {...register('email', {
                  required: 'Email obrigatorio',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email invalido'
                  }
                })}
                error={errors.email?.message}
              />

              <Button type="submit" className="w-full" isLoading={loading}>
                Enviar link de recuperacao
              </Button>

              <p className="text-center text-sm text-gray-600">
                Lembrou sua senha?{' '}
                <Link href="/auth/login" className="text-primary-500 hover:text-primary-600 hover:underline font-medium">
                  Voltar para o login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
