import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  listarProjects,
  criarProject,
  obterProjectById,
  atualizarProject,
  clonarProject,
  excluirProject,
  obterMarcasUnicas,
} from '../../services/jiraService';

const MATERIAL_TYPES = ['ARAMIDA', 'TENSYLON'];

const EMPTY_FORM = {
  project: '', material_type: '', brand: '', model: '',
  spec_8c: '', spec_9c: '', spec_11c: '',
  metro_quadrado_8c: '', metro_quadrado_9c: '', metro_quadrado_11c: '',
  quantidade_placas_8c: 0, quantidade_placas_9c: 0, quantidade_placas_11c: 0,
  flag_corte: false, flag_mapa_kit: false, flag_relatorio_encaixe: false,
  flag_etiquetagem: false, flag_modelo_pastas: false,
  roof_config: '', total_parts_qty: 0, lid_parts_qty: 0,
  linear_meters: '',
};

export default function CadastroProjetos() {
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalProjetos, setTotalProjetos] = useState(0);
  const limite = 20;
  const [filtro, setFiltro] = useState('');
  const [campoOrdem, setCampoOrdem] = useState('id');
  const [ordem, setOrdem] = useState('DESC');
  const [marcas, setMarcas] = useState([]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('novo');
  const [projetoId, setProjetoId] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('geral');
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Context menu
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, projeto: null });

  // Confirm modal
  const [confirm, setConfirm] = useState({ open: false, titulo: '', mensagem: '', action: null });

  const filtroTimer = useRef(null);

  const carregarProjetos = useCallback(async (pg = pagina) => {
    setLoading(true);
    setError('');
    try {
      const res = await listarProjects({ page: pg, limit: limite, filtro, ordenarPor: campoOrdem, ordem });
      setProjetos(res?.data || []);
      setTotalPaginas(res?.pagination?.totalPages || 0);
      setTotalProjetos(res?.pagination?.totalItems || 0);
    } catch {
      setError('Erro ao carregar projetos.');
    } finally {
      setLoading(false);
    }
  }, [pagina, filtro, campoOrdem, ordem]);

  useEffect(() => { carregarProjetos(); }, [carregarProjetos]);

  useEffect(() => {
    obterMarcasUnicas().then(setMarcas).catch(() => { });
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (contextMenu.open && !e.target.closest('.context-menu')) {
        setContextMenu((p) => ({ ...p, open: false }));
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [contextMenu.open]);

  const handleFiltroChange = (v) => {
    setFiltro(v);
    setPagina(1);
  };

  const toggleOrdem = (col) => {
    if (campoOrdem === col) {
      setOrdem((o) => o === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setCampoOrdem(col);
      setOrdem('DESC');
    }
    setPagina(1);
  };

  const openModal = async (mode, projeto = null) => {
    setModalMode(mode);
    setAbaAtiva('geral');
    if (mode === 'novo') {
      setForm(EMPTY_FORM);
      setProjetoId(null);
    } else if (projeto) {
      setProjetoId(projeto.id);
      try {
        const res = await obterProjectById(projeto.id);
        const d = res?.data || projeto;
        setForm({
          project: d.project || '',
          material_type: d.material_type || '',
          brand: d.brand || '',
          model: d.model || '',
          spec_8c: d.spec_8c || '',
          spec_9c: d.spec_9c || '',
          spec_11c: d.spec_11c || '',
          metro_quadrado_8c: d.metro_quadrado_8c || '',
          metro_quadrado_9c: d.metro_quadrado_9c || '',
          metro_quadrado_11c: d.metro_quadrado_11c || '',
          quantidade_placas_8c: d.quantidade_placas_8c || 0,
          quantidade_placas_9c: d.quantidade_placas_9c || 0,
          quantidade_placas_11c: d.quantidade_placas_11c || 0,
          flag_corte: !!d.reviews?.cutting,
          flag_mapa_kit: !!d.reviews?.ki_Layout,
          flag_relatorio_encaixe: !!d.reviews?.nesting_report,
          flag_etiquetagem: !!d.reviews?.labeling,
          flag_modelo_pastas: !!d.reviews?.folder_template,
          roof_config: d.roof_config || '',
          total_parts_qty: d.total_parts_qty || 0,
          lid_parts_qty: d.lid_parts_qty || 0,
          linear_meters: d.linear_meters || '',
        });
      } catch {
        toast.error('Erro ao carregar projeto.');
        return;
      }
    }
    setShowModal(true);
  };

  const buildPayload = () => {
    const { flag_corte, flag_mapa_kit, flag_relatorio_encaixe, flag_etiquetagem, flag_modelo_pastas, ...rest } = form;
    return {
      ...rest,
      reviews: {
        cutting: flag_corte,
        ki_Layout: flag_mapa_kit,
        nesting_report: flag_relatorio_encaixe,
        labeling: flag_etiquetagem,
        folder_template: flag_modelo_pastas,
      },
    };
  };

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      const payload = buildPayload();
      if (modalMode === 'novo' || modalMode === 'clonar') {
        await criarProject(payload);
        toast.success('Projeto criado com sucesso!');
      } else if (modalMode === 'editar') {
        await atualizarProject(projetoId, payload);
        toast.success('Projeto atualizado!');
      }
      setShowModal(false);
      carregarProjetos(1);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erro ao salvar projeto.');
    } finally {
      setSalvando(false);
    }
  };

  const handleClonar = async (projeto) => {
    try {
      await clonarProject(projeto.id);
      toast.success('Projeto clonado!');
      carregarProjetos();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erro ao clonar.');
    }
  };

  const handleExcluir = (projeto) => {
    setConfirm({
      open: true,
      titulo: 'Excluir Projeto',
      mensagem: `Deseja excluir o projeto "${projeto.project}"? Esta ação não pode ser desfeita.`,
      action: async () => {
        try {
          await excluirProject(projeto.id);
          toast.success('Projeto excluído.');
          carregarProjetos();
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Erro ao excluir.');
        }
        setConfirm((p) => ({ ...p, open: false }));
      },
    });
  };

  const openContextMenu = (e, projeto) => {
    e.preventDefault();
    setContextMenu({ open: true, x: e.clientX, y: e.clientY, projeto });
  };

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const modalTitle = {
    novo: 'Novo Cadastro de Projeto',
    editar: 'Editar Projeto',
    visualizar: 'Visualizar Projeto',
    clonar: 'Clonar Projeto',
  }[modalMode] || 'Projeto';

  const readonly = modalMode === 'visualizar';

  const SortIcon = ({ col }) => (
    <svg className="w-3.5 h-3.5 ml-1 inline text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {campoOrdem === col && ordem === 'ASC'
        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        : campoOrdem === col && ordem === 'DESC'
          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      }
    </svg>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projetos - Cadastro</h1>
          <p className="text-slate-500 text-sm mt-0.5">{totalProjetos} projeto(s) cadastrado(s)</p>
        </div>
        <button
          onClick={() => openModal('novo')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Projeto
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4">
        <input
          type="text"
          value={filtro}
          onChange={(e) => handleFiltroChange(e.target.value)}
          placeholder="Buscar projeto, marca, modelo..."
          className="w-full max-w-md px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-5"><TableSkeleton rows={8} cols={5} /></div>
        ) : error ? (
          <div className="p-10 text-center text-red-500">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {[
                      { key: 'id', label: 'ID' },
                      { key: 'project', label: 'Projeto' },
                      { key: 'material_type', label: 'Material' },
                      { key: 'brand', label: 'Marca' },
                      { key: 'model', label: 'Modelo' },
                      { key: 'total_parts_qty', label: 'Qtd. Peças' },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => toggleOrdem(col.key)}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide cursor-pointer select-none hover:text-slate-800 transition-colors"
                      >
                        {col.label}<SortIcon col={col.key} />
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {projetos.map((p) => (
                    <tr
                      key={p.id}
                      onContextMenu={(e) => openContextMenu(e, p)}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-400 text-xs font-mono">#{p.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{p.project}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.material_type === 'ARAMIDA' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
                          }`}>
                          {p.material_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.brand}</td>
                      <td className="px-4 py-3 text-slate-600">{p.model}</td>
                      <td className="px-4 py-3 text-slate-700 font-semibold">{p.total_parts_qty}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openModal('visualizar', p)} title="Visualizar" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button onClick={() => openModal('editar', p)} title="Editar" className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => handleClonar(p)} title="Clonar" className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button onClick={() => handleExcluir(p)} title="Excluir" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!projetos.length && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">
                        Nenhum projeto encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Página {pagina} de {totalPaginas} ({totalProjetos} projetos)
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setPagina((p) => Math.max(1, p - 1)); }}
                    disabled={pagina <= 1}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => { setPagina((p) => Math.min(totalPaginas, p + 1)); }}
                    disabled={pagina >= totalPaginas}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Context menu */}
      {contextMenu.open && (
        <div
          className="fixed z-50 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {[
            { label: 'Visualizar', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z', action: () => { openModal('visualizar', contextMenu.projeto); setContextMenu((p) => ({ ...p, open: false })); } },
            { label: 'Editar', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', action: () => { openModal('editar', contextMenu.projeto); setContextMenu((p) => ({ ...p, open: false })); } },
            { label: 'Clonar', icon: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z', action: () => { handleClonar(contextMenu.projeto); setContextMenu((p) => ({ ...p, open: false })); } },
            { label: 'Excluir', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', action: () => { handleExcluir(contextMenu.projeto); setContextMenu((p) => ({ ...p, open: false })); }, danger: true },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'
                }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Project Modal */}
      <Modal
        open={showModal}
        onClose={() => !salvando && setShowModal(false)}
        title={modalTitle}
        size="lg"
        footer={readonly ? (
          <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            Fechar
          </button>
        ) : (
          <>
            <button onClick={() => setShowModal(false)} disabled={salvando} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {salvando && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {modalMode === 'editar' ? 'Salvar' : 'Criar'}
            </button>
          </>
        )}
      >
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5 w-fit">
          {[
            { key: 'geral', label: 'Geral' },
            { key: 'especificacao', label: 'Especificação' },
            { key: 'anexos', label: 'Anexos' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setAbaAtiva(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${abaAtiva === tab.key ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Geral */}
        {abaAtiva === 'geral' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'project', label: 'Nome do Projeto', type: 'text' },
              { key: 'roof_config', label: 'Configuração do Teto', type: 'text' },
              { key: 'model', label: 'Modelo', type: 'text' },
              { key: 'total_parts_qty', label: 'Qtd. Total de Peças', type: 'number' },
              { key: 'lid_parts_qty', label: 'Qtd. Tampas', type: 'number' },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={(e) => setField(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                  disabled={readonly}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de Material</label>
              <select
                value={form.material_type}
                onChange={(e) => setField('material_type', e.target.value)}
                disabled={readonly}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-50"
              >
                <option value="">Selecione...</option>
                {MATERIAL_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Marca</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setField('brand', e.target.value)}
                list="marcas-list"
                disabled={readonly}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-50"
              />
              <datalist id="marcas-list">
                {marcas.map((m) => <option key={m} value={m} />)}
              </datalist>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Flags</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'flag_corte', label: 'Corte' },
                  { key: 'flag_mapa_kit', label: 'Mapa Kit' },
                  { key: 'flag_relatorio_encaixe', label: 'Rel. Encaixe' },
                  { key: 'flag_etiquetagem', label: 'Etiquetagem' },
                  { key: 'flag_modelo_pastas', label: 'Modelo Pastas' },
                ].map((f) => (
                  <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[f.key]}
                      onChange={(e) => setField(f.key, e.target.checked)}
                      disabled={readonly}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <span className="text-sm text-slate-700">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Especificação */}
        {abaAtiva === 'especificacao' && (
          <div>
            {form.material_type === 'TENSYLON' ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Metro Linear</label>
                <input
                  type="text"
                  value={form.linear_meters}
                  onChange={(e) => setField('linear_meters', e.target.value)}
                  disabled={readonly}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-50"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { suffix: '8c', label: '8C' },
                  { suffix: '9c', label: '9C' },
                  { suffix: '11c', label: '11C' },
                ].map((s) => (
                  <div key={s.suffix} className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Spec {s.label} (mm)</label>
                      <input
                        type="text"
                        value={form[`spec_${s.suffix}`]}
                        onChange={(e) => setField(`spec_${s.suffix}`, e.target.value)}
                        disabled={readonly}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">m² {s.label}</label>
                      <input
                        type="text"
                        value={form[`metro_quadrado_${s.suffix}`]}
                        onChange={(e) => setField(`metro_quadrado_${s.suffix}`, e.target.value)}
                        disabled={readonly}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Qtd. Placas {s.label}</label>
                      <input
                        type="number"
                        value={form[`quantidade_placas_${s.suffix}`]}
                        onChange={(e) => setField(`quantidade_placas_${s.suffix}`, Number(e.target.value))}
                        disabled={readonly}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Anexos */}
        {abaAtiva === 'anexos' && (
          <div className="text-center py-12 text-slate-400">
            <svg className="w-10 h-10 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <p className="text-sm">Funcionalidade de anexos em desenvolvimento.</p>
          </div>
        )}
      </Modal>

      {/* Confirm Modal */}
      <Modal
        open={confirm.open}
        onClose={() => setConfirm((p) => ({ ...p, open: false }))}
        title={confirm.titulo}
        size="sm"
        footer={
          <>
            <button onClick={() => setConfirm((p) => ({ ...p, open: false }))} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              Cancelar
            </button>
            <button
              onClick={confirm.action}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
            >
              Confirmar
            </button>
          </>
        }
      >
        <p className="text-slate-600 text-sm">{confirm.mensagem}</p>
      </Modal>
    </div>
  );
}
