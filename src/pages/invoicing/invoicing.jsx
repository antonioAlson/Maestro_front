import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  CheckCircle, XCircle, AlertTriangle, FileText, Upload,
  ChevronDown, ChevronUp, ChevronRight, X, Lock,
  ShieldCheck, Download, Plus, Hash, Clock,
  ReceiptText, Percent, RefreshCw, Scissors, Trash2,
  Eye, History,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../config/apiService";

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
const materialStyle = (material = "") => {
  const m = material.toUpperCase();
  if (m === "ARAMIDA")          return { bg: "bg-amber-50",  color: "text-amber-900", border: "border-amber-200" };
  if (m.startsWith("TENSYLON")) return { bg: "bg-teal-50",   color: "text-teal-900",  border: "border-teal-200" };
  return { bg: "bg-blue-50", color: "text-blue-800", border: "border-blue-200" };
};

const isAramida = (m) => m?.toUpperCase() === "ARAMIDA";

const calcM2 = (mm, material) => {
  const k = Number(mm);
  if (isNaN(k) || k === 0) return 0;
  const base = (k / 1000) * 1.6;
  if (isAramida(material)) {
    if (k < 2990)  return base + 0.008;
    if (k < 5980)  return base + 0.024;
    if (k < 8970)  return base + 0.04;
    if (k < 11960) return base + 0.056;
    if (k < 14950) return base + 0.064;
  }
  return base;
};

const getTotalM2 = (r) =>
  (r.consumptions ?? []).reduce((s, c) => s + calcM2(c.usedMetrage, r.material), 0);

const billedMm = (c) => {
  const invoiceTotal = (c.invoices ?? []).reduce((s, i) => s + Number(i.usedMetrage ?? 0), 0);
  const splitTotal   = (c.splits   ?? []).reduce((s, sp) => s + Number(sp.usedMetrage ?? 0), 0);
  return invoiceTotal + splitTotal;
};

const availableMm = (c) => Number(c.usedMetrage ?? 0) - billedMm(c);
const billedPct   = (c) => {
  const t = Number(c.usedMetrage ?? 0);
  return t === 0 ? 0 : Math.min(100, (billedMm(c) / t) * 100);
};
const fmt = (n) => Number(n ?? 0).toLocaleString("pt-BR");

const recordBilledPct = (record) => {
  const total  = (record.consumptions ?? []).reduce((s, c) => s + Number(c.usedMetrage ?? 0), 0);
  const billed = (record.consumptions ?? []).reduce((s, c) => s + billedMm(c), 0);
  return total === 0 ? 0 : Math.round((billed / total) * 100);
};

const invoiceNum = (inv) => inv?.number ?? inv?.invoiceNumber ?? "";

const getRecordStatus = (r) => {
  const pct = recordBilledPct(r);
  if (pct === 0)   return "pending";
  if (pct === 100) return "completed";
  return "partial";
};

const isOverbilled = (r) =>
  (r.consumptions ?? []).some(c => billedMm(c) > Number(c.usedMetrage ?? 0));

