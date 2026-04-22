import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { getOrdensDiarias, createOrdemDiaria, updateOrdemDiaria } from '../../services/ordensDiariasService';
import { getJiraIssues } from '../../services/jiraService';

function formatDateForInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseIsoDate(str) {
  if (!str) return null;
  if (str.includes('T')) str = str.split('T')[0];
  const [y, m, d] = str.split('-');
  return new Date(+y, +m - 1, +d);
}

function formatBR(str) {
  if (!str || str === '-') return '-';
  const d = parseIsoDate(str);
  if (!d || isNaN(d)) return str;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function getStatusByDate(isoDate) {
  if (!isoDate) return 'normal';
  const d = parseIsoDate(isoDate);
  if (!d) return 'normal';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d - today) / 86400000);
  if (diff <= 0) return 'liberado';
  if (diff <= 2) return 'proximo';
  return 'normal';
}

function extractOs(resumo) {
  const match = String(resumo || '').match(/(\d{3,10})/g);
  return match ? match[match.length - 1] : '';
}

function normalizeIsoDate(raw) {
  const v = String(raw || '').trim();
  if (!v || v === '-' || /sem\s*data/i.test(v)) return '';
  const ddmm = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmm) return `${ddmm[3]}-${ddmm[2]}-${ddmm[1]}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  return '';
}

function parseCardIds(raw) {
  return Array.from(new Set(
    String(raw || '').split(/[,;\s\n]+/).map((id) => id.trim().toUpperCase()).filter(Boolean)
  ));
}

const STATUS_STYLES = {
  liberado: 'bg-red-100 text-red-700 border-red-200',
  proximo: 'bg-amber-100 text-amber-700 border-amber-200',
  vidros: 'bg-blue-100 text-blue-700 border-blue-200',
  normal: 'bg-green-100 text-green-700 border-green-200',
};

const STATUS_LABELS = {
  liberado: 'Liberado',
  proximo: 'Próximo',
  vidros: 'Vidros',
  normal: 'Normal',
};

export default function Acompanhamento() {
  const [items, setItems] = useState([]);
  const [dataProducao, setDataProducao] = useState(formatDateForInput(new Date()));
  const [filtroAtivo, setFiltroAtivo] = useState(false);
  const [cardIdInput, setCardIdInput] = useState('');
  const [isAtualizando, setIsAtualizando] = useState(false);
  const [updateMsg, setUpdateMsg] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await getOrdensDiarias();
      if (res?.success && Array.isArray(res.data)) {
        setItems(res.data.map((o) => ({
          id: o.id,
          seq: String(o.seq || ''),
          tipo: o.tipo || '',
          os: o.os || '',
          veiculo: o.veiculo || '',
          dataEntrega: formatBR(o.data_entrega || ''),
          dataEntregaRaw: o.data_entrega || '',
          obs: o.obs || '',
          status: getStatusByDate(o.data_entrega),
        })));
      } else {
        setError('Nenhum dado encontrado.');
      }
    } catch {
      setError('Erro ao carregar dados do servidor.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const filteredItems = useMemo(() => {
    let list = [...items];
    if (filtroAtivo && dataProducao) {
      const sel = new Date(dataProducao + 'T00:00:00');
      list = list.filter((item) => {
        const d = parseIsoDate(item.dataEntregaRaw);
        return d && d <= sel;
      });
    }
    return list.sort((a, b) => {
      const sa = parseInt(String(a.seq).replace(/\D/g, '') || '9999999');
      const sb = parseInt(String(b.seq).replace(/\D/g, '') || '9999999');
      if (sa !== sb) return sa - sb;
      const da = parseIsoDate(a.dataEntregaRaw)?.getTime() || 0;
      const db = parseIsoDate(b.dataEntregaRaw)?.getTime() || 0;
      return da - db;
    });
  }, [items, filtroAtivo, dataProducao]);

  const handleAtualizarCards = async () => {
    const cardIds = parseCardIds(cardIdInput);
    if (!cardIds.length) {
      setUpdateMsg({ text: 'Informe pelo menos um ID de card.', type: 'error' });
      return;
    }

    setIsAtualizando(true);
    setUpdateMsg({ text: '', type: '' });

    try {
      const res = await getJiraIssues(false);
      const issuesMap = new Map((res?.data || []).map((i) => [String(i.key).toUpperCase(), i]));
      const existingByOs = new Map(items.filter((i) => i.os).map((i) => [String(i.os).trim(), i]));

      let ok = 0;
      const erros = [];

      for (const cardId of cardIds) {
        const issue = issuesMap.get(cardId);
        if (!issue) { erros.push(`${cardId}: não encontrado`); continue; }

        const os = extractOs(issue.resumo);
        const isoDate = normalizeIsoDate(issue.previsao);
        if (!os || !isoDate) { erros.push(`${cardId}: OS/data inválidos`); continue; }

        const payload = { os, veiculo: String(issue.veiculo || ''), data_entrega: isoDate };
        const existing = existingByOs.get(os);

        try {
          if (existing?.id) {
            await updateOrdemDiaria(Number(existing.id), payload);
          } else {
            await createOrdemDiaria(payload);
          }
          ok++;
        } catch {
          erros.push(`${cardId}: falha ao salvar`);
        }
      }

      if (ok > 0 && !erros.length) {
        setUpdateMsg({ text: `${ok} card(s) atualizado(s) com sucesso.`, type: 'success' });
        setCardIdInput('');
        carregarDados();
      } else if (ok > 0) {
        setUpdateMsg({ text: `Parcial: ${ok}/${cardIds.length}. ${erros.join(' | ')}`, type: 'error' });
      } else {
        setUpdateMsg({ text: `Falha. ${erros.join(' | ')}`, type: 'error' });
      }
    } catch {
      setUpdateMsg({ text: 'Erro ao consultar Jira.', type: 'error' });
    } finally {
      setIsAtualizando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">PCP - Acompanhamento</h1>
          <p className="text-slate-500 text-sm mt-0.5">Cronograma diário de produção</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir
        </button>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 print:hidden">
        {/* Date filter */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <label className="block text-sm font-medium text-slate-700 mb-2">Filtrar por Data de Produção</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={dataProducao}
              onChange={(e) => { setDataProducao(e.target.value); setFiltroAtivo(true); }}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {filtroAtivo && (
              <button
                onClick={() => setFiltroAtivo(false)}
                className="px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors text-sm"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Sync from Jira */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <label className="block text-sm font-medium text-slate-700 mb-2">Atualizar do Jira</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={cardIdInput}
              onChange={(e) => setCardIdInput(e.target.value)}
              placeholder="IDs dos cards (vírgula ou espaço)..."
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleAtualizarCards}
              disabled={isAtualizando}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isAtualizando && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Atualizar
            </button>
          </div>
          {updateMsg.text && (
            <p className={`mt-2 text-xs ${updateMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
              {updateMsg.text}
            </p>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between print:hidden">
          <p className="text-sm font-medium text-slate-700">
            {filteredItems.length} item(s) {filtroAtivo ? 'filtrado(s)' : 'no total'}
          </p>
        </div>

        {isLoading ? (
          <div className="p-5">
            <TableSkeleton rows={8} cols={6} />
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-red-500 text-sm">{error}</p>
            <button onClick={carregarDados} className="mt-3 text-blue-600 text-sm hover:underline">
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Seq', 'Tipo', 'OS', 'Veículo', 'Data Entrega', 'Obs', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, i) => (
                  <tr key={item.id || i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{item.seq}</td>
                    <td className="px-4 py-3 text-slate-700">{item.tipo}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.os}</td>
                    <td className="px-4 py-3 text-slate-700">{item.veiculo}</td>
                    <td className="px-4 py-3 text-slate-700 font-mono text-xs">{item.dataEntrega}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{item.obs}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[item.status] || STATUS_STYLES.normal}`}>
                        {STATUS_LABELS[item.status] || item.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!filteredItems.length && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">
                      Nenhuma ordem encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
