import { useEffect, useState } from "react";
import { AlertTriangle, Clock, CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import toast from "react-hot-toast";
import api from "../../config/apiService";

const BUCKET_META = {
  CURRENT:   { label: "0–7 dias",   color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200",  bar: "#22c55e" },
  ATTENTION: { label: "8–15 dias",  color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200", bar: "#eab308" },
  WARNING:   { label: "16–30 dias", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", bar: "#f97316" },
  CRITICAL:  { label: "> 30 dias",  color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200",    bar: "#ef4444" },
};

function BucketIcon({ bucket }) {
  if (bucket === "CURRENT")   return <CheckCircle className="w-4 h-4 text-green-600" />;
  if (bucket === "ATTENTION") return <Clock className="w-4 h-4 text-yellow-600" />;
  if (bucket === "WARNING")   return <AlertTriangle className="w-4 h-4 text-orange-600" />;
  return <XCircle className="w-4 h-4 text-red-600" />;
}

function SummaryCard({ bucket, count }) {
  const m = BUCKET_META[bucket];
  return (
    <div className={`rounded-xl border ${m.border} ${m.bg} px-5 py-4 flex flex-col gap-1`}>
      <div className="flex items-center gap-2">
        <BucketIcon bucket={bucket} />
        <span className={`text-[11px] font-semibold uppercase tracking-wide ${m.color}`}>{m.label}</span>
      </div>
      <div className={`text-[28px] font-bold font-mono ${m.color}`}>{count ?? 0}</div>
      <div className="text-[11px] text-[#A09E98]">corte(s) com pendência</div>
    </div>
  );
}

function RecordRow({ item }) {
  const [open, setOpen] = useState(false);
  const m = BUCKET_META[item.bucket];

  return (
    <div className={`border rounded-xl overflow-hidden ${open ? "border-[#93B4FB]" : "border-[#E3E1D9]"} bg-white`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F8F7F4] transition-colors"
      >
        <BucketIcon bucket={item.bucket} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-[13px]">{item.orderNumber}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${m.color} ${m.bg} ${m.border}`}>
              {m.label}
            </span>
          </div>
          <div className="text-[11px] text-[#A09E98] mt-0.5">
            {item.unbilledConsumptions}/{item.totalConsumptions} consumo(s) sem NF ·{" "}
            {new Date(item.createdAt).toLocaleDateString("pt-BR")} ·{" "}
            <span className="font-mono">{item.daysSinceCreation}d atrás</span>
          </div>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-[#A09E98] flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-[#A09E98] flex-shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-[#E3E1D9] px-4 pb-4 pt-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[#6A6860] mb-2">Consumos sem faturamento</div>
          <div className="space-y-1.5">
            {item.unbilled.map(u => (
              <div key={u.consumptionId} className="flex items-center justify-between bg-[#F8F7F4] border border-[#E3E1D9] rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E3E1D9]" />
                  <span className="text-[12px] text-[#6A6860] font-medium">{u.supplier}</span>
                  <span className="text-[11px] text-[#A09E98] font-mono">consumo #{u.consumptionId}</span>
                </div>
                <span className="font-mono text-[12px] font-semibold text-[#18170F]">{u.usedMetrage} mm</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AgingPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bucketFilter, setBucketFilter] = useState("ALL");

  const load = () => {
    setLoading(true);
    api.get("/cutting-records/invoices/aging")
      .then(r => setData(r.data))
      .catch(() => toast.error("Erro ao carregar relatório de aging"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const chartData = data
    ? Object.entries(BUCKET_META).map(([key, meta]) => ({
        name: meta.label,
        bucket: key,
        total: data.summary?.[key] ?? 0,
        fill: meta.bar,
      }))
    : [];

  const filteredItems = (data?.items ?? []).filter(i => bucketFilter === "ALL" || i.bucket === bucketFilter);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <div className="flex flex-col h-screen bg-[#F2F1ED] font-sans text-[13px]">
        {/* Topbar */}
        <div className="bg-white border-b border-[#E3E1D9] px-5 h-12 flex items-center justify-between flex-shrink-0">
          <span className="text-[13px] font-semibold text-[#18170F]">Aging de Faturamento</span>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-[11px] text-[#6A6860] border border-[#E3E1D9] rounded-lg px-3 py-1.5 hover:bg-[#F8F7F4] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Carregando..." : "Atualizar"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center justify-center h-40 text-[#A09E98] text-sm">
              Carregando dados de aging...
            </div>
          )}

          {data && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {Object.keys(BUCKET_META).map(b => (
                  <SummaryCard key={b} bucket={b} count={data.summary?.[b] ?? 0} />
                ))}
              </div>

              {/* Chart */}
              <div className="bg-white border border-[#E3E1D9] rounded-xl p-5 mb-6">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6860] mb-4">Distribuição por Tempo</div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} barSize={40}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#A09E98" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#A09E98" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E3E1D9" }}
                      cursor={{ fill: "#F8F7F4" }}
                      formatter={(v) => [v, "cortes"]}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Filter + List */}
              <div className="bg-white border border-[#E3E1D9] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E3E1D9] bg-[#F8F7F4] flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6A6860]">
                    Cortes com Pendência ({filteredItems.length})
                  </span>
                  <div className="flex gap-1">
                    {["ALL", ...Object.keys(BUCKET_META)].map(b => (
                      <button
                        key={b}
                        onClick={() => setBucketFilter(b)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-colors ${
                          bucketFilter === b
                            ? "bg-[#18170F] text-white"
                            : "text-[#6A6860] hover:bg-[#E3E1D9]"
                        }`}
                      >
                        {b === "ALL" ? "Todos" : BUCKET_META[b].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  {filteredItems.length === 0 && (
                    <div className="text-center py-10 text-[#A09E98] text-[12px]">
                      {bucketFilter === "ALL"
                        ? "Nenhum corte com pendência de faturamento"
                        : "Nenhum corte nesta faixa"}
                    </div>
                  )}
                  {filteredItems.map(item => (
                    <RecordRow key={item.cuttingRecordId} item={item} />
                  ))}
                </div>
              </div>

              {data.generatedAt && (
                <div className="mt-3 text-center text-[10px] text-[#A09E98] font-mono">
                  Gerado em {new Date(data.generatedAt).toLocaleString("pt-BR")}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
