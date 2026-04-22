import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, FileX, Play, RefreshCw, ChevronDown, ChevronRight, Clock } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../config/apiService";

const STATUS_META = {
  OK:        { label: "OK",          color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200",  Icon: ShieldCheck },
  CORRUPTED: { label: "Corrompido",  color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200",    Icon: ShieldAlert },
  MISSING:   { label: "Ausente",     color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", Icon: FileX       },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? STATUS_META.CORRUPTED;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${m.color} ${m.bg} ${m.border}`}>
      <m.Icon className="w-3 h-3" />
      {m.label}
    </span>
  );
}

function FailureRow({ result }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-[#E3E1D9] rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F8F7F4] transition-colors"
      >
        <StatusBadge status={result.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[12px] font-semibold text-[#18170F]">
              {result.document?.invoice?.invoiceNumber ?? "NF desconhecida"}
            </span>
            <span className="text-[10px] text-[#A09E98]">
              {result.document?.type} · v{result.document?.version}
            </span>
          </div>
          <div className="text-[11px] text-[#A09E98] truncate mt-0.5">
            {result.document?.originalFilename}
          </div>
        </div>
        <div className="text-[10px] text-[#A09E98] font-mono flex-shrink-0">
          {new Date(result.checkedAt).toLocaleString("pt-BR")}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-[#A09E98] flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-[#A09E98] flex-shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-[#E3E1D9] px-4 py-3 space-y-2 bg-[#F8F7F4]">
          {result.notes && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[#6A6860] mb-1">Detalhes</div>
              <div className="text-[12px] text-[#18170F] font-mono bg-white border border-[#E3E1D9] rounded-lg px-3 py-2 break-all">
                {result.notes}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[#6A6860] mb-1">Hash Armazenado</div>
              <div className="text-[10px] text-[#18170F] font-mono bg-white border border-[#E3E1D9] rounded-lg px-3 py-2 break-all">
                {result.storedHash}
              </div>
            </div>
            {result.computedHash && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[#6A6860] mb-1">Hash Calculado</div>
                <div className={`text-[10px] font-mono rounded-lg px-3 py-2 break-all border ${
                  result.computedHash === result.storedHash
                    ? "text-green-800 bg-green-50 border-green-200"
                    : "text-red-800 bg-red-50 border-red-200"
                }`}>
                  {result.computedHash}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function IntegrityPage() {
  const [failures, setFailures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [runSummary, setRunSummary] = useState(null);

  const loadFailures = () => {
    setLoading(true);
    api.get("/invoices/integrity/failures")
      .then(r => setFailures(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error("Erro ao carregar falhas de integridade"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadFailures(); }, []);

  const runCheck = async () => {
    setRunning(true);
    setRunSummary(null);
    try {
      const { data } = await api.post("/invoices/integrity/run");
      setRunSummary(data);
      setLastRun(new Date());
      toast.success(`Verificação concluída: ${data.ok} OK · ${data.corrupted} corrompido(s) · ${data.missing} ausente(s)`);
      loadFailures();
    } catch {
      toast.error("Erro ao executar verificação");
    } finally {
      setRunning(false);
    }
  };

  const summaryCards = [
    { key: "ok",        label: "OK",          meta: STATUS_META.OK        },
    { key: "corrupted", label: "Corrompidos",  meta: STATUS_META.CORRUPTED },
    { key: "missing",   label: "Ausentes",     meta: STATUS_META.MISSING   },
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <div className="flex flex-col h-screen bg-[#F2F1ED] font-sans text-[13px]">
        {/* Topbar */}
        <div className="bg-white border-b border-[#E3E1D9] px-5 h-12 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#6A6860]" />
            <span className="text-[13px] font-semibold text-[#18170F]">Integridade de Documentos</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadFailures}
              disabled={loading || running}
              className="flex items-center gap-1.5 text-[11px] text-[#6A6860] border border-[#E3E1D9] rounded-lg px-3 py-1.5 hover:bg-[#F8F7F4] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </button>
            <button
              onClick={runCheck}
              disabled={running}
              className="flex items-center gap-1.5 text-[11px] text-white bg-[#18170F] rounded-lg px-3 py-1.5 hover:bg-[#2D2C24] transition-colors disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${running ? "animate-pulse" : ""}`} />
              {running ? "Verificando..." : "Executar Verificação"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Agendamento info */}
          <div className="bg-white border border-[#E3E1D9] rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] text-[#6A6860]">
              <Clock className="w-4 h-4 text-[#A09E98]" />
              Verificação automática toda <span className="font-semibold text-[#18170F] mx-1">segunda-feira às 02:00</span> (configurável via <span className="font-mono text-[11px] bg-[#F8F7F4] px-1.5 py-0.5 rounded mx-1">INVOICE_INTEGRITY_CRON</span>)
            </div>
            {lastRun && (
              <div className="text-[10px] text-[#A09E98] font-mono">
                Última execução manual: {lastRun.toLocaleString("pt-BR")}
              </div>
            )}
          </div>

          {/* Resultado da última execução manual */}
          {runSummary && (
            <div className="bg-white border border-[#E3E1D9] rounded-xl p-4 mb-5">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6860] mb-3">Resultado da Última Execução</div>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-[#F8F7F4] rounded-xl border border-[#E3E1D9] px-4 py-3 text-center">
                  <div className="text-[24px] font-bold font-mono text-[#18170F]">{runSummary.total}</div>
                  <div className="text-[10px] text-[#A09E98] mt-0.5">Total verificado</div>
                </div>
                {summaryCards.map(({ key, label, meta }) => (
                  <div key={key} className={`rounded-xl border ${meta.border} ${meta.bg} px-4 py-3 text-center`}>
                    <div className={`text-[24px] font-bold font-mono ${meta.color}`}>{runSummary[key] ?? 0}</div>
                    <div className={`text-[10px] mt-0.5 ${meta.color}`}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Falhas ativas */}
          <div className="bg-white border border-[#E3E1D9] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E3E1D9] bg-[#F8F7F4] flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6860]">
                Falhas Detectadas ({failures.length})
              </span>
              {failures.length > 0 && (
                <span className="text-[10px] text-red-600 font-medium">
                  Ação necessária
                </span>
              )}
            </div>

            <div className="p-3 space-y-2">
              {loading && (
                <div className="text-center py-10 text-[#A09E98] text-[12px]">
                  Carregando...
                </div>
              )}
              {!loading && failures.length === 0 && (
                <div className="text-center py-12">
                  <ShieldCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="text-[13px] font-medium text-[#18170F]">Nenhuma falha detectada</div>
                  <div className="text-[11px] text-[#A09E98] mt-1">Todos os documentos verificados estão íntegros</div>
                </div>
              )}
              {failures.map(result => (
                <FailureRow key={result.id} result={result} />
              ))}
            </div>
          </div>

          {/* Explicação */}
          <div className="mt-4 bg-white border border-[#E3E1D9] rounded-xl px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6860] mb-3">Como funciona</div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: ShieldCheck, color: "text-green-600", title: "OK", desc: "Hash SHA-256 calculado bate com o armazenado no cadastro." },
                { icon: ShieldAlert, color: "text-red-600",   title: "Corrompido", desc: "O arquivo existe mas o hash diverge — pode ter sido modificado externamente." },
                { icon: FileX,       color: "text-orange-600",title: "Ausente", desc: "O arquivo físico não foi encontrado no caminho armazenado." },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="flex gap-3">
                  <Icon className={`w-4 h-4 ${color} flex-shrink-0 mt-0.5`} />
                  <div>
                    <div className="text-[12px] font-semibold text-[#18170F]">{title}</div>
                    <div className="text-[11px] text-[#A09E98] mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
