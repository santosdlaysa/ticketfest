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
  const { login, loginMock } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const useMockAuth = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      let loggedUser;
      if (useMockAuth) {
        // Usar login mock (sem chamar API)
        loggedUser = loginMock(data.email, data.password);
        toast.success('Login realizado com sucesso! (modo mock)');
      } else {
        // Usar login real (chama API)
        loggedUser = await login(data.email, data.password);
        toast.success('Login realizado com sucesso!');
      }

      // Redirect to the page user was trying to access, or based on role
      const redirect = router.query.redirect as string;
      if (redirect) {
        router.push(redirect);
      } else if (loggedUser?.role === 'ADMIN' || loggedUser?.role === 'ORGANIZER') {
        router.push('/admin');
      } else {
        router.push('/events');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Login - Lumera</title></Head>
      <main className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <header className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-lumera rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow" aria-hidden="true">
              <span className="text-white font-bold text-3xl">L</span>
            </div>
            <h1 className="text-3xl font-bold text-lumera-obsidian">Bem-vindo de volta!</h1>
            <p className="text-gray-600 mt-2">Entre com sua conta para continuar</p>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-4" aria-label="Formulário de login">
            <Input
              label="Email"
              type="email"
              {...register('email', { required: 'Email obrigatório' })}
              error={errors.email?.message}
              aria-required="true"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            <Input
              label="Senha"
              type="password"
              {...register('password', { required: 'Senha obrigatória' })}
              error={errors.password?.message}
              aria-required="true"
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />

            <div className="text-right">
              <Link href="/auth/forgot-password" className="text-sm text-primary-500 hover:text-primary-600 hover:underline">
                Esqueci minha senha
              </Link>
            </div>

            <Button type="submit" className="w-full" isLoading={loading} aria-label={loading ? 'Entrando...' : 'Entrar na conta'}>
              Entrar
            </Button>

            <p className="text-center text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link href="/auth/register" className="text-primary-500 hover:text-primary-600 hover:underline font-medium">
                Criar conta
              </Link>
            </p>
          </form>
        </div>
      </main>
    </>
  );
}
