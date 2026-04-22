import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../contexts/AuthContext';

const MENU_ACCESS_OPTIONS = [
  { route: '/home', label: 'Inicio' },
  { route: '/pcp/ordens', label: 'PCP - Ordens' },
  { route: '/pcp/acompanhamento', label: 'PCP - Acompanhamento' },
  { route: '/pcp/relatorios', label: 'PCP - Relatórios' },
  { route: '/projetos/espelhos', label: 'Projetos - Espelhos' },
  { route: '/projetos/cadastro', label: 'Projetos - Cadastro' },
  { route: '/users', label: 'Usuários - Gerenciar' },
  { route: '/users/acesso', label: 'Usuários - Acesso' },
  { route: '/settings', label: 'Configurações' },
];

export default function UsersManage() {
  const { listUsers, createManagedUser, updateUserAccess, currentUser, reloadCurrentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Create user modal
  const [showCreate, setShowCreate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  // Access modal
  const [showAccess, setShowAccess] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoutes, setSelectedRoutes] = useState(new Set());
  const [isSavingAccess, setIsSavingAccess] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listUsers();
      setUsers(data);
      setFiltered(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erro ao carregar usuários.');
    } finally {
      setIsLoading(false);
    }
  }, [listUsers]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) { setFiltered([...users]); return; }
    setFiltered(users.filter((u) =>
      u.name?.toLowerCase().includes(t) || u.email?.toLowerCase().includes(t)
    ));
  }, [searchTerm, users]);

  const formatDate = (d) => {
    if (!d) return '-';
    const p = new Date(d);
    if (isNaN(p)) return '-';
    return new Intl.DateTimeFormat('pt-BR').format(p);
  };

  const handleCreate = async () => {
    if (form.password !== form.confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await createManagedUser(form.name.trim(), form.email.trim(), form.password);
      if (res?.data?.user) {
        setUsers((prev) => [res.data.user, ...prev]);
        toast.success(res.message || 'Usuário criado com sucesso!');
        setShowCreate(false);
        setForm({ name: '', email: '', password: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erro ao criar usuário.');
    } finally {
      setIsSaving(false);
    }
  };

  const canCreate = form.name.trim().length > 0
    && form.email.trim().length > 0
    && form.password.length >= 6
    && form.password === form.confirmPassword
    && !isSaving;

  const openAccessModal = (user) => {
    setSelectedUser(user);
    setSelectedRoutes(new Set(user.menuAccess || []));
    setShowAccess(true);
  };

  const handleSaveAccess = async () => {
    if (!selectedUser || isSavingAccess) return;
    setIsSavingAccess(true);
    try {
      const res = await updateUserAccess(selectedUser.id, Array.from(selectedRoutes));
      const updated = res?.data?.user;
      if (updated) {
        setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
        if (currentUser?.id === updated.id) reloadCurrentUser();
      }
      toast.success(res?.message || 'Acessos atualizados!');
      setTimeout(() => setShowAccess(false), 500);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erro ao salvar acessos.');
    } finally {
      setIsSavingAccess(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Usuários</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gerencie usuários e permissões de acesso</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Usuário
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="w-full max-w-md px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-5">
            <TableSkeleton rows={6} cols={4} />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Nome', 'E-mail', 'Criado em', 'Acesso'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => openAccessModal(user)}
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 text-xs font-bold">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-slate-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    {user.menuAccess?.length ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        {user.menuAccess.length} rota(s)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs">
                        Acesso total
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!filtered.length && !isLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-400 text-sm">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create User Modal */}
      <Modal
        open={showCreate}
        onClose={() => !isSaving && setShowCreate(false)}
        title="Novo Usuário"
        size="sm"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} disabled={isSaving} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={!canCreate}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Criar
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {[
            { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome completo' },
            { key: 'email', label: 'E-mail', type: 'email', placeholder: 'usuario@email.com' },
            { key: 'password', label: 'Senha', type: 'password', placeholder: '••••••••' },
            { key: 'confirmPassword', label: 'Confirmar Senha', type: 'password', placeholder: '••••••••' },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
              <input
                type={f.type}
                value={form[f.key]}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
              />
            </div>
          ))}
          {form.password && form.confirmPassword && form.password !== form.confirmPassword && (
            <p className="text-red-500 text-xs">As senhas não coincidem.</p>
          )}
        </div>
      </Modal>

      {/* Access Modal */}
      <Modal
        open={showAccess}
        onClose={() => !isSavingAccess && setShowAccess(false)}
        title={`Permissões — ${selectedUser?.name}`}
        size="sm"
        footer={
          <>
            <button onClick={() => setShowAccess(false)} disabled={isSavingAccess} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button
              onClick={handleSaveAccess}
              disabled={isSavingAccess}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSavingAccess && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Salvar
            </button>
          </>
        }
      >
        <div>
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setSelectedRoutes(new Set(MENU_ACCESS_OPTIONS.map((o) => o.route)))}
              className="text-xs text-blue-600 hover:underline"
            >
              Marcar todos
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => setSelectedRoutes(new Set())}
              className="text-xs text-slate-500 hover:underline"
            >
              Limpar todos
            </button>
          </div>
          <div className="space-y-2">
            {MENU_ACCESS_OPTIONS.map((opt) => (
              <label key={opt.route} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRoutes.has(opt.route)}
                  onChange={(e) => {
                    const next = new Set(selectedRoutes);
                    e.target.checked ? next.add(opt.route) : next.delete(opt.route);
                    setSelectedRoutes(next);
                  }}
                  className="w-4 h-4 accent-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-slate-700">{opt.label}</p>
                  <p className="text-xs text-slate-400 font-mono">{opt.route}</p>
                </div>
              </label>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400">
            {selectedRoutes.size === 0
              ? 'Nenhum acesso restrito — o usuário vê todos os menus.'
              : `${selectedRoutes.size} rota(s) liberada(s).`}
          </p>
        </div>
      </Modal>
    </div>
  );
}
