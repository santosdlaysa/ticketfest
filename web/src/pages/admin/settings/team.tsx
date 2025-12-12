import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { companyApi, TeamMember, TeamMembersResponse } from '@/services/api';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  OWNER: { label: 'Proprietário', color: 'bg-purple-100 text-purple-800' },
  ADMIN: { label: 'Administrador', color: 'bg-blue-100 text-blue-800' },
  MANAGER: { label: 'Gerente', color: 'bg-green-100 text-green-800' },
  MEMBER: { label: 'Membro', color: 'bg-gray-100 text-gray-800' },
};

interface InviteForm {
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
}

export default function TeamSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TeamMembersResponse | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteForm>({
    defaultValues: { role: 'MEMBER' },
  });

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const result = await companyApi.getTeam();
      setData(result);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('Erro ao carregar equipe');
      }
    } finally {
      setLoading(false);
    }
  };

  const onInvite = async (formData: InviteForm) => {
    try {
      setInviting(true);
      await companyApi.inviteMember({
        email: formData.email,
        role: formData.role,
      });
      toast.success('Convite enviado com sucesso!');
      setShowInviteModal(false);
      reset();
      loadTeam();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao enviar convite');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId: string, memberName: string) => {
    if (!confirm(`Tem certeza que deseja remover ${memberName} da equipe?`)) {
      return;
    }

    try {
      setRemovingId(memberId);
      await companyApi.removeMember(memberId);
      toast.success('Membro removido com sucesso');
      loadTeam();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao remover membro');
    } finally {
      setRemovingId(null);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await companyApi.updateMember(memberId, { role: newRole });
      toast.success('Permissão atualizada');
      loadTeam();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar permissão');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Head><title>Equipe - Lumera</title></Head>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  const allMembers = [...(data?.members || []), ...(data?.pendingInvites || [])];

  return (
    <AdminLayout>
      <Head>
        <title>Equipe - Lumera</title>
      </Head>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Equipe</h1>
              <p className="text-gray-600 mt-2">
                Gerencie os membros da sua equipe e suas permissões
              </p>
            </div>
            <Button onClick={() => setShowInviteModal(true)}>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Convidar Membro
            </Button>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card p-4">
            <div className="text-2xl font-bold text-primary-600">{data?.totalMembers || 0}</div>
            <div className="text-sm text-gray-600">Membros Ativos</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold text-yellow-600">{data?.pendingInvites?.length || 0}</div>
            <div className="text-sm text-gray-600">Convites Pendentes</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold text-gray-600">{allMembers.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>

        {/* Team List */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membro
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {allMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    Nenhum membro na equipe. Convide alguém para começar!
                  </td>
                </tr>
              ) : (
                allMembers.map((member) => {
                  const roleInfo = ROLE_LABELS[member.role] || ROLE_LABELS.MEMBER;

                  return (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-700 font-medium">
                              {member.userName?.charAt(0).toUpperCase() || member.userEmail?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {member.isAccepted ? member.userName : 'Convite Pendente'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.userEmail || member.invitedEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {member.role === 'OWNER' ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                            {roleInfo.label}
                          </span>
                        ) : (
                          <select
                            className="text-sm border rounded px-2 py-1"
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          >
                            <option value="ADMIN">Administrador</option>
                            <option value="MANAGER">Gerente</option>
                            <option value="MEMBER">Membro</option>
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {member.isAccepted ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Ativo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-yellow-600 text-sm">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {member.role !== 'OWNER' && (
                          <button
                            onClick={() => handleRemove(member.id, member.userName || member.userEmail)}
                            disabled={removingId === member.id}
                            className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                          >
                            {removingId === member.id ? 'Removendo...' : 'Remover'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Convidar Membro</h2>
            <form onSubmit={handleSubmit(onInvite)} className="space-y-4">
              <Input
                label="Email *"
                type="email"
                placeholder="email@exemplo.com"
                error={errors.email?.message}
                {...register('email', {
                  required: 'Email é obrigatório',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido',
                  },
                })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Função *
                </label>
                <select className="input w-full" {...register('role')}>
                  <option value="MEMBER">Membro</option>
                  <option value="MANAGER">Gerente</option>
                  <option value="ADMIN">Administrador</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Administradores têm acesso total. Gerentes podem gerenciar eventos. Membros têm acesso limitado.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowInviteModal(false);
                    reset();
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" isLoading={inviting} className="flex-1">
                  Enviar Convite
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
