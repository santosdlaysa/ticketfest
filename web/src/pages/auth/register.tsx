import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { PasswordVisibilityToggle } from '@/components/common/PasswordVisibilityToggle';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      console.error('Register error:', error);
      console.error('Response:', error.response);
      console.error('Response data:', error.response?.data);
      console.error('Status:', error.response?.status);

      const responseData = error.response?.data;
      if (responseData?.details && Array.isArray(responseData.details)) {
        // Mostrar erros de validação específicos
        responseData.details.forEach((detail: { field: string; message: string }) => {
          toast.error(`${detail.field}: ${detail.message}`);
        });
      } else if (responseData?.error) {
        toast.error(responseData.error);
      } else if (error.response?.status) {
        toast.error(`Erro ${error.response.status}: ${error.message}`);
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Erro de conexão. Verifique se o servidor está rodando.');
      } else {
        toast.error('Erro ao criar conta');
      }
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
            <p className="text-lumera-muted mt-2">Crie sua conta gratuitamente</p>
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
            <div className="relative">
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                className="pr-12"
                {...register('password', {
                  required: 'Senha obrigatória',
                  minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                })}
                error={errors.password?.message}
              />
              <PasswordVisibilityToggle
                visible={showPassword}
                onToggle={() => setShowPassword((visible) => !visible)}
                label="a senha"
              />
            </div>
            <div className="relative">
              <Input
                label="Confirmar Senha"
                type={showConfirmPassword ? 'text' : 'password'}
                className="pr-12"
                {...register('confirmPassword', { required: 'Confirme a senha' })}
                error={errors.confirmPassword?.message}
              />
              <PasswordVisibilityToggle
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((visible) => !visible)}
                label="a confirmação da senha"
              />
            </div>

            <Button type="submit" className="w-full" isLoading={loading}>
              Criar Conta
            </Button>

            <p className="text-center text-sm text-lumera-muted">
              Já tem uma conta?{' '}
              <Link href="/auth/login" className="text-primary-400 hover:underline">
                Fazer login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
