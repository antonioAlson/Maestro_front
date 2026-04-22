import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  getJiraIssues,
  reprogramarEmMassa,
  reprogramarDatasComtec,
  atualizarDatasIndividuais,
  buscarArquivosPorIds,
  downloadPdfsAsZip,
} from '../../services/jiraService';

const DATE_MASK_RE = /^\d{2}\/\d{2}\/\d{4}$/;

function applyDateMask(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseCardIds(raw) {
  return Array.from(new Set(
    String(raw || '').split(/[,;\s\n]+/).map((id) => id.trim().toUpperCase()).filter(Boolean)
  ));
}

function filterAndSort(issues, searchTerm, columnFilters, sortConfig) {
  let result = [...issues];

  if (searchTerm) {
    const t = searchTerm.toLowerCase();
    result = result.filter((i) =>
      String(i.key).toLowerCase().includes(t) ||
      String(i.resumo).toLowerCase().includes(t) ||
      String(i.status).toLowerCase().includes(t) ||
      String(i.veiculo).toLowerCase().includes(t)
    );
  }

  if (columnFilters.status?.length) {
    result = result.filter((i) => columnFilters.status.includes(i.status));
  }
  if (columnFilters.situacao?.length) {
    result = result.filter((i) => columnFilters.situacao.includes(i.situacao));
  }
  if (columnFilters.previsao?.length) {
    result = result.filter((i) => {
      const hasDate = i.previsao && i.previsao !== '-' && i.previsao !== '';
      return columnFilters.previsao.includes(hasDate ? 'com-data' : 'sem-data');
    });
  }
  if (columnFilters.novaData?.length) {
    result = result.filter((i) => {
      const hasDate = i.novaData && i.novaData !== '';
      return columnFilters.novaData.includes(hasDate ? 'com-data' : 'sem-data');
    });
  }

  if (sortConfig.column && sortConfig.direction) {
    result.sort((a, b) => {
      const av = String(a[sortConfig.column] || '');
      const bv = String(b[sortConfig.column] || '');
      const cmp = av.localeCompare(bv, 'pt-BR');
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
  }

  return result;
}

export default function OrdensProducao() {
  // Reprogramar em massa
  const [showReprogramModal, setShowReprogramModal] = useState(false);
  const [idsInput, setIdsInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Download OPs
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printIdsInput, setPrintIdsInput] = useState('');
  const [foundFiles, setFoundFiles] = useState([]);
  const [isSearchingFiles, setIsSearchingFiles] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [totalFilesToDownload, setTotalFilesToDownload] = useState(0);

  // Alterar datas individuais
  const [showAlterarDatasModal, setShowAlterarDatasModal] = useState(false);
  const [issues, setIssues] = useState([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ column: '', direction: '' });
  const [columnFilters, setColumnFilters] = useState({ status: [], situacao: [], previsao: [], novaData: [] });
  const [activeFilterMenu, setActiveFilterMenu] = useState('');
  const [filterMenuPos, setFilterMenuPos] = useState({ top: 0, left: 0 });

  // Reprogramar CONTEC
  const [showContecConfirm, setShowContecConfirm] = useState(false);

  const parsedIdsCount = useMemo(() => parseCardIds(idsInput).length, [idsInput]);
  const parsedPrintCount = useMemo(() => parseCardIds(printIdsInput).length, [printIdsInput]);
  const dateIsValid = DATE_MASK_RE.test(dateInput) || dateInput === '00/00/0000' || dateInput === '';

  const filteredIssues = useMemo(
    () => filterAndSort(issues, searchTerm, columnFilters, sortConfig),
    [issues, searchTerm, columnFilters, sortConfig]
  );

  const statusOptions = useMemo(() => [...new Set(issues.map((i) => i.status).filter(Boolean))], [issues]);
  const situacaoOptions = useMemo(() => [...new Set(issues.map((i) => i.situacao).filter(Boolean))], [issues]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setShowReprogramModal(false);
        setShowPrintModal(false);
        setShowAlterarDatasModal(false);
        setShowContecConfirm(false);
        setActiveFilterMenu('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!activeFilterMenu) return;
    const handler = (e) => {
      if (!e.target.closest('.filter-popup, .filterable-header')) {
        setActiveFilterMenu('');
      }
    };
    setTimeout(() => document.addEventListener('click', handler), 0);
    return () => document.removeEventListener('click', handler);
  }, [activeFilterMenu]);

  // Reprogramar em massa
  const handleReprogramar = async () => {
    const ids = parseCardIds(idsInput);
    if (!ids.length || !dateIsValid || !dateInput) return;
    setIsProcessing(true);
    try {
      await reprogramarEmMassa(ids, dateInput);
      toast.success(`${ids.length} cards reprogramados com sucesso!`);
      setShowReprogramModal(false);
      setIdsInput('');
      setDateInput('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erro ao reprogramar cards.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Buscar e baixar PDFs
  const handleBuscarPdfs = async () => {
    const ids = parseCardIds(printIdsInput);
    if (!ids.length) return;
    setIsSearchingFiles(true);
    setFoundFiles([]);
    try {
      const res = await buscarArquivosPorIds(ids);
      const files = (res?.files || []).map((f) => ({ ...f, selected: true, downloaded: false }));
      setFoundFiles(files);
    } catch {
      toast.error('Erro ao buscar arquivos.');
    } finally {
      setIsSearchingFiles(false);
    }
  };

  const handleDownloadZip = async () => {
    const selected = foundFiles.filter((f) => f.selected);
    if (!selected.length) return;
    setTotalFilesToDownload(selected.length);
    setDownloadProgress(0);
    try {
      await downloadPdfsAsZip(selected, (done, total) => {
        setDownloadProgress(done);
        setTotalFilesToDownload(total);
      });
      toast.success('Download concluído!');
    } catch {
      toast.error('Erro ao baixar arquivos.');
    }
  };

  // Carregar issues para alterar datas
  const handleLoadIssues = async () => {
    setIsLoadingIssues(true);
    setIssues([]);
    try {
      const res = await getJiraIssues();
      const data = (res?.data || []).map((i) => ({ ...i, novaData: '' }));
      setIssues(data);
    } catch {
      toast.error('Erro ao carregar issues do Jira.');
    } finally {
      setIsLoadingIssues(false);
    }
  };

  const handleSalvarDatas = async () => {
    const updates = issues
      .filter((i) => i.novaData && DATE_MASK_RE.test(i.novaData))
      .map((i) => ({ key: i.key, novaData: i.novaData }));

    if (!updates.length) {
      toast('Nenhuma data para salvar.', { icon: 'ℹ️' });
      return;
    }
    setIsProcessing(true);
    try {
      await atualizarDatasIndividuais(updates);
      toast.success(`${updates.length} datas atualizadas!`);
      setShowAlterarDatasModal(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erro ao salvar datas.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReprogramarContec = async () => {
    setShowContecConfirm(false);
    setIsProcessing(true);
    try {
      await reprogramarDatasComtec();
      toast.success('Datas CONTEC reprogramadas!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erro ao reprogramar CONTEC.');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateNovaData = (key, value) => {
    setIssues((prev) => prev.map((i) => i.key === key ? { ...i, novaData: applyDateMask(value) } : i));
  };

  const toggleSort = (col) => {
    setSortConfig((prev) => {
      if (prev.column !== col) return { column: col, direction: 'asc' };
      if (prev.direction === 'asc') return { column: col, direction: 'desc' };
      return { column: '', direction: '' };
    });
  };

  const toggleFilter = (col, e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setFilterMenuPos({ top: rect.bottom + 8, left: rect.right - 270 });
    setActiveFilterMenu((prev) => (prev === col ? '' : col));
  };

  const toggleFilterOption = (col, val) => {
    setColumnFilters((prev) => {
      const current = prev[col];
      const next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
      return { ...prev, [col]: next };
    });
  };

  const ROUTINE_CARDS = [
    {
      id: 'reprogramar',
      title: 'Reprogramar em Massa',
      desc: 'Defina uma nova data para múltiplos cards do Jira de uma vez.',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      color: 'from-blue-500 to-blue-700',
      action: () => setShowReprogramModal(true),
    },
    {
      id: 'download',
      title: 'Download OPs',
      desc: 'Baixe os arquivos PDF de múltiplos cards como um único ZIP.',
      icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: 'from-emerald-500 to-emerald-700',
      action: () => setShowPrintModal(true),
    },
    {
      id: 'alterar',
      title: 'Alterar Datas Individualmente',
      desc: 'Visualize todos os cards e edite cada data de previsão individualmente.',
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      color: 'from-amber-500 to-amber-700',
      action: () => { setShowAlterarDatasModal(true); handleLoadIssues(); },
    },
    {
      id: 'contec',
      title: 'Reprogramar Datas CONTEC',
      desc: 'Reprograma automaticamente as datas CONTEC para o próximo dia útil.',
      icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      color: 'from-violet-500 to-violet-700',
      action: () => setShowContecConfirm(true),
    },
  ];

  const SortIcon = ({ col }) => {
    const dir = sortConfig.column === col ? sortConfig.direction : '';
    return (
      <svg className="w-3.5 h-3.5 ml-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {dir === 'asc'
          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          : dir === 'desc'
          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        }
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">PCP - Ordens de Produção</h1>
        <p className="text-slate-500 text-sm mt-0.5">Rotinas de gestão de ordens no Jira</p>
      </div>

      {/* Routine cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ROUTINE_CARDS.map((card) => (
          <button
            key={card.id}
            onClick={card.action}
            className={`text-left p-5 rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all`}
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
              </svg>
            </div>
            <h3 className="font-semibold text-sm mb-1">{card.title}</h3>
            <p className="text-xs opacity-80 leading-snug">{card.desc}</p>
          </button>
        ))}
      </div>

      {/* Modal: Reprogramar em Massa */}
      <Modal
        open={showReprogramModal}
        onClose={() => !isProcessing && setShowReprogramModal(false)}
        title="Reprogramar em Massa"
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowReprogramModal(false)}
              disabled={isProcessing}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleReprogramar}
              disabled={isProcessing || !parsedIdsCount || !dateInput || !dateIsValid}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {isProcessing ? 'Processando...' : 'Reprogramar'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              IDs dos Cards <span className="text-slate-400 font-normal">({parsedIdsCount} identificados)</span>
            </label>
            <textarea
              value={idsInput}
              onChange={(e) => setIdsInput(e.target.value)}
              placeholder="Cole os IDs aqui, um por linha ou separados por vírgula..."
              rows={5}
              disabled={isProcessing}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nova Data (DD/MM/AAAA)</label>
            <input
              type="text"
              value={dateInput}
              onChange={(e) => setDateInput(applyDateMask(e.target.value))}
              placeholder="DD/MM/AAAA"
              maxLength={10}
              disabled={isProcessing}
              className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 disabled:opacity-50 ${
                dateIsValid ? 'border-slate-200 focus:ring-blue-400' : 'border-red-300 focus:ring-red-400'
              }`}
            />
            <p className="text-slate-400 text-xs mt-1">Use 00/00/0000 para limpar a data.</p>
          </div>
        </div>
      </Modal>

      {/* Modal: Download OPs */}
      <Modal
        open={showPrintModal}
        onClose={() => !isProcessing && setShowPrintModal(false)}
        title="Download OPs (PDF → ZIP)"
        size="md"
        footer={
          <>
            <button onClick={() => setShowPrintModal(false)} disabled={isProcessing} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50">
              Fechar
            </button>
            {foundFiles.length > 0 && (
              <button
                onClick={handleDownloadZip}
                disabled={isProcessing || !foundFiles.some((f) => f.selected)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Baixar ZIP
              </button>
            )}
            {!foundFiles.length && (
              <button
                onClick={handleBuscarPdfs}
                disabled={isSearchingFiles || !parsedPrintCount}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSearchingFiles && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Buscar Arquivos
              </button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              IDs dos Cards <span className="text-slate-400 font-normal">({parsedPrintCount} identificados)</span>
            </label>
            <textarea
              value={printIdsInput}
              onChange={(e) => setPrintIdsInput(e.target.value)}
              placeholder="Cole os IDs aqui..."
              rows={4}
              disabled={isSearchingFiles}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none disabled:opacity-50"
            />
          </div>
          {foundFiles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">{foundFiles.length} arquivo(s) encontrado(s)</p>
                {totalFilesToDownload > 0 && (
                  <p className="text-sm text-slate-500">{downloadProgress}/{totalFilesToDownload}</p>
                )}
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {foundFiles.map((f, i) => (
                  <label key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={f.selected}
                      onChange={() => setFoundFiles((prev) => prev.map((x, j) => j === i ? { ...x, selected: !x.selected } : x))}
                      className="accent-emerald-500"
                    />
                    <span className="text-sm text-slate-700 truncate">{f.name}</span>
                    <span className="text-xs text-slate-400 ml-auto">{f.cardId}</span>
                  </label>
                ))}
              </div>
              {totalFilesToDownload > 0 && (
                <div className="mt-3 bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${(downloadProgress / totalFilesToDownload) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Modal: Alterar Datas Individuais */}
      <Modal
        open={showAlterarDatasModal}
        onClose={() => !isProcessing && setShowAlterarDatasModal(false)}
        title="Alterar Datas Individualmente"
        size="xl"
        footer={
          <>
            <button onClick={() => setShowAlterarDatasModal(false)} disabled={isProcessing} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button
              onClick={handleSalvarDatas}
              disabled={isProcessing || isLoadingIssues}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Salvar Datas
            </button>
          </>
        }
      >
        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por ID, resumo, status, veículo..."
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {isLoadingIssues ? (
          <TableSkeleton rows={8} cols={5} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {[
                    { key: 'key', label: 'ID' },
                    { key: 'resumo', label: 'Resumo' },
                    { key: 'status', label: 'Status', filterable: true },
                    { key: 'situacao', label: 'Situação', filterable: true },
                    { key: 'veiculo', label: 'Veículo' },
                    { key: 'previsao', label: 'Previsão', filterable: true },
                    { key: 'novaData', label: 'Nova Data', filterable: true },
                  ].map((col) => (
                    <th
                      key={col.key}
                      className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 cursor-pointer select-none filterable-header"
                      onClick={() => !col.filterable && toggleSort(col.key)}
                    >
                      <div className="flex items-center gap-1">
                        <span onClick={() => toggleSort(col.key)} className="hover:text-slate-900 transition-colors">
                          {col.label}
                        </span>
                        <SortIcon col={col.key} />
                        {col.filterable && (
                          <button
                            onClick={(e) => toggleFilter(col.key, e)}
                            className={`ml-1 p-0.5 rounded transition-colors ${columnFilters[col.key]?.length ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map((issue) => (
                  <tr key={issue.key} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-xs text-slate-700">{issue.key}</td>
                    <td className="px-3 py-2 text-slate-700">{issue.resumo}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">{issue.status}</span>
                    </td>
                    <td className="px-3 py-2 text-slate-600 text-xs">{issue.situacao}</td>
                    <td className="px-3 py-2 text-slate-600 text-xs">{issue.veiculo}</td>
                    <td className="px-3 py-2 text-slate-600 text-xs">{issue.previsao}</td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={issue.novaData || ''}
                        onChange={(e) => updateNovaData(issue.key, e.target.value)}
                        placeholder="DD/MM/AAAA"
                        maxLength={10}
                        className="w-28 px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </td>
                  </tr>
                ))}
                {!filteredIssues.length && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-400 text-sm">
                      Nenhum card encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Filter popup */}
        {activeFilterMenu && (
          <div
            className="fixed bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3 filter-popup"
            style={{ top: filterMenuPos.top, left: Math.max(8, filterMenuPos.left), width: 270 }}
          >
            <p className="text-xs font-semibold text-slate-600 mb-2 capitalize">{activeFilterMenu}</p>
            {(activeFilterMenu === 'status' ? statusOptions
              : activeFilterMenu === 'situacao' ? situacaoOptions
              : activeFilterMenu === 'previsao' ? [{ value: 'com-data', label: 'Com data' }, { value: 'sem-data', label: 'Sem data' }]
              : [{ value: 'com-data', label: 'Preenchida' }, { value: 'sem-data', label: 'Vazia' }]
            ).map((opt) => {
              const val = typeof opt === 'string' ? opt : opt.value;
              const lbl = typeof opt === 'string' ? opt : opt.label;
              return (
                <label key={val} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={columnFilters[activeFilterMenu]?.includes(val)}
                    onChange={() => toggleFilterOption(activeFilterMenu, val)}
                    className="accent-amber-500"
                  />
                  <span className="text-sm text-slate-700">{lbl}</span>
                </label>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Modal: Confirmar CONTEC */}
      <Modal
        open={showContecConfirm}
        onClose={() => setShowContecConfirm(false)}
        title="Confirmar Reprogramação CONTEC"
        size="sm"
        footer={
          <>
            <button onClick={() => setShowContecConfirm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleReprogramarContec}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors"
            >
              Confirmar
            </button>
          </>
        }
      >
        <p className="text-slate-600 text-sm">
          Deseja reprogramar automaticamente todas as datas CONTEC para o próximo dia útil?
          Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </div>
  );
}
