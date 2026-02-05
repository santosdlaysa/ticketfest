import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { UserLayout } from '@/components/layout/UserLayout';
import { useAuthStore } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';

export default function UserProfilePage() {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        cpf: user.cpf || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implement update profile API
      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { label: string; className: string }> = {
      USER: { label: 'Cliente', className: 'bg-lumera-surface-alt text-lumera-muted' },
      ORGANIZER: { label: 'Organizador', className: 'bg-primary-500/20 text-primary-300' },
      ADMIN: { label: 'Administrador', className: 'bg-red-500/20 text-red-400' },
    };
    const roleInfo = roles[role] || roles.USER;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleInfo.className}`}>
        {roleInfo.label}
      </span>
    );
  };

  return (
    <UserLayout>
      <Head>
        <title>Meu Perfil - Lumera</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-lumera-surface rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center">
                <span className="text-primary-300 font-bold text-2xl">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-lumera-luminoso">{user?.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lumera-muted">{user?.email}</span>
                  {user?.role && getRoleBadge(user.role)}
                </div>
              </div>
            </div>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Editar Perfil
              </Button>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-lumera-surface rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-lumera-luminoso mb-4">Informacoes Pessoais</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-lumera-muted mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="input w-full disabled:bg-lumera-obsidian disabled:text-lumera-muted"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-lumera-muted mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="input w-full bg-lumera-obsidian text-lumera-muted cursor-not-allowed"
                />
                <p className="text-xs text-lumera-muted mt-1">O e-mail nao pode ser alterado</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-lumera-muted mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="(00) 00000-0000"
                  className="input w-full disabled:bg-lumera-obsidian disabled:text-lumera-muted"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-lumera-muted mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="000.000.000-00"
                  className="input w-full disabled:bg-lumera-obsidian disabled:text-lumera-muted"
                />
                <p className="text-xs text-lumera-muted mt-1">Necessario para compras via PIX ou Boleto</p>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Alteracoes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    if (user) {
                      setFormData({
                        name: user.name || '',
                        email: user.email || '',
                        phone: user.phone || '',
                        cpf: user.cpf || '',
                      });
                    }
                  }}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* Account Info */}
        <div className="bg-lumera-surface rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-lumera-luminoso mb-4">Informacoes da Conta</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-lumera-muted">Membro desde</span>
              <span className="font-medium text-lumera-luminoso">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-lumera-muted">Tipo de conta</span>
              {user?.role && getRoleBadge(user.role)}
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
