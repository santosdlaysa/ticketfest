import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const router = useRouter();
  const { register: authRegister } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      await authRegister({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      toast.success('Conta criada com sucesso!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Criar Conta - Lumera</title></Head>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Criar Conta</h1>
            <p className="text-gray-600 mt-2">Crie sua conta gratuitamente</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-4">
            <Input
              label="Nome Completo"
              {...register('name', { required: 'Nome obrigatório' })}
              error={errors.name?.message}
            />
            <Input
              label="Email"
              type="email"
              {...register('email', { required: 'Email obrigatório' })}
              error={errors.email?.message}
            />
            <Input
              label="Senha"
              type="password"
              {...register('password', {
                required: 'Senha obrigatória',
                minLength: { value: 8, message: 'Mínimo 8 caracteres' },
              })}
              error={errors.password?.message}
            />
            <Input
              label="Confirmar Senha"
              type="password"
              {...register('confirmPassword', { required: 'Confirme a senha' })}
              error={errors.confirmPassword?.message}
            />

            <Button type="submit" className="w-full" isLoading={loading}>
              Criar Conta
            </Button>

            <p className="text-center text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link href="/auth/login" className="text-primary-600 hover:underline">
                Fazer login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
