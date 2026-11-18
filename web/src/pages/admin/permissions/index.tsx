import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { permissionsApi, type Permission, type UserWithPermissions } from '@/services/api';
import { Button } from '@/components/common/Button';

const roleLabels: Record<string, string> = {
  USER: 'Usuário',
  ADMIN: 'Admin',
  ORGANIZER: 'Organizador',
};

const roleColors: Record<string, string> = {
  USER: 'bg-lumera-surface-alt text-lumera-luminoso',
  ADMIN: 'bg-purple-500/20 text-purple-300',
  ORGANIZER: 'bg-blue-500/20 text-blue-300',
};

const moduleLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  events: 'Eventos',
  venues: 'Locais',
  tickets: 'Ingressos',
  orders: 'Pedidos',
  checkin: 'Check-in',
  finance: 'Financeiro',
  users: 'Usuários',
  permissions: 'Permissões',
  settings: 'Configurações',
};

export default function AdminPermissionsPage() {
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  // Modal state
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Migration state
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [page, role]);

  const loadPermissions = async () => {
    try {
      const data = await permissionsApi.getPermissionsByModule();
      setPermissions(data);
    } catch (error: any) {
      console.error('Failed to load permissions:', error);
      // Se der erro 500, provavelmente as tabelas não existem ainda
      if (error.response?.status === 500) {
        toast.error('Tabelas de permissões não encontradas. Execute a migração.');
      }
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await permissionsApi.getUsersWithPermissions({
        page,
        limit: 20,
        search: search || undefined,
        role: role || undefined,
      });
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error: any) {
      toast.error('Erro ao carregar usuários');
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleRunMigration = async () => {
    if (!confirm('Isso irá criar as tabelas de permissões no banco de dados. Continuar?')) return;

    try {
      setMigrating(true);
      await permissionsApi.runMigration();
      toast.success('Migração executada com sucesso!');
      loadPermissions();
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao executar migração');
    } finally {
      setMigrating(false);
    }
  };

  const openEditModal = (user: UserWithPermissions) => {
    setSelectedUser(user);
    setSelectedPermissions(user.permissions.map((p) => p.id));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setSelectedPermissions([]);
    setIsModalOpen(false);
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleModule = (modulePermissions: Permission[]) => {
    const moduleIds = modulePermissions.map((p) => p.id);
    const allSelected = moduleIds.every((id) => selectedPermissions.includes(id));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !moduleIds.includes(id)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...moduleIds])]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      await permissionsApi.setUserPermissions(selectedUser.id, selectedPermissions);
      toast.success('Permissões atualizadas com sucesso!');
      loadUsers();
      closeModal();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar permissões');
    } finally {
      setSaving(false);
    }
  };

  const getAllPermissionIds = (): string[] => {
    return Object.values(permissions).flat().map((p) => p.id);
  };

  const selectAllPermissions = () => {
    setSelectedPermissions(getAllPermissionIds());
  };

  const clearAllPermissions = () => {
    setSelectedPermissions([]);
  };

  return (
    <>
      <Head>
        <title>Gerenciar Permissões | Admin</title>
      </Head>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-lumera-luminoso">Permissões</h1>
            <p className="text-lumera-muted mt-1">
              Gerencie as permissões de acesso dos usuários ({total} usuários)
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button
              variant="outline"
              onClick={handleRunMigration}
              disabled={migrating}
            >
              {migrating ? 'Executando...' : 'Executar Migração'}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 sm:p-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todos os perfis</option>
              <option value="ADMIN">Admin</option>
              <option value="ORGANIZER">Organizador</option>
              <option value="USER">Usuário</option>
            </select>
            <Button type="submit">Buscar</Button>
          </form>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-lumera-muted">
              Nenhum usuário encontrado
            </div>
          ) : (
            <table className="min-w-full divide-y divide-lumera-border">
              <thead className="bg-lumera-obsidian">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-lumera-muted uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-lumera-muted uppercase tracking-wider">
                    Perfil
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-lumera-muted uppercase tracking-wider">
                    Permissões
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-lumera-muted uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-lumera-surface divide-y divide-lumera-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-primary-500/10">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-lumera-luminoso">
                          {user.name}
                        </div>
                        <div className="text-sm text-lumera-muted">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          roleColors[user.role] || 'bg-lumera-surface-alt text-lumera-luminoso'
                        }`}
                      >
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {user.permissions.length === 0 ? (
                          <span className="text-sm text-lumera-muted">
                            Nenhuma permissão atribuída
                          </span>
                        ) : user.permissions.length > 5 ? (
                          <>
                            {user.permissions.slice(0, 3).map((p) => (
                              <span
                                key={p.id}
                                className="px-2 py-0.5 text-xs bg-lumera-surface-alt text-lumera-muted rounded"
                              >
                                {p.name}
                              </span>
                            ))}
                            <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded">
                              +{user.permissions.length - 3} mais
                            </span>
                          </>
                        ) : (
                          user.permissions.map((p) => (
                            <span
                              key={p.id}
                              className="px-2 py-0.5 text-xs bg-lumera-surface-alt text-lumera-muted rounded"
                            >
                              {p.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(user)}
                      >
                        Editar Permissões
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-lumera-surface px-4 py-3 border-t border-lumera-border flex items-center justify-between">
              <div className="text-sm text-lumera-muted">
                Mostrando {(page - 1) * 20 + 1} a {Math.min(page * 20, total)} de{' '}
                {total} usuários
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Permissions Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-lumera-surface rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-lumera-luminoso">
                    Editar Permissões
                  </h2>
                  <p className="text-sm text-lumera-muted mt-1">
                    {selectedUser.name} ({selectedUser.email})
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-lumera-muted hover:text-lumera-luminoso"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
              {/* Quick actions */}
              <div className="flex gap-2 mb-6">
                <Button variant="outline" size="sm" onClick={selectAllPermissions}>
                  Selecionar Todas
                </Button>
                <Button variant="outline" size="sm" onClick={clearAllPermissions}>
                  Limpar Todas
                </Button>
                <span className="text-sm text-lumera-muted ml-4 self-center">
                  {selectedPermissions.length} permissão(ões) selecionada(s)
                </span>
              </div>

              {/* Permissions by module */}
              <div className="space-y-6">
                {Object.entries(permissions).map(([module, modulePermissions]) => (
                  <div key={module} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lumera-luminoso">
                        {moduleLabels[module] || module}
                      </h3>
                      <button
                        type="button"
                        onClick={() => toggleModule(modulePermissions)}
                        className="text-sm text-purple-600 hover:text-purple-700"
                      >
                        {modulePermissions.every((p) =>
                          selectedPermissions.includes(p.id)
                        )
                          ? 'Desmarcar todas'
                          : 'Marcar todas'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 gap-3">
                      {modulePermissions.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-start gap-2 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-lumera-border rounded"
                          />
                          <div>
                            <span className="text-sm text-lumera-muted group-hover:text-lumera-luminoso">
                              {permission.name}
                            </span>
                            {permission.description && (
                              <p className="text-xs text-lumera-muted">
                                {permission.description}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-lumera-border bg-lumera-obsidian flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button onClick={handleSavePermissions} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Permissões'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
