import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { adminApi } from '@/services/api';
import { Button } from '@/components/common/Button';
import { ProtectedPage } from '@/components/common/ProtectedPage';
import { Pagination } from '@/components/common/Pagination';
import { PERMISSION_CODES } from '@/hooks/usePermissions';
import { useAuthStore } from '@/contexts/AuthContext';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: 'USER' | 'ADMIN' | 'ORGANIZER' | 'PROMOTER';
  ordersCount: number;
  createdAt: string;
  updatedAt?: string;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ROLES = [
  { value: 'USER', label: 'Usuario', color: 'bg-gray-100 text-gray-700' },
  { value: 'ORGANIZER', label: 'Organizador', color: 'bg-blue-100 text-blue-700' },
  { value: 'PROMOTER', label: 'Promoter', color: 'bg-purple-100 text-purple-700' },
  { value: 'ADMIN', label: 'Administrador', color: 'bg-red-100 text-red-700' },
];

export default function AdminUsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response: UsersResponse = await adminApi.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        role: roleFilter || undefined,
      });
      setUsers(response.users);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      }));
    } catch (error: any) {
      toast.error('Erro ao carregar usuarios');
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === currentUser?.id) {
      toast.error('Voce nao pode alterar seu proprio role');
      return;
    }

    try {
      setUpdating(userId);
      await adminApi.updateUserRole(userId, newRole as 'USER' | 'ADMIN' | 'ORGANIZER' | 'PROMOTER');
      toast.success('Role atualizado com sucesso');

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: newRole as User['role'] } : u
        )
      );
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar role');
      console.error('Failed to update user role:', error);
    } finally {
      setUpdating(null);
    }
  };

  const getRoleInfo = (role: string) => {
    return ROLES.find((r) => r.value === role) || ROLES[0];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <ProtectedPage permission={PERMISSION_CODES.USERS_MANAGE} pageTitle="Gerenciar Usuarios">
      <Head>
        <title>Gerenciar Usuarios - Lumera</title>
      </Head>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuarios</h1>
            <p className="text-gray-600 mt-1">Altere as permissoes dos usuarios da plataforma</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Nome ou email do usuario..."
                  className="input flex-1"
                />
                <Button type="submit" variant="primary">
                  Buscar
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Role</label>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="input w-full"
              >
                <option value="">Todos os roles</option>
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Carregando usuarios...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nenhum usuario encontrado
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Telefone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pedidos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Criado em
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => {
                      const roleInfo = getRoleInfo(user.role);
                      const isCurrentUser = user.id === currentUser?.id;

                      return (
                        <tr key={user.id} className={isCurrentUser ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="text-primary-700 font-medium">
                                  {user.name?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                  {user.name}
                                  {isCurrentUser && (
                                    <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                                      Voce
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.phone || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.ordersCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isCurrentUser ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                                {roleInfo.label}
                              </span>
                            ) : (
                              <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                disabled={updating === user.id}
                                className={`text-sm border rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                  updating === user.id ? 'opacity-50 cursor-wait' : ''
                                }`}
                              >
                                {ROLES.map((role) => (
                                  <option key={role.value} value={role.value}>
                                    {role.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                    showingFrom={(pagination.page - 1) * pagination.limit + 1}
                    showingTo={Math.min(pagination.page * pagination.limit, pagination.total)}
                    onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Help text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Sobre os Roles</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li><strong>Usuario:</strong> Acesso apenas ao site publico, pode comprar ingressos</li>
            <li><strong>Organizador:</strong> Pode criar e gerenciar eventos, ver relatorios de vendas</li>
            <li><strong>Promoter:</strong> Pode promover eventos e acompanhar vendas</li>
            <li><strong>Administrador:</strong> Acesso total ao sistema, pode gerenciar usuarios</li>
          </ul>
        </div>
      </div>
    </ProtectedPage>
  );
}
