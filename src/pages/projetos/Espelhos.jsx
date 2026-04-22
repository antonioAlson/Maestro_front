import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { getJiraIssues, gerarEspelhos, obterLogsEspelhos } from '../../services/jiraService';

function normalizeStatus(status) {
  return String(status || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/\s+/g, ' ').trim().toLowerCase();
}

function isStatusValido(status) {
  const n = normalizeStatus(status);
  return n === 'a produzir' || n.includes('a produzir')
    || n === 'recebido nao liberado' || (n.includes('recebido') && n.includes('nao liberado'));
}

function getOsNumber(resumo) {
  const match = String(resumo || '').match(/(\d{3,10})/g);
  return match ? match[match.length - 1] : '-';
}

export default function ProjetosEspelhos() {
  const [activeTab, setActiveTab] = useState('aramida');
  const [allItems, setAllItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [markedIds, setMarkedIds] = useState(new Set());
  const [selectedFiles, setSelectedFiles] = useState({});

  // Logs modal
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Quantity modal
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [pendingCardId, setPendingCardId] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [qty, setQty] = useState('');
  const [qtyTampas, setQtyTampas] = useState('');
  const [consumo, setConsumo] = useState({ c8: '', c9: '', c11: '' });
  const [isGenerating, setIsGenerating] = useState(false);

  const carregarCards = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await getJiraIssues(false, { mantaBoard: 'CARBON OPACO' });
      if (!res?.success || !Array.isArray(res.data)) {
        setLoadError('Não foi possível carregar dados do Jira.');
        setAllItems([]);
        return;
      }
      const filtered = res.data
        .filter((i) => isStatusValido(i?.status))
        .map((i) => ({
          id: String(i.key || '').trim(),
          resumo: String(i.resumo || '').trim() || '-',
          veiculo: String(i.veiculo || '').trim() || '-',
          previsao: String(i.previsao || '').trim() || '-',
          numeroProjeto: String(i.numeroProjeto || '').trim() || '-',
        }));
      setAllItems(filtered);
    } catch (err) {
      setLoadError(err?.response?.data?.message || 'Erro ao carregar cards.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { carregarCards(); }, [carregarCards]);

  const displayedItems = useMemo(() => {
    let list = allItems;
    if (activeTab === 'tensylon') {
      list = list.filter((i) => i.id.toUpperCase().startsWith('TENSYLON-'));
    } else {
      list = list.filter((i) => !i.id.toUpperCase().startsWith('TENSYLON-'));
    }
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      list = list.filter((i) =>
        i.id.toLowerCase().includes(t) ||
        i.resumo.toLowerCase().includes(t) ||
        i.veiculo.toLowerCase().includes(t)
      );
    }
    return list;
  }, [allItems, activeTab, searchTerm]);

  const handleFileSelect = (cardId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;
      setPendingCardId(cardId);
      setPendingFiles(files);
      setQty('');
      setQtyTampas('');
      setConsumo({ c8: '', c9: '', c11: '' });
      setShowQtyModal(true);
    };
    input.click();
  };

  const handleGerarEspelhos = async () => {
    if (!pendingCardId || !qty) return;
    setIsGenerating(true);
    try {
      await gerarEspelhos(
        pendingCardId,
        pendingFiles,
        Number(qty),
        activeTab === 'aramida' && qtyTampas ? Number(qtyTampas) : null,
        consumo
      );
      toast.success(`Espelhos gerados para ${pendingCardId}!`);
      setMarkedIds((prev) => new Set([...prev, pendingCardId]));
      setShowQtyModal(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erro ao gerar espelhos.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadLogs = async () => {
    setIsLoadingLogs(true);
    setLogs([]);
    setShowLogs(true);
    try {
      const res = await obterLogsEspelhos();
      setLogs(res?.data || []);
    } catch {
      toast.error('Erro ao carregar logs.');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projetos - Espelhos</h1>
          <p className="text-slate-500 text-sm mt-0.5">Geração de espelhos de projetos via Jira</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={carregarCards}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Recarregar
          </button>
          <button
            onClick={handleLoadLogs}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Histórico
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-5 w-fit">
        {[
          { key: 'aramida', label: 'Aramida' },
          { key: 'tensylon', label: 'Tensylon' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por ID, resumo, veículo..."
          className="w-full max-w-md px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : loadError ? (
        <div className="text-center py-12 text-red-500">{loadError}</div>
      ) : displayedItems.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          Nenhum card com status "A Produzir" ou "Recebido Não liberado".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedItems.map((item) => {
            const os = getOsNumber(item.resumo);
            const marked = markedIds.has(item.id);
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${
                  marked ? 'border-emerald-300 bg-emerald-50' : 'border-slate-100 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {item.id}
                  </span>
                  {marked && (
                    <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-0.5">OS: <span className="font-semibold text-slate-700">{os}</span></p>
                <p className="text-xs text-slate-500 mb-0.5 truncate">{item.veiculo}</p>
                <p className="text-xs text-slate-400 mb-3">Previsão: {item.previsao}</p>
                <button
                  onClick={() => handleFileSelect(item.id)}
                  className="w-full py-2 rounded-xl text-xs font-medium transition-colors bg-slate-900 hover:bg-slate-700 text-white flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Selecionar PDF(s)
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Quantity Modal */}
      <Modal
        open={showQtyModal}
        onClose={() => !isGenerating && setShowQtyModal(false)}
        title={`Configurar Espelho — ${pendingCardId}`}
        size="sm"
        footer={
          <>
            <button onClick={() => setShowQtyModal(false)} disabled={isGenerating} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button
              onClick={handleGerarEspelhos}
              disabled={isGenerating || !qty}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isGenerating && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Gerar Espelho
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="text-sm text-slate-500 bg-slate-50 rounded-xl p-3">
            {pendingFiles.length} arquivo(s) selecionado(s)
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Quantidade de Peças <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="Ex: 10"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {activeTab === 'aramida' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantidade de Tampas</label>
              <input
                type="number"
                min={0}
                value={qtyTampas}
                onChange={(e) => setQtyTampas(e.target.value)}
                placeholder="Ex: 5"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Consumo (opcional)</label>
            <div className="grid grid-cols-3 gap-2">
              {['c8', 'c9', 'c11'].map((k) => (
                <div key={k}>
                  <label className="block text-xs text-slate-500 mb-1">{k.replace('c', '')}C</label>
                  <input
                    type="text"
                    value={consumo[k]}
                    onChange={(e) => setConsumo((p) => ({ ...p, [k]: e.target.value }))}
                    placeholder="0"
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Logs Modal */}
      <Modal
        open={showLogs}
        onClose={() => setShowLogs(false)}
        title="Histórico de Espelhos"
        size="lg"
      >
        {isLoadingLogs ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-slate-400 py-8">Nenhum registro encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {['Card', 'Ordem', 'Título', 'Usuário', 'Status', 'Data'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-xs text-blue-600">{log.card_id}</td>
                    <td className="px-3 py-2 text-xs">{log.numero_ordem}</td>
                    <td className="px-3 py-2 text-xs text-slate-600 truncate max-w-xs">{log.titulo}</td>
                    <td className="px-3 py-2 text-xs text-slate-500">{log.usuario_nome}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        log.status === 'concluido' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400">{formatDate(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
