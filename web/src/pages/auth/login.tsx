import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Login realizado com sucesso!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Login - TicketFest</title></Head>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Bem-vindo de volta!</h1>
            <p className="text-gray-600 mt-2">Entre com sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-4">
            <Input
              label="Email"
              type="email"
              {...register('email', { required: 'Email obrigatório' })}
              error={errors.email?.message}
            />
            <Input
              label="Senha"
              type="password"
              {...register('password', { required: 'Senha obrigatória' })}
              error={errors.password?.message}
            />

            <Button type="submit" className="w-full" isLoading={loading}>
              Entrar
            </Button>

            <p className="text-center text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link href="/auth/register" className="text-primary-600 hover:underline">
                Criar conta
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