const uploadFile = (number, file, type) => {
  const form = new FormData();
  form.append("file", file);
  form.append("type", type);
  return api.post(`/invoices/${number}/documents`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/* ══════════════════════════════════════════════
   MICRO-COMPONENTS
══════════════════════════════════════════════ */
const MaterialBadge = ({ material }) => {
  if (!material) return null;
  const s = materialStyle(material);
  return (
    <span className={`${s.bg} ${s.color} border ${s.border} px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide font-mono`}>
      {material}
    </span>
  );
};

function StatusBadge({ type }) {
  const cfg = {
    pending:    { cls: "text-amber-700 bg-amber-50 border-amber-200",    label: "Pendente",  Icon: AlertTriangle },
    partial:    { cls: "text-blue-700 bg-blue-50 border-blue-200",       label: "Parcial",   Icon: Clock },
    completed:  { cls: "text-green-700 bg-green-50 border-green-200",    label: "Faturado",  Icon: CheckCircle },
    overbilled: { cls: "text-red-700 bg-red-50 border-red-200",          label: "Excedido",  Icon: XCircle },
    locked:     { cls: "text-gray-500 bg-gray-50 border-gray-200",       label: "Bloqueado", Icon: Lock },
    split:      { cls: "text-purple-700 bg-purple-50 border-purple-200", label: "Dividido",  Icon: Scissors },
  };
  const c = cfg[type] ?? cfg.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold border px-1.5 py-0.5 rounded-full ${c.cls}`}>
      <c.Icon className="w-2.5 h-2.5" />
      {c.label}
    </span>
  );
}

function BalanceBar({ consumption }) {
  const pct    = billedPct(consumption);
  const billed = billedMm(consumption);
  const total  = Number(consumption.usedMetrage ?? 0);
  const avail  = total - billed;
  const full   = pct >= 100;
  const over   = billed > total;
  return (
    <div className="mt-1.5 mb-2">
      <div className="flex justify-between text-[10px] font-mono mb-1">
        <span className={`font-semibold ${full ? "text-green-700" : over ? "text-red-600" : "text-blue-700"}`}>
          {fmt(billed)} mm faturados
        </span>
        {!full && !over && (
          <span className="text-[#6A6860]">
            <span className="text-[#18170F] font-semibold">{fmt(avail)} mm</span> restantes
          </span>
        )}
        {over && (
          <span className="text-red-600 font-semibold">Excede em {fmt(billed - total)} mm</span>
        )}
        {full && !over && (
          <span className="text-green-700 font-semibold">Completo ✓</span>
        )}
      </div>
      <div className="h-1.5 bg-[#E3E1D9] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${over ? "bg-red-500" : full ? "bg-green-500" : "bg-blue-500"}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="border border-[#E3E1D9] rounded-xl overflow-hidden bg-white animate-pulse">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-4 h-4 bg-[#E3E1D9] rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-3 bg-[#E3E1D9] rounded w-24" />
            <div className="h-3 bg-[#E3E1D9] rounded w-16" />
          </div>
          <div className="h-2.5 bg-[#E3E1D9] rounded w-48" />
        </div>
        <div className="flex-shrink-0 w-36 space-y-1">
          <div className="h-1.5 bg-[#E3E1D9] rounded-full" />
          <div className="h-2 bg-[#E3E1D9] rounded w-14 ml-auto" />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   RECORD ROW
══════════════════════════════════════════════ */
function RecordRow({ record, onClick }) {
  const pct    = recordBilledPct(record);
  const status = getRecordStatus(record);
  const over   = isOverbilled(record);
  const suppliers = [...new Set((record.consumptions ?? []).map(c => c.supplier).filter(Boolean))];
  return (
    <div
      onClick={onClick}
      className="border border-[#E3E1D9] rounded-xl overflow-hidden bg-white cursor-pointer hover:bg-[#F8F7F4] transition-colors"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {status === "completed" && !over
          ? <CheckCircle   className="w-4 h-4 text-green-500 flex-shrink-0" />
          : over
          ? <XCircle       className="w-4 h-4 text-red-500 flex-shrink-0" />
          : status === "partial"
          ? <Clock         className="w-4 h-4 text-blue-400 flex-shrink-0" />
          : <AlertTriangle className="w-4 h-4 text-[#E3E1D9] flex-shrink-0" />}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-mono font-semibold text-[13px] text-[#18170F]">{record.orderNumber}</span>
            <MaterialBadge material={record.material} />
            {over
              ? <StatusBadge type="overbilled" />
              : <StatusBadge type={status} />}
          </div>
          <div className="text-[11px] text-[#A09E98]">
            {suppliers.join(" · ")} · {(record.consumptions ?? []).length} consumo(s) ·{" "}
            {record.createdAt ? new Date(record.createdAt).toLocaleDateString("pt-BR") : "—"}
          </div>
        </div>

        <div className="flex-shrink-0 w-32">
          <div className="h-1.5 bg-[#E3E1D9] rounded-full overflow-hidden mb-1">
            <div
              className={`h-full rounded-full transition-all ${over ? "bg-red-500" : status === "completed" ? "bg-green-500" : "bg-blue-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-right text-[#6A6860]">{pct}% faturado</div>
        </div>
        <ChevronRight className="w-4 h-4 text-[#A09E98] flex-shrink-0 ml-1" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   DOCUMENT UPLOAD
   Drag & drop file slots (NF + Carta Correção) per invoice number.
══════════════════════════════════════════════ */
function DocumentUpload({ invoiceNumber }) {
  const [docs,      setDocs]      = useState([]);
  const [uploading, setUploading] = useState(null); // "NF" | "CARTA_CORRECAO" | null
  const [dragOver,  setDragOver]  = useState(null); // "NF" | "CARTA_CORRECAO" | null
  const [errors,    setErrors]    = useState({});
  const [viewDocId, setViewDocId] = useState(null); // open DocumentViewer
  const nfRef   = useRef();
  const corrRef = useRef();

  const fetchDocs = useCallback(() =>
    api.get(`/invoices/${invoiceNumber}/documents`)
       .then(r => setDocs(Array.isArray(r.data) ? r.data : []))
       .catch(() => {}),
    [invoiceNumber]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleFile = async (file, type) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setErrors(p => ({ ...p, [type]: "Apenas PDFs são aceitos" }));
      setTimeout(() => setErrors(p => ({ ...p, [type]: null })), 3000);
      return;
    }
    setUploading(type);
    setErrors(p => ({ ...p, [type]: null }));
    try {
      await uploadFile(invoiceNumber, file, type);
      toast.success(type === "NF" ? "Nota Fiscal anexada" : "Carta de Correção anexada");
      fetchDocs();
    } catch { toast.error("Erro ao enviar documento"); }
    finally { setUploading(null); }
  };

  const nfDoc   = docs.find(d => d.type === "NF"             && d.active);
  const corrDoc = docs.find(d => d.type === "CARTA_CORRECAO" && d.active);
  const dlBase  = `${import.meta.env.VITE_API_KEY}/invoices/${invoiceNumber}/documents`;

  const slots = [
    { type: "NF",             tag: "NF", tagCls: "text-blue-700 bg-blue-50 border-blue-200",    doc: nfDoc,   inputRef: nfRef,   label: "Nota Fiscal (PDF)" },
    { type: "CARTA_CORRECAO", tag: "CC", tagCls: "text-amber-700 bg-amber-50 border-amber-200", doc: corrDoc, inputRef: corrRef, label: "Carta de Correção (opcional)" },
  ];

  return (
    <div className="mt-2 space-y-1.5">
      {slots.map(({ type, tag, tagCls, doc, inputRef, label }) => {
        const isDragging = dragOver === type;
        const isUploading = uploading === type;
        return (
          <div
            key={type}
            className={`flex items-center gap-2 border rounded-lg px-2.5 py-2 transition-all ${
              isDragging ? "border-blue-400 bg-blue-50 scale-[1.01]" : "border-[#E3E1D9] bg-white"
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver(type); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => { e.preventDefault(); setDragOver(null); handleFile(e.dataTransfer.files?.[0], type); }}
          >
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border w-8 text-center flex-shrink-0 ${tagCls}`}>
              {tag}
            </span>
            {doc ? (
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <FileText className="w-3 h-3 text-[#A09E98] flex-shrink-0" />
                <button
                  onClick={() => setViewDocId(doc.id)}
                  className="text-[11px] text-[#18170F] flex-1 truncate text-left hover:text-blue-600 transition-colors"
                  title="Visualizar documento"
                >
                  {doc.originalFilename}
                </button>
                <button
                  onClick={() => setViewDocId(doc.id)}
                  className="text-[#A09E98] hover:text-blue-600 p-0.5 flex-shrink-0 transition-colors"
                  title="Visualizar"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <a href={`${dlBase}/${doc.id}/download`} target="_blank" rel="noreferrer"
                  className="text-[#A09E98] hover:text-[#18170F] p-0.5 flex-shrink-0 transition-colors"
                  title="Download">
                  <Download className="w-3.5 h-3.5" />
                </a>
                <button onClick={() => inputRef.current?.click()} disabled={isUploading}
                  className="text-[10px] text-[#6A6860] hover:text-blue-600 hover:underline flex-shrink-0 disabled:opacity-50">
                  {isUploading ? "..." : "Substituir"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
                className="flex-1 flex items-center gap-1.5 text-[11px] text-[#A09E98] hover:text-[#18170F] transition-colors disabled:opacity-50 text-left"
              >
                <Upload className="w-3 h-3 flex-shrink-0" />
                {isUploading ? "Enviando..." : isDragging ? "Soltar para fazer upload" : label}
              </button>
            )}
            {errors[type] && (
              <span className="text-[10px] text-red-600 font-semibold flex-shrink-0">{errors[type]}</span>
            )}
            <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
              onChange={e => { handleFile(e.target.files?.[0], type); e.target.value = ""; }} />
          </div>
        );
      })}

      {viewDocId !== null && (
        <DocumentViewer
          invoiceNumber={invoiceNumber}
          initialDocId={viewDocId}
          onClose={() => setViewDocId(null)}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   DOCUMENT VIEWER
   Side-panel PDF viewer with metadata + version history.
   Uses blob URL so it works regardless of auth headers.
══════════════════════════════════════════════ */
const DOC_TYPE_META = {
  NF:             { label: "Nota Fiscal",       short: "NF", cls: "text-blue-700 bg-blue-50 border-blue-200" },
  CARTA_CORRECAO: { label: "Carta de Correção", short: "CC", cls: "text-amber-700 bg-amber-50 border-amber-200" },
};

const fmtBytes = (b) => {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

function DocumentViewer({ invoiceNumber, initialDocId, onClose }) {
  const [history,    setHistory]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeId,   setActiveId]   = useState(initialDocId);
  const [blobUrl,    setBlobUrl]    = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  useEffect(() => {
    api.get(`/invoices/${invoiceNumber}/documents/history`)
      .then(r => setHistory(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error("Erro ao carregar histórico de documentos"))
      .finally(() => setLoading(false));
  }, [invoiceNumber]);

  useEffect(() => {
    if (!activeId) return;
    let url = null;
    setLoadingPdf(true);
    api.get(`/invoices/${invoiceNumber}/documents/${activeId}/download`, { responseType: "blob" })
      .then(r => {
        url = URL.createObjectURL(new Blob([r.data], { type: "application/pdf" }));
        setBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
      })
      .catch(() => toast.error("Erro ao carregar PDF"))
      .finally(() => setLoadingPdf(false));
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [activeId, invoiceNumber]);

  const currentDoc = history.find(d => d.id === activeId);
  const nfDocs     = history.filter(d => d.type === "NF");
  const ccDocs     = history.filter(d => d.type === "CARTA_CORRECAO");

  return (
    <div className="fixed inset-0 z-[90] flex">
      <div className="flex-1 bg-black/40 cursor-pointer" onClick={onClose} />
      <div className="w-[820px] bg-white h-full shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E3E1D9] bg-[#F8F7F4] flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="w-4 h-4 text-[#6A6860] flex-shrink-0" />
            <span className="font-mono font-semibold text-[13px] text-[#18170F] flex-shrink-0">{invoiceNumber}</span>
            {currentDoc && (
              <>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${DOC_TYPE_META[currentDoc.type]?.cls ?? ""}`}>
                  {DOC_TYPE_META[currentDoc.type]?.label ?? currentDoc.type}
                </span>
                <span className="text-[10px] text-[#A09E98] font-mono flex-shrink-0">v{currentDoc.version}</span>
                {currentDoc.active && (
                  <span className="text-[10px] text-green-700 font-semibold flex-shrink-0">• atual</span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {currentDoc && (
              <a
                href={`${import.meta.env.VITE_API_KEY}/invoices/${invoiceNumber}/documents/${currentDoc.id}/download`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-[11px] font-medium text-[#6A6860] border border-[#E3E1D9] rounded-lg px-2.5 py-1.5 hover:bg-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            )}
            <button onClick={onClose} className="text-[#A09E98] hover:text-[#18170F] p-1.5 rounded-lg hover:bg-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">

          {/* PDF area */}
          <div className="flex-1 bg-[#DEDDD8] flex items-center justify-center relative">
            {(loading || loadingPdf) && (
              <div className="flex flex-col items-center gap-3 text-[#A09E98]">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="text-[13px]">Carregando PDF…</span>
              </div>
            )}
            {!loading && !loadingPdf && blobUrl && (
              <iframe
                src={blobUrl}
                className="w-full h-full border-0"
                title="Visualização do documento"
              />
            )}
            {!loading && !loadingPdf && !blobUrl && (
              <div className="flex flex-col items-center gap-3 text-[#A09E98]">
                <FileText className="w-10 h-10" />
                <span className="text-[13px]">Não foi possível carregar o PDF</span>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-[220px] border-l border-[#E3E1D9] flex flex-col flex-shrink-0 overflow-y-auto bg-white">

            {/* Metadata */}
            {currentDoc && (
              <div className="p-4 border-b border-[#E3E1D9] space-y-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[#6A6860]">Documento</div>

                <div>
                  <div className="text-[9px] uppercase tracking-wide text-[#A09E98] mb-0.5">Arquivo</div>
                  <div className="text-[11px] text-[#18170F] break-all font-mono leading-tight">{currentDoc.originalFilename}</div>
                </div>

                <div className="flex gap-4">
                  <div>
                    <div className="text-[9px] uppercase tracking-wide text-[#A09E98] mb-0.5">Tamanho</div>
                    <div className="text-[11px] font-mono text-[#18170F]">{fmtBytes(currentDoc.fileSizeBytes)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wide text-[#A09E98] mb-0.5">Versão</div>
                    <div className="text-[11px] font-mono text-[#18170F]">v{currentDoc.version}</div>
                  </div>
                </div>

                {currentDoc.sha256Hash && (
                  <div>
                    <div className="text-[9px] uppercase tracking-wide text-[#A09E98] mb-0.5">SHA-256</div>
                    <div className="text-[10px] font-mono text-[#6A6860] break-all">
                      {currentDoc.sha256Hash.slice(0, 16)}…
                    </div>
                  </div>
                )}

                {currentDoc.uploadedBy && (
                  <div>
                    <div className="text-[9px] uppercase tracking-wide text-[#A09E98] mb-0.5">Enviado por</div>
                    <div className="text-[11px] text-[#18170F]">{currentDoc.uploadedBy}</div>
                  </div>
                )}

                {currentDoc.createdAt && (
                  <div>
                    <div className="text-[9px] uppercase tracking-wide text-[#A09E98] mb-0.5">Data</div>
                    <div className="text-[11px] font-mono text-[#18170F]">
                      {new Date(currentDoc.createdAt).toLocaleString("pt-BR")}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1.5 pt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${currentDoc.active ? "bg-green-500" : "bg-[#D0CEC8]"}`} />
                  <span className={`text-[10px] font-medium ${currentDoc.active ? "text-green-700" : "text-[#A09E98]"}`}>
                    {currentDoc.active ? "Versão ativa" : "Versão anterior"}
                  </span>
                </div>
              </div>
            )}

            {/* History */}
            <div className="p-4 flex-1">
              <div className="flex items-center gap-1.5 mb-3">
                <History className="w-3 h-3 text-[#6A6860]" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6A6860]">Histórico</span>
              </div>

              {loading && <div className="text-[11px] text-[#A09E98]">Carregando…</div>}

              {!loading && history.length === 0 && (
                <div className="text-[11px] text-[#A09E98]">Nenhum documento</div>
              )}

              {[
                { docs: nfDocs, label: "Notas Fiscais" },
                { docs: ccDocs, label: "Cartas de Correção" },
              ].map(({ docs: typeDocs, label }) =>
                typeDocs.length > 0 ? (
                  <div key={label} className="mb-4">
                    <div className="text-[9px] font-semibold uppercase tracking-wide text-[#A09E98] mb-1.5">{label}</div>
                    <div className="space-y-1">
                      {typeDocs.map(d => (
                        <button
                          key={d.id}
                          onClick={() => setActiveId(d.id)}
                          className={`w-full text-left rounded-lg px-2.5 py-2 transition-all border ${
                            d.id === activeId
                              ? "bg-blue-50 border-blue-200"
                              : "border-transparent hover:bg-[#F8F7F4]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-[9px] font-mono font-semibold ${d.active ? "text-green-700" : "text-[#A09E98]"}`}>
                              v{d.version}
                            </span>
                            {d.active && (
                              <span className="text-[9px] text-green-600 font-semibold">atual</span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#6A6860] truncate mt-0.5">{d.originalFilename}</div>
                          <div className="text-[9px] text-[#A09E98] font-mono mt-0.5">
                            {new Date(d.createdAt).toLocaleDateString("pt-BR")}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   INVOICE ITEM  (saved invoice display)
══════════════════════════════════════════════ */
function InvoiceItem({ invoice }) {
  const num = invoiceNum(invoice);
  return (
    <div className="bg-white border border-[#E3E1D9] rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#F8F7F4] border-b border-[#E3E1D9]">
        <ReceiptText className="w-3 h-3 text-[#A09E98] flex-shrink-0" />
        <span className="font-mono text-[12px] font-semibold text-[#18170F] flex-1 truncate">{num}</span>
        <span className="text-[10px] text-[#A09E98] font-mono flex-shrink-0">{fmt(invoice.usedMetrage)} mm</span>
      </div>
      {num && <div className="px-3 pb-2.5"><DocumentUpload invoiceNumber={num} /></div>}
    </div>
  );
}

/* ══════════════════════════════════════════════
   SPLIT ITEM  (saved split display)
══════════════════════════════════════════════ */
function SplitItem({ split }) {
  const num = invoiceNum(split.invoice);
  return (
    <div className="bg-white border border-purple-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border-b border-purple-100">
        <Scissors className="w-3 h-3 text-purple-500 flex-shrink-0" />
        <span className="font-mono text-[12px] font-semibold text-[#18170F] flex-1 truncate">{num}</span>
        <span className="text-[10px] text-purple-600 font-mono flex-shrink-0">{fmt(split.usedMetrage)} mm</span>
      </div>
      {num && <div className="px-3 pb-2.5"><DocumentUpload invoiceNumber={num} /></div>}
    </div>
  );
}

/* ══════════════════════════════════════════════
   MODE SELECTOR
   Explicit choice between "Apontar NF" and "Dividir consumo".
   Shown when no existing data, not locked, not full.
══════════════════════════════════════════════ */
function ModeSelector({ onSelect }) {
  return (
    <div className="border border-[#E3E1D9] rounded-xl bg-[#F8F7F4] p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[#6A6860] text-center mb-3">
        Como deseja faturar este consumo?
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onSelect("invoice")}
          className="flex flex-col items-center gap-2 bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl p-4 text-left transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors flex-shrink-0">
            <ReceiptText className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-[#18170F] text-center">Apontar NF</div>
            <div className="text-[10px] text-[#A09E98] text-center mt-0.5 leading-snug">
              Uma ou mais NFs para este consumo
            </div>
          </div>
        </button>
        <button
          onClick={() => onSelect("split")}
          className="flex flex-col items-center gap-2 bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-50 rounded-xl p-4 text-left transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors flex-shrink-0">
            <Scissors className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-[#18170F] text-center">Dividir consumo</div>
            <div className="text-[10px] text-[#A09E98] text-center mt-0.5 leading-snug">
              Distribuir entre múltiplas NFs
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   INVOICE FORM  (add a single NF to a consumption)
══════════════════════════════════════════════ */
function InvoiceForm({ avail, onSubmit, onCancel, submitting }) {
  const [number,         setNumber]         = useState("");
  const [quantity,       setQuantity]       = useState("");
  const [nfFile,         setNfFile]         = useState(null);
  const [correctionFile, setCorrectionFile] = useState(null);
  const nfRef      = useRef();
  const corrRef    = useRef();
  const numberRef  = useRef();

  useEffect(() => { numberRef.current?.focus(); }, []);

  const qNum      = Number(quantity) || 0;
  const overBill  = qNum > avail;
  const canSubmit = number.trim() && qNum > 0 && !overBill;

  const handleSubmit = () => {
    if (!canSubmit || submitting) return;
    onSubmit({ number: number.trim(), usedMetrage: qNum, nfFile, correctionFile });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="mt-2 bg-[#F8F7F4] border border-blue-200 rounded-xl p-4 space-y-3">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-[#6A6860] flex items-center gap-1 mb-1">
            <Hash className="w-2.5 h-2.5" /> Número da NF <span className="text-red-500">*</span>
          </label>
          <input
            ref={numberRef}
            value={number}
            onChange={e => setNumber(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: NF-2024-00123"
            className="w-full text-[12px] font-mono bg-white border border-[#E3E1D9] rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
        <div className="w-36">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-[#6A6860] flex items-center gap-1 mb-1">
            <Percent className="w-2.5 h-2.5" /> Quantidade (mm) <span className="text-red-500">*</span>
          </label>
          <input
            type="number" min="1" max={avail} value={quantity}
            onChange={e => setQuantity(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Máx. ${fmt(avail)}`}
            className={`w-full text-[12px] font-mono bg-white border rounded-lg px-3 py-2 outline-none transition-all ${
              overBill ? "border-red-400 bg-red-50" : "border-[#E3E1D9] focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            }`}
          />
          {overBill && (
            <div className="mt-0.5 text-[10px] text-red-600 font-semibold">Excede o saldo ({fmt(avail)} mm)</div>
          )}
          {!overBill && qNum > 0 && (
            <div className="mt-0.5 text-[10px] font-mono text-[#A09E98]">
              Saldo após: <span className="text-[#18170F] font-semibold">{fmt(avail - qNum)} mm</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#6A6860]">Documentos (opcional)</div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded w-8 text-center flex-shrink-0">NF</span>
          {nfFile
            ? <>
                <span className="text-[11px] text-[#18170F] flex-1 truncate">{nfFile.name}</span>
                <button onClick={() => setNfFile(null)} className="text-[#A09E98] hover:text-red-500 flex-shrink-0"><X className="w-3 h-3" /></button>
              </>
            : <button onClick={() => nfRef.current?.click()}
                className="flex items-center gap-1 text-[11px] text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg px-2.5 py-1 transition-colors">
                <Upload className="w-3 h-3" /> Nota Fiscal (PDF)
              </button>
          }
          <input ref={nfRef} type="file" accept="application/pdf" className="hidden"
            onChange={e => { setNfFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded w-8 text-center flex-shrink-0">CC</span>
          {correctionFile
            ? <>
                <span className="text-[11px] text-[#18170F] flex-1 truncate">{correctionFile.name}</span>
                <button onClick={() => setCorrectionFile(null)} className="text-[#A09E98] hover:text-red-500 flex-shrink-0"><X className="w-3 h-3" /></button>
              </>
            : <button onClick={() => corrRef.current?.click()}
                className="flex items-center gap-1 text-[11px] text-amber-600 border border-amber-200 bg-amber-50 hover:bg-amber-100 rounded-lg px-2.5 py-1 transition-colors">
                <Upload className="w-3 h-3" /> Carta Correção (opcional)
              </button>
          }
          <input ref={corrRef} type="file" accept="application/pdf" className="hidden"
            onChange={e => { setCorrectionFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button onClick={onCancel}
          className="text-[11px] font-medium text-[#6A6860] border border-[#E3E1D9] rounded-lg px-3 py-1.5 hover:bg-white transition-colors">
          Cancelar
        </button>
        <button onClick={handleSubmit} disabled={!canSubmit || submitting}
          className="flex items-center gap-1.5 text-[11px] font-medium text-white bg-blue-600 rounded-lg px-3 py-1.5 hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <ReceiptText className="w-3 h-3" />
          {submitting ? "Salvando..." : "Apontar NF"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   SPLIT FORM  (divide consumption into sub-parts)
══════════════════════════════════════════════ */
function SplitForm({ consumption, onSubmit, onCancel, submitting }) {
  const [splits, setSplits] = useState([
    { usedMetrage: "", number: "", nfFile: null, correctionFile: null },
  ]);
  const firstNumberRef = useRef();

  useEffect(() => { firstNumberRef.current?.focus(); }, []);

  const total      = Number(consumption.usedMetrage ?? 0);
  const splitTotal = splits.reduce((s, sp) => s + (Number(sp.usedMetrage) || 0), 0);
  const remaining  = total - splitTotal;
  const splitOver  = splitTotal > total;
  const canSubmit  = splits.length > 0 &&
    splits.every(sp => sp.number.trim() && Number(sp.usedMetrage) > 0) &&
    !splitOver;

  const addRow    = () => setSplits(p => [...p, { usedMetrage: "", number: "", nfFile: null, correctionFile: null }]);
  const removeRow = (i) => setSplits(p => p.filter((_, idx) => idx !== i));
  const update    = (i, field, val) => setSplits(p => p.map((sp, idx) => idx === i ? { ...sp, [field]: val } : sp));

  return (
    <div className="mt-2 bg-[#F8F7F4] border border-purple-200 rounded-xl p-4 space-y-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-purple-700 flex items-center gap-1.5">
        <Scissors className="w-3 h-3" /> Dividir consumo em partes
      </div>

      {splits.map((sp, i) => (
        <div key={i} className="bg-white border border-purple-100 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-purple-600 w-20 flex-shrink-0">Divisão {i + 1}</span>
            <input
              ref={i === 0 ? firstNumberRef : null}
              value={sp.number}
              onChange={e => update(i, "number", e.target.value)}
              placeholder="Número da NF"
              className="flex-1 text-[11px] font-mono bg-[#F8F7F4] border border-[#E3E1D9] rounded-lg px-2.5 py-1.5 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
            />
            <input
              type="number" min="1" value={sp.usedMetrage}
              onChange={e => update(i, "usedMetrage", e.target.value)}
              placeholder="mm"
              className="w-24 text-[11px] font-mono bg-[#F8F7F4] border border-[#E3E1D9] rounded-lg px-2.5 py-1.5 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
            />
            {splits.length > 1 && (
              <button onClick={() => removeRow(i)} className="text-[#A09E98] hover:text-red-500 flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-3 pl-20 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1 py-0.5 rounded">NF</span>
              {sp.nfFile && <span className="text-[10px] text-[#18170F] max-w-[90px] truncate">{sp.nfFile.name}</span>}
              <label className="cursor-pointer text-[10px] text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded px-1.5 py-0.5 transition-colors">
                {sp.nfFile ? "Trocar" : "PDF"}
                <input type="file" accept="application/pdf" className="hidden"
                  onChange={e => { update(i, "nfFile", e.target.files?.[0] ?? null); e.target.value = ""; }} />
              </label>
              {sp.nfFile && (
                <button onClick={() => update(i, "nfFile", null)} className="text-[#A09E98] hover:text-red-500"><X className="w-3 h-3" /></button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded">CC</span>
              {sp.correctionFile && <span className="text-[10px] text-[#18170F] max-w-[90px] truncate">{sp.correctionFile.name}</span>}
              <label className="cursor-pointer text-[10px] text-amber-600 border border-amber-200 bg-amber-50 hover:bg-amber-100 rounded px-1.5 py-0.5 transition-colors">
                {sp.correctionFile ? "Trocar" : "PDF"}
                <input type="file" accept="application/pdf" className="hidden"
                  onChange={e => { update(i, "correctionFile", e.target.files?.[0] ?? null); e.target.value = ""; }} />
              </label>
              {sp.correctionFile && (
                <button onClick={() => update(i, "correctionFile", null)} className="text-[#A09E98] hover:text-red-500"><X className="w-3 h-3" /></button>
              )}
            </div>
          </div>
        </div>
      ))}

      <div className={`text-[11px] font-mono px-2.5 py-1.5 rounded-lg border ${
        splitOver ? "text-red-700 bg-red-50 border-red-200" : "text-[#6A6860] bg-white border-[#E3E1D9]"
      }`}>
        Total: {fmt(splitTotal)} mm / {fmt(total)} mm
        {splitOver
          ? <span className="ml-2 font-semibold text-red-600">— Excede o limite!</span>
          : <span className="ml-2 text-[#A09E98]">saldo: {fmt(remaining)} mm</span>
        }
      </div>

      <div className="flex items-center justify-between pt-1">
        <button onClick={addRow}
          className="flex items-center gap-1 text-[11px] text-purple-600 hover:text-purple-800 transition-colors">
          <Plus className="w-3 h-3" /> Adicionar divisão
        </button>
        <div className="flex items-center gap-2">
          <button onClick={onCancel}
            className="text-[11px] font-medium text-[#6A6860] border border-[#E3E1D9] rounded-lg px-3 py-1.5 hover:bg-white transition-colors">
            Cancelar
          </button>
          <button onClick={() => onSubmit(splits)} disabled={!canSubmit || submitting}
            className="flex items-center gap-1.5 text-[11px] font-medium text-white bg-purple-600 rounded-lg px-3 py-1.5 hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <Scissors className="w-3 h-3" />
            {submitting ? "Salvando..." : "Salvar divisões"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   CHECKLIST DRAWER
══════════════════════════════════════════════ */
const RULE_LABEL = {
  INVOICE_REQUIRED:           "NF apontada",
  NF_DOCUMENT_REQUIRED_OPERA: "Documento NF (Opera)",
  QUANTITY_BALANCE:           "Saldo conferido",
};

function ChecklistDrawer({ record, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/cutting-records/${record.id}/compliance-checklist`)
      .then(r => setData(r.data))
      .catch(() => toast.error("Erro ao carregar checklist"))
      .finally(() => setLoading(false));
  }, [record.id]);

  return (
    <div className="fixed inset-0 z-[80] flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[420px] bg-white h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E3E1D9]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-[14px]">Checklist de Conformidade</span>
          </div>
          <button onClick={onClose} className="text-[#A09E98] hover:text-[#18170F] p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center justify-center h-32 text-[#A09E98] text-sm">
              Verificando conformidade...
            </div>
          )}
          {data && (
            <>
              <div className={`rounded-xl px-4 py-3 mb-5 flex items-center gap-3 ${data.compliant ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                {data.compliant
                  ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  : <XCircle    className="w-5 h-5 text-red-500 flex-shrink-0" />}
                <div>
                  <div className={`text-sm font-semibold ${data.compliant ? "text-green-800" : "text-red-800"}`}>
                    {data.compliant ? "Faturamento conforme" : `${data.failedItems} item(s) com pendência`}
                  </div>
                  <div className="text-xs text-[#6A6860] mt-0.5">
                    {data.totalConsumptions} consumo(s) avaliado(s) · {record.orderNumber}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {(data.items ?? []).map((item, i) => (
                  <div key={i} className={`rounded-lg border px-3.5 py-3 flex items-start gap-3 ${item.passed ? "border-[#E3E1D9] bg-white" : "border-amber-200 bg-amber-50"}`}>
                    {item.passed
                      ? <CheckCircle   className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      : <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />}
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-[#6A6860] uppercase tracking-wide">
                        {RULE_LABEL[item.rule] ?? item.rule} · consumo #{item.consumptionId}
                      </div>
                      <div className="text-[12px] text-[#18170F] mt-0.5">{item.description}</div>
                      <div className="text-[10px] text-[#A09E98] mt-0.5 font-mono">{item.supplier}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   CONSUMPTION CARD
   mode: null → ModeSelector; "invoice" → InvoiceForm; "split" → SplitForm
   complianceIssues: failed checklist items for this consumption
══════════════════════════════════════════════ */
function ConsumptionCard({ consumption, cuttingRecordId, material, singleInvoice, onAllocationSuccess, complianceIssues }) {
  const [expanded,   setExpanded]   = useState(true);
  const [mode,       setMode]       = useState(null); // null | "invoice" | "split"
  const [submitting, setSubmitting] = useState(false);

  const isLocked      = singleInvoice;
  const existInvoices = consumption.invoices ?? [];
  const existSplits   = consumption.splits   ?? [];
  const hasSplits     = existSplits.length > 0;
  const hasInvoices   = existInvoices.length > 0;
  const avail         = availableMm(consumption);
  const isFull        = avail <= 0;
  const isOver        = billedMm(consumption) > Number(consumption.usedMetrage ?? 0);
  const hasIssues     = complianceIssues?.length > 0;

  const showModeSelector = !hasInvoices && !hasSplits && !isFull && !isLocked && mode === null;
  const showInvoiceForm  = mode === "invoice" && !isFull && !isLocked;
  const showSplitForm    = mode === "split"   && !isFull && !isLocked;

  const submitInvoice = async ({ number, usedMetrage, nfFile, correctionFile }) => {
    setSubmitting(true);
    try {
      await api.put("/cutting-records/invoices", {
        cuttingRecordId,
        singleInvoice: false,
        consumptions: [{
          id: consumption.id,
          invoices: [
            ...existInvoices.map(i => ({ number: invoiceNum(i), usedMetrage: i.usedMetrage })),
            { number, usedMetrage },
          ],
          splits: [],
        }],
      });
      if (nfFile)         await uploadFile(number, nfFile,         "NF"            ).catch(() => {});
      if (correctionFile) await uploadFile(number, correctionFile, "CARTA_CORRECAO").catch(() => {});
      toast.success(`NF ${number} apontada com sucesso`);
      setMode(null);
      onAllocationSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Erro ao apontar NF");
    } finally { setSubmitting(false); }
  };

  const submitSplits = async (splits) => {
    setSubmitting(true);
    try {
      await api.put("/cutting-records/invoices", {
        cuttingRecordId,
        singleInvoice: false,
        consumptions: [{
          id: consumption.id,
          invoices: [],
          splits: splits.map(sp => ({
            usedMetrage: Number(sp.usedMetrage),
            invoice: { number: sp.number.trim() },
          })),
        }],
      });
      await Promise.allSettled(
        splits.flatMap(sp => [
          sp.nfFile         ? uploadFile(sp.number.trim(), sp.nfFile,         "NF"            ) : null,
          sp.correctionFile ? uploadFile(sp.number.trim(), sp.correctionFile, "CARTA_CORRECAO") : null,
        ].filter(Boolean))
      );
      toast.success(`${splits.length} divisão(ões) salva(s)`);
      setMode(null);
      onAllocationSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Erro ao salvar divisões");
    } finally { setSubmitting(false); }
  };

  const borderCls = isOver ? "border-red-300" : hasIssues ? "border-amber-200" : "border-[#E3E1D9]";

  return (
    <div className={`border rounded-xl overflow-hidden bg-white ${borderCls}`}>

      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F8F7F4] transition-colors"
      >
        {isFull && !isOver
          ? <CheckCircle   className="w-4 h-4 text-green-500 flex-shrink-0" />
          : isOver
          ? <XCircle       className="w-4 h-4 text-red-500 flex-shrink-0" />
          : (hasInvoices || hasSplits)
          ? <Clock         className="w-4 h-4 text-blue-400 flex-shrink-0" />
          : <AlertTriangle className="w-4 h-4 text-[#E3E1D9] flex-shrink-0" />}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-semibold text-[#18170F]">{consumption.supplier || "SEM_FORNECEDOR"}</span>
            <span className="text-[10px] text-[#A09E98]">{consumption.layerQuantity ?? 1} camada(s)</span>
            {isLocked  && <StatusBadge type="locked" />}
            {isOver    && <StatusBadge type="overbilled" />}
            {isFull && !isOver && <StatusBadge type="completed" />}
            {hasSplits && <StatusBadge type="split" />}
            {hasIssues && !isFull && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold border px-1.5 py-0.5 rounded-full text-amber-700 bg-amber-50 border-amber-200">
                <AlertTriangle className="w-2.5 h-2.5" />
                {complianceIssues.length} pendência(s)
              </span>
            )}
          </div>
          <div className="text-[10px] text-[#A09E98] font-mono mt-0.5">
            {fmt(consumption.usedMetrage)} mm · {calcM2(consumption.usedMetrage, material).toFixed(2)} m²
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-mono text-[#6A6860]">
            {hasSplits ? `${existSplits.length} divisão(ões)` : `${existInvoices.length} NF(s)`}
          </span>
          {expanded
            ? <ChevronUp   className="w-3.5 h-3.5 text-[#A09E98]" />
            : <ChevronDown className="w-3.5 h-3.5 text-[#A09E98]" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[#E3E1D9] px-4 pb-4 pt-3">
          <BalanceBar consumption={consumption} />

          {/* Lock notice */}
          {isLocked && (
            <div className="flex items-center gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              <Lock className="w-3.5 h-3.5 flex-shrink-0" />
              Bloqueado — NF global aplicada a este consumo
            </div>
          )}

          {/* Saved invoices */}
          {!hasSplits && existInvoices.length > 0 && (
            <div className="space-y-2 mb-3">
              {existInvoices.map((inv, i) => <InvoiceItem key={i} invoice={inv} />)}
            </div>
          )}

          {/* Saved splits */}
          {hasSplits && (
            <div className="space-y-2 mb-3">
              {existSplits.map((sp, i) => <SplitItem key={sp.id ?? i} split={sp} />)}
            </div>
          )}

          {/* Mutual-exclusion notices */}
          {hasSplits && !isFull && !isLocked && (
            <div className="text-[11px] text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 mb-3">
              Modo divisão ativo — para editar, use "Dividir consumo" novamente
            </div>
          )}
          {hasInvoices && !isFull && !isLocked && !mode && (
            <div className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-3 flex items-center justify-between">
              <span>{fmt(avail)} mm restantes · apontar nova NF?</span>
              <button onClick={() => setMode("invoice")}
                className="ml-3 text-[11px] font-semibold text-blue-700 hover:underline flex-shrink-0">
                Adicionar NF →
              </button>
            </div>
          )}

          {/* Explicit mode selector — shown only when no data and mode not chosen */}
          {showModeSelector && <ModeSelector onSelect={setMode} />}

          {/* Invoice form */}
          {showInvoiceForm && (
            <InvoiceForm
              avail={avail}
              submitting={submitting}
              onSubmit={submitInvoice}
              onCancel={() => setMode(null)}
            />
          )}

          {/* Split form */}
          {showSplitForm && (
            <SplitForm
              consumption={consumption}
              submitting={submitting}
              onSubmit={submitSplits}
              onCancel={() => setMode(null)}
            />
          )}

          {/* Re-split button when splits exist and not full */}
          {hasSplits && !isFull && !isLocked && !mode && (
            <button onClick={() => setMode("split")}
              className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-purple-700 border border-purple-200 bg-purple-50 hover:bg-purple-100 rounded-lg px-3 py-1.5 transition-colors">
              <Scissors className="w-3.5 h-3.5" /> Redefinir divisões
            </button>
          )}

          {/* Inline compliance issues */}
          {hasIssues && (
            <div className="mt-3 space-y-1.5">
              {complianceIssues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5 text-amber-500" />
                  <span>{issue.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   SICAL ÚNICA SECTION
   Global single invoice applied to all consumptions.
══════════════════════════════════════════════ */
function SicalUnicaSection({ record, onSuccess }) {
  const [invoiceNumber,  setInvoiceNumber]  = useState("");
  const [nfFile,         setNfFile]         = useState(null);
  const [correctionFile, setCorrectionFile] = useState(null);
  const [submitting,     setSubmitting]     = useState(false);
  const [appliedNf,      setAppliedNf]      = useState(null);
  const inputRef = useRef();
  const nfRef    = useRef();
  const corrRef  = useRef();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const pendingConsumptions = (record.consumptions ?? []).filter(c => availableMm(c) > 0);
  const totalAvail          = pendingConsumptions.reduce((s, c) => s + availableMm(c), 0);
  const canSubmit           = invoiceNumber.trim() && totalAvail > 0;

  const handleApply = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await api.put("/cutting-records/invoices", {
        cuttingRecordId: record.id,
        singleInvoice: true,
        consumptions: pendingConsumptions.map(c => ({
          id: c.id,
          invoices: [
            ...(c.invoices ?? []).map(i => ({ number: invoiceNum(i), usedMetrage: i.usedMetrage })),
            { number: invoiceNumber.trim(), usedMetrage: availableMm(c) },
          ],
          splits: [],
        })),
      });
      const num = invoiceNumber.trim();
      if (nfFile)         await uploadFile(num, nfFile,         "NF"            ).catch(() => {});
      if (correctionFile) await uploadFile(num, correctionFile, "CARTA_CORRECAO").catch(() => {});
      toast.success(`NF ${num} aplicada a ${pendingConsumptions.length} consumo(s)`);
      setAppliedNf(num);
      onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Erro ao aplicar NF");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="border-t border-[#E3E1D9] pt-4 mt-1">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[#6A6860] mb-3 flex items-center gap-1.5">
        <ReceiptText className="w-3 h-3" /> Apontar NF única — aplicar a todos os consumos
      </div>

      <div className="flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-[#6A6860] flex items-center gap-1 mb-1">
            <Hash className="w-2.5 h-2.5" /> Número da NF <span className="text-red-500">*</span>
          </label>
          <input
            ref={inputRef}
            value={invoiceNumber}
            onChange={e => setInvoiceNumber(e.target.value)}
            onKeyDown={e => e.key === "Enter" && canSubmit && handleApply()}
            placeholder="Ex: NF-2024-00123"
            className="w-full text-[13px] font-mono bg-white border border-[#E3E1D9] rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
        <button onClick={handleApply} disabled={!canSubmit || submitting}
          className="flex items-center gap-2 text-[13px] font-medium text-white bg-blue-600 rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
          <ReceiptText className="w-4 h-4" />
          {submitting ? "Aplicando..." : `Aplicar a ${pendingConsumptions.length} consumo(s)`}
        </button>
      </div>

      <div className="mt-3 flex gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">NF</span>
          {nfFile
            ? <>
                <span className="text-[11px] text-[#18170F] max-w-[120px] truncate">{nfFile.name}</span>
                <button onClick={() => setNfFile(null)} className="text-[#A09E98] hover:text-red-500"><X className="w-3 h-3" /></button>
              </>
            : <button onClick={() => nfRef.current?.click()}
                className="flex items-center gap-1 text-[11px] text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg px-2 py-1 transition-colors">
                <Upload className="w-3 h-3" /> Nota Fiscal (PDF)
              </button>
          }
          <input ref={nfRef} type="file" accept="application/pdf" className="hidden"
            onChange={e => { setNfFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">CC</span>
          {correctionFile
            ? <>
                <span className="text-[11px] text-[#18170F] max-w-[120px] truncate">{correctionFile.name}</span>
                <button onClick={() => setCorrectionFile(null)} className="text-[#A09E98] hover:text-red-500"><X className="w-3 h-3" /></button>
              </>
            : <button onClick={() => corrRef.current?.click()}
                className="flex items-center gap-1 text-[11px] text-amber-600 border border-amber-200 bg-amber-50 hover:bg-amber-100 rounded-lg px-2 py-1 transition-colors">
                <Upload className="w-3 h-3" /> Carta Correção (opcional)
              </button>
          }
          <input ref={corrRef} type="file" accept="application/pdf" className="hidden"
            onChange={e => { setCorrectionFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
        </div>
      </div>

      {totalAvail > 0 && (
        <div className="mt-2 text-[11px] text-[#A09E98] font-mono">
          Total a faturar:{" "}
          <span className="text-[#18170F] font-semibold">{fmt(totalAvail)} mm</span>
          {" "}distribuídos entre {pendingConsumptions.length} consumo(s)
        </div>
      )}

      {totalAvail === 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
          <CheckCircle className="w-3.5 h-3.5" /> Todos os consumos já estão faturados
        </div>
      )}

      {appliedNf && (
        <div className="mt-4">
          <div className="text-[11px] text-[#6A6860] mb-1.5">
            Documentos da NF{" "}
            <span className="font-mono font-semibold text-[#18170F]">{appliedNf}</span>
          </div>
          <DocumentUpload invoiceNumber={appliedNf} />
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   RECORD MODAL
══════════════════════════════════════════════ */
function RecordModal({ record: initialRecord, onClose, onRecordsChange }) {
  const [record,        setRecord]        = useState(initialRecord);
  const [compliance,    setCompliance]    = useState(null);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [sicalUnique,   setSicalUnique]   = useState(false);

  const loadCompliance = useCallback(() => {
    api.get(`/cutting-records/${record.id}/compliance-checklist`)
      .then(r => setCompliance(r.data))
      .catch(() => {});
  }, [record.id]);

  useEffect(() => { loadCompliance(); }, [loadCompliance]);

  const complianceByConsumption = useMemo(() => {
    if (!compliance?.items) return {};
    return compliance.items
      .filter(i => !i.passed)
      .reduce((acc, item) => {
        const key = item.consumptionId;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});
  }, [compliance]);

  const handleAllocationSuccess = async () => {
    try {
      const res = await api.get("/cutting");
      const all   = Array.isArray(res.data) ? res.data : [];
      const fresh = all.find(r => r.id === record.id);
      if (fresh) setRecord(fresh);
      onRecordsChange?.(all);
    } catch {}
    loadCompliance();
  };

  const pct = recordBilledPct(record);

  const checklistColor = compliance === null || compliance.compliant
    ? "text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100"
    : "text-red-700 border-red-200 bg-red-50 hover:bg-red-100";

  return (
    <>
      {checklistOpen && <ChecklistDrawer record={record} onClose={() => setChecklistOpen(false)} />}

      <div className="fixed inset-0 z-40 flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[760px] max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E3E1D9] flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-base font-semibold font-mono flex-shrink-0">{record.orderNumber}</span>
              <MaterialBadge material={record.material} />
              <span className="text-[11px] text-[#A09E98] truncate">{record.orderDescription}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <button onClick={() => setChecklistOpen(true)}
                className={`flex items-center gap-1.5 text-[12px] font-medium border rounded-lg px-3 py-1.5 transition-colors ${checklistColor}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                Checklist
                {compliance && !compliance.compliant && (
                  <span className="text-[10px] bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {compliance.failedItems}
                  </span>
                )}
              </button>
              <button onClick={onClose}
                className="text-[#A09E98] hover:text-[#18170F] p-1.5 rounded-lg hover:bg-[#F8F7F4] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* Summary card */}
            <div className="bg-[#F8F7F4] border border-[#E3E1D9] rounded-xl px-5 py-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[#6A6860] mb-0.5">Total do Corte</div>
                  <div className="font-mono text-[18px] font-bold text-[#18170F]">{getTotalM2(record).toFixed(2)} m²</div>
                </div>
                <div className="flex-1 mx-5">
                  <div className="h-2 bg-[#E3E1D9] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-blue-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {pct < 100 && (
                    <div className="text-[10px] font-mono text-[#A09E98] mt-0.5 text-center">
                      {pct}% faturado · {100 - pct}% restante
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[#6A6860] mb-0.5">Progresso</div>
                  <div className={`font-mono text-[18px] font-bold ${pct === 100 ? "text-green-600" : "text-blue-600"}`}>{pct}%</div>
                </div>
              </div>

              <div className="border-t border-[#E3E1D9] pt-3">
                <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                  <input
                    type="checkbox"
                    checked={sicalUnique}
                    onChange={e => setSicalUnique(e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-[13px] font-semibold text-[#18170F]">Nota Sical única</span>
                  <span className="text-[11px] text-[#A09E98]">— uma NF cobre todos os consumos</span>
                </label>
                {sicalUnique && (
                  <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <Lock className="w-3 h-3 flex-shrink-0" />
                    Consumos individuais bloqueados enquanto este modo estiver ativo
                  </div>
                )}
              </div>

              {sicalUnique && (
                <SicalUnicaSection record={record} onSuccess={handleAllocationSuccess} />
              )}
            </div>

            {/* Individual consumptions */}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[#6A6860] px-1 mb-2">
                Consumos ({(record.consumptions ?? []).length})
              </div>
              <div className="space-y-3">
                {(record.consumptions ?? []).map(c => (
                  <ConsumptionCard
                    key={c.id}
                    consumption={c}
                    cuttingRecordId={record.id}
                    material={record.material}
                    singleInvoice={sicalUnique}
                    onAllocationSuccess={handleAllocationSuccess}
                    complianceIssues={complianceByConsumption[c.id] ?? []}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export function CuttingRecordInvoicePage() {
  const [records,        setRecords]        = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [startDate,      setStartDate]      = useState("");
  const [endDate,        setEndDate]        = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [materialFilter, setMaterialFilter] = useState("");
  const [statusFilter,   setStatusFilter]   = useState("all"); // "all" | "pending" | "partial" | "completed"
  const [showOverbilled, setShowOverbilled] = useState(false);
  const [loading,        setLoading]        = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/cutting");
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch { toast.error("Erro ao carregar registros"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const filteredRecords = useMemo(() => {
    let data = Array.isArray(records) ? [...records] : [];
    if (startDate) { const s = new Date(startDate); s.setHours(0,0,0,0);      data = data.filter(r => new Date(r.createdAt) >= s); }
    if (endDate)   { const e = new Date(endDate);   e.setHours(23,59,59,999); data = data.filter(r => new Date(r.createdAt) <= e); }
    if (supplierFilter) data = data.filter(r => (r.consumptions ?? []).some(c => c.supplier === supplierFilter));
    if (materialFilter) data = data.filter(r => r.material?.toUpperCase() === materialFilter);
    if (statusFilter !== "all") data = data.filter(r => getRecordStatus(r) === statusFilter);
    if (showOverbilled) data = data.filter(r => isOverbilled(r));
    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return data;
  }, [records, startDate, endDate, supplierFilter, materialFilter, statusFilter, showOverbilled]);

  const suppliers = useMemo(() => [...new Set((records ?? []).flatMap(r => (r.consumptions ?? []).map(c => c.supplier)).filter(Boolean))], [records]);
  const materials = useMemo(() => [...new Set((records ?? []).map(r => r.material).filter(Boolean))], [records]);

  const clearFilters = () => {
    setStartDate(""); setEndDate(""); setSupplierFilter(""); setMaterialFilter("");
    setStatusFilter("all"); setShowOverbilled(false);
  };

  const handleRecordsChange = (newRecords) => {
    setRecords(newRecords);
    if (selectedRecord) {
      const fresh = newRecords.find(r => r.id === selectedRecord.id);
      if (fresh) setSelectedRecord(fresh);
    }
  };

  const counts = useMemo(() => ({
    all:       records.length,
    pending:   records.filter(r => getRecordStatus(r) === "pending").length,
    partial:   records.filter(r => getRecordStatus(r) === "partial").length,
    completed: records.filter(r => getRecordStatus(r) === "completed").length,
    over:      records.filter(r => isOverbilled(r)).length,
  }), [records]);

  const STATUS_TABS = [
    { key: "all",       label: "Todos",      count: counts.all },
    { key: "pending",   label: "Pendentes",  count: counts.pending },
    { key: "partial",   label: "Parciais",   count: counts.partial },
    { key: "completed", label: "Concluídos", count: counts.completed },
  ];

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      {selectedRecord && (
        <RecordModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onRecordsChange={handleRecordsChange}
        />
      )}

      <div className="flex flex-col h-screen bg-[#F2F1ED] font-sans text-[13px]">

        {/* Topbar */}
        <div className="bg-white border-b border-[#E3E1D9] px-5 h-12 flex items-center gap-4 flex-shrink-0">
          <span className="text-[13px] font-semibold text-[#18170F]">Faturamento de Cortes</span>
          <div className="flex items-center gap-3 ml-auto">
            {counts.pending > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                <AlertTriangle className="w-3 h-3" /> {counts.pending} pendente(s)
              </span>
            )}
            {counts.over > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full font-medium">
                <XCircle className="w-3 h-3" /> {counts.over} excedido(s)
              </span>
            )}
            <button onClick={fetchRecords} disabled={loading}
              className="flex items-center gap-1.5 text-[11px] text-[#6A6860] border border-[#E3E1D9] rounded-lg px-3 py-1.5 hover:bg-[#F8F7F4] transition-colors disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Atualizar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">

          {/* Filters */}
          <div className="bg-white border border-[#E3E1D9] rounded-xl p-4 mb-4">
            <div className="flex flex-wrap gap-3 mb-3">
              {[{ label: "De", val: startDate, set: setStartDate }, { label: "Até", val: endDate, set: setEndDate }].map(({ label, val, set }) => (
                <div key={label} className="flex flex-col gap-0.5 min-w-[130px]">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[#A09E98]">{label}</span>
                  <input type="date" value={val} onChange={e => set(e.target.value)}
                    className="font-sans text-[12px] text-[#18170F] bg-[#F8F7F4] border border-[#E3E1D9] rounded-lg px-2 py-1.5 outline-none" />
                </div>
              ))}
              {[
                { label: "Fornecedor", val: supplierFilter, set: setSupplierFilter, opts: suppliers },
                { label: "Material",   val: materialFilter, set: setMaterialFilter, opts: materials },
              ].map(({ label, val, set, opts }) => (
                <div key={label} className="flex flex-col gap-0.5 min-w-[150px]">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[#A09E98]">{label}</span>
                  <select value={val} onChange={e => set(e.target.value)}
                    className="font-sans text-[12px] text-[#18170F] bg-[#F8F7F4] border border-[#E3E1D9] rounded-lg px-2 py-1.5 appearance-none outline-none">
                    <option value="">Todos</option>
                    {opts.map((o, i) => <option key={i} value={o.toUpperCase()}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div className="flex items-end">
                <button onClick={clearFilters}
                  className="text-[11px] text-[#A09E98] border border-[#E3E1D9] rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                  Limpar tudo
                </button>
              </div>
            </div>

            {/* Status tabs */}
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[#E3E1D9]">
              {STATUS_TABS.map(({ key, label, count }) => (
                <button key={key} onClick={() => setStatusFilter(key)}
                  className={`text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                    statusFilter === key
                      ? "bg-[#18170F] text-white border-[#18170F]"
                      : "text-[#6A6860] border-[#E3E1D9] hover:bg-[#F8F7F4]"
                  }`}>
                  {label}
                  <span className={`ml-1.5 text-[10px] ${statusFilter === key ? "opacity-70" : "text-[#A09E98]"}`}>{count}</span>
                </button>
              ))}
              <button onClick={() => setShowOverbilled(v => !v)}
                className={`text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                  showOverbilled
                    ? "bg-red-600 text-white border-red-600"
                    : counts.over > 0
                    ? "text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
                    : "text-[#A09E98] border-[#E3E1D9] hover:bg-[#F8F7F4]"
                }`}>
                Excedidos
                {counts.over > 0 && (
                  <span className={`ml-1.5 text-[10px] ${showOverbilled ? "opacity-70" : ""}`}>{counts.over}</span>
                )}
              </button>
            </div>
          </div>

          {/* Record list */}
          <div className="bg-white border border-[#E3E1D9] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E3E1D9] bg-[#F8F7F4] flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6860]">
                Cortes ({filteredRecords.length})
              </span>
              <span className="text-[10px] text-[#A09E98] font-mono">Clique em um corte para apontar NFs</span>
            </div>
            <div className="p-3 space-y-2">
              {loading && (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              )}
              {!loading && filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-8 h-8 text-[#E3E1D9] mx-auto mb-2" />
                  <div className="text-[13px] font-medium text-[#18170F]">Nenhum registro encontrado</div>
                  <div className="text-[11px] text-[#A09E98] mt-1">Tente ajustar os filtros ou a aba de status</div>
                </div>
              )}
              {!loading && filteredRecords.map(r => (
                <RecordRow key={r.id} record={r} onClick={() => setSelectedRecord(r)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
