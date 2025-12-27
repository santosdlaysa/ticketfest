import React, { useState } from 'react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { UserLayout } from '@/components/layout/UserLayout';
import { useAuthStore } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { authApi } from '@/services/api';

export default function UserSettingsPage() {
  const { logout } = useAuthStore();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    emailEvents: true,
    emailOrders: true,
    emailMarketing: false,
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('As senhas nao coincidem');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoadingPassword(true);
    try {
      await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Senha alterada com sucesso!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao alterar senha');
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
    // TODO: Save to API
    toast.success('Preferencias atualizadas');
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <UserLayout>
      <Head>
        <title>Configuracoes - Lumera</title>
      </Head>

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuracoes</h1>
          <p className="text-gray-600">Gerencie suas preferencias e seguranca da conta</p>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alterar Senha</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha Atual
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                required
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nova Senha
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                required
                className="input w-full"
              />
            </div>
            <Button type="submit" variant="primary" disabled={loadingPassword}>
              {loadingPassword ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </form>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notificacoes por E-mail</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900">Atualizacoes de Eventos</p>
                <p className="text-sm text-gray-500">Receba avisos sobre eventos de seu interesse</p>
              </div>
              <button
                type="button"
                onClick={() => handleNotificationChange('emailEvents')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.emailEvents ? 'bg-primary-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.emailEvents ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between py-2 border-t">
              <div>
                <p className="font-medium text-gray-900">Status de Pedidos</p>
                <p className="text-sm text-gray-500">Receba atualizacoes sobre suas compras</p>
              </div>
              <button
                type="button"
                onClick={() => handleNotificationChange('emailOrders')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.emailOrders ? 'bg-primary-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.emailOrders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between py-2 border-t">
              <div>
                <p className="font-medium text-gray-900">Promocoes e Novidades</p>
                <p className="text-sm text-gray-500">Receba ofertas exclusivas e lancamentos</p>
              </div>
              <button
                type="button"
                onClick={() => handleNotificationChange('emailMarketing')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.emailMarketing ? 'bg-primary-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.emailMarketing ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-red-200">
          <h2 className="text-lg font-semibold text-red-600 mb-4">Zona de Perigo</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Sair da Conta</p>
                <p className="text-sm text-gray-500">Encerre sua sessao neste dispositivo</p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Sair
              </Button>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="font-medium text-gray-900">Excluir Conta</p>
                <p className="text-sm text-gray-500">Remova permanentemente sua conta e todos os dados</p>
              </div>
              <button
                disabled
                className="px-4 py-2 bg-red-500 text-white rounded-lg opacity-50 cursor-not-allowed"
              >
                Excluir Conta
              </button>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
