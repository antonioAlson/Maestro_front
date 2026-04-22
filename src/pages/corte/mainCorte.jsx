import { useState, useEffect, useMemo, useRef } from "react";
import {
  Scissors,
  RefreshCw,
  Search,
  Eye,
  Pencil,
  Trash2,
  Plus,
  X,
  Package,
  Layers,
  AlertCircle,
  Info,
  ChevronDown,
  Calendar,
  Loader2,
  CheckCircle2,
  ClipboardList,
  TrendingUp,
  Database,
} from "lucide-react";
import api from "../../config/apiService";

//Helper
const materialConfig = (mat) => {
  const u = (mat || "").toUpperCase();
  if (u === "ARAMIDA")
    return {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-200",
      dot: "bg-yellow-500",
    };
  if (u.startsWith("TENSYLON"))
    return {
      bg: "bg-blue-100",
      text: "text-blue-800",
      border: "border-blue-200",
      dot: "bg-blue-500",
    };
  return {
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
    dot: "bg-gray-400",
  };
};

const fmt = (v, d = 1) =>
  Number(v).toLocaleString("pt-BR", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

const fmtDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const toDateInput = (date) => {
  if (!date) return "";

  return new Date(date).toISOString().slice(0, 10);
};
const truncate = (s, n = 15) => (s && s.length > n ? s.slice(0, n) + "…" : s);
const totalMeters = (r) =>
  r.consumptions.reduce((s, c) => s + (parseFloat(c.usedMetrage) || 0), 0);
const totalPlates = (r) => r.consumptions.length;
const uniqueSuppliers = (r) =>
  [...new Set(r.consumptions.map((c) => c.supplier).filter(Boolean))].join(
    ", ",
  );

const newConsumption = () => ({
  id: Date.now(),
  supplier: "",
  plate: "",
  batch: "",
  layers: "",
  usedMetrage: "",
  plateStatus: null,
  plateLoading: false,
});

const today = new Date().toISOString().slice(0, 10);

// Shared UI Primitives
function SelectField({ label, value, onChange, options, disabled, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full appearance-none px-4 py-2.5 border rounded-xl text-sm pr-8 transition-all
            ${
              disabled
                ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
                : "bg-white border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            }`}
        >
          <option value="">— Selecione —</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>
    </div>
  );
}

const calcConsumptionArea = (usedMetrage, material, supplier) => {
  const mm = Number(usedMetrage || 0);
  if (isNaN(mm) || mm === 0) return 0;
  const width = (supplier || "").toUpperCase() === "PROTECTA" ? 1.5 : 1.6;
  const base = (mm / 1000) * width;
  if ((material || "").toUpperCase() !== "ARAMIDA") return base;
  if (mm < 2990) return base + 0.008;
  if (mm < 5980) return base + 0.024;
  if (mm < 8970) return base + 0.04;
  if (mm < 11960) return base + 0.056;
  if (mm < 14950) return base + 0.064;
  return base;
};

const calcTotalArea = (record) => {
  if (!record.consumptions) return 0;
  return record.consumptions.reduce((total, c) => {
    return total + calcConsumptionArea(c.usedMetrage, record.material, c.supplier);
  }, 0);
};

function TextField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  type = "text",
  required,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={disabled ? "" : placeholder}
        className={`px-4 py-2.5 border rounded-xl text-sm transition-all
          ${
            disabled
              ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
              : "bg-white border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
          }`}
      />
    </div>
  );
}

function MaterialBadge({ material }) {
  const c = materialConfig(material);
  if (!material) return <span className="text-gray-300 text-sm">—</span>;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${c.bg} ${c.text} ${c.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      <Layers size={10} />
      {material}
    </span>
  );
}

// ─── Stat Card (header summary) ───────────────────────────────────────────────
function StatCard({ icon: Icon, iconBg, label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
      <div
        className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}
      >
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        {sub && (
          <p className="text-xs font-medium text-blue-600 mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}

// Consumption Row
function ConsumptionRow({
  row,
  index,
  material,
  viewMode,
  onChange,
  onRemove,
  metadata,
}) {
  const timerRef = useRef(null);
  const isTensylon = (material || "").toUpperCase().startsWith("TENSYLON");
  const isOpera = row.supplier === "OPERA";
  const showPlate = isOpera && !isTensylon;

  const handlePlateChange = async (val) => {
    onChange(index, {
      ...row,
      plate: val,
      batch: "",
      layers: "",
      plateStatus: null,
      plateLoading: !!val,
    });
    clearTimeout(timerRef.current);
    if (!val) return;
    const plateid = val.split("-")[0];
    timerRef.current = setTimeout(async () => {
      try {
        const res = await api.get("/plate/" + plateid);
        const plate = res.data;

        onChange(index, {
          ...row,
          plate: val,
          plateLoading: false,
          plateStatus: "found",
          batch: plate.workorderLote,
          layers: plate.layers,
          actualSize: plate.actualSize,
        });
      } catch {
        onChange(index, {
          ...row,
          plate: val,
          plateLoading: false,
          plateStatus: "notfound",
          batch: "",
          layers: "",
        });
      }
    }, 1500);
  };

  return (
    <div className="border border-gray-200 rounded-2xl bg-gray-100 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center justify-center">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-sm font-semibold text-gray-600">Consumo</span>
          {Number(row.usedMetrage) > 0 && (() => {
            const mm = Number(row.usedMetrage);
            const width = (row.supplier || "").toUpperCase() === "PROTECTA" ? 1.5 : 1.6;
            const base = (mm / 1000) * width;
            const withTax = calcConsumptionArea(row.usedMetrage, material, row.supplier);
            const isAramida = (material || "").toUpperCase() === "ARAMIDA";
            return (
              <>
                <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-600 font-medium">
                  {fmt(base, 3)} m² <span className="font-normal text-gray-400 ml-0.5">s/ taxa</span>
                </div>
                {isAramida && (
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 font-medium">
                    {fmt(withTax, 3)} m² <span className="font-normal text-blue-400 ml-0.5">c/ taxa</span>
                  </div>
                )}
              </>
            );
          })()}
        </div>
        {!viewMode && (
          <button
            onClick={() => onRemove(index)}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            <Trash2 size={12} /> Remover
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <SelectField
          label="Fornecedor"
          value={row.supplier}
          onChange={(v) =>
            onChange(index, {
              ...row,
              supplier: v,
              plate: "",
              batch: "",
              layers: "",
              actualSize: "",
              plateStatus: null,
            })
          }
          options={metadata.suppliers}
          disabled={viewMode}
          required
        />

        {showPlate && (
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Placa
            </label>
            <div className="relative">
              <input
                type="text"
                value={row.plate}
                onChange={(e) => handlePlateChange(e.target.value)}
                disabled={viewMode}
                placeholder="Ex: 123-0091"
                className={`w-full px-4 py-2.5 border rounded-xl text-sm pr-9 transition-all
                  ${
                    viewMode
                      ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
                      : "bg-white border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  }`}
              />
              {row.plateLoading && (
                <Loader2
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin"
                />
              )}
            </div>
            {row.plateStatus === "notfound" && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                <AlertCircle size={12} /> Placa não encontrada
              </div>
            )}
            {row.plateStatus === "found" && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 font-medium">
                <Info size={12} /> Disponível: {row.actualSize} mm
              </div>
            )}
          </div>
        )}

        <TextField
          label="Lote"
          value={row.batch}
          onChange={(v) => onChange(index, { ...row, batch: v })}
          disabled={viewMode || (isOpera && !isTensylon)}
          placeholder="Ex: M04300126M000001"
        />
        {!isTensylon && (
          <TextField
            label="Camadas"
            value={row.layers}
            onChange={(v) => onChange(index, { ...row, layers: v })}
            disabled={viewMode || isOpera}
            placeholder="0"
            type="number"
          />
        )}
        <TextField
          label="Metragem Utilizada (mm)"
          value={row.usedMetrage}
          onChange={(v) => onChange(index, { ...row, usedMetrage: v })}
          disabled={viewMode || !row.supplier}
          placeholder="0.0"
          type="number"
        />
      </div>
    </div>
  );
}

// Modal
function CuttingModal({ mode, record, onClose, onSave, metadata, showToast }) {
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const today = new Date().toLocaleDateString("en-CA");

  const [form, setForm] = useState(() =>
    record
      ? {
          ...record,

          productionDate: record.productionDate
            ? new Date(record.productionDate).toISOString().slice(0, 10)
            : "",

          consumptions: record.consumptions.map((c) => ({
            ...c,
            id: c.id,
            supplier: c.supplier,
            plate: c.plateId ? String(c.plateId) : "",
            batch: c.batchNumber || "",
            layers: c.layerQuantity || "",
            usedMetrage: c.usedMetrage || "",
            actualSize: "",
            plateStatus: null,
            plateLoading: false,
          })),
        }
      : {
          orderNumber: "",
          orderDescription: "",
          material: "",
          kitType: "",
          seal: "",
          productionDate: today,
          consumptions: [],
        },
  );
  const [saving, setSaving] = useState(false);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const updateConsumption = (i, val) =>
    setForm((f) => {
      const a = [...f.consumptions];
      a[i] = val;
      return { ...f, consumptions: a };
    });
  const removeConsumption = (i) =>
    setForm((f) => ({
      ...f,
      consumptions: f.consumptions.filter((_, idx) => idx !== i),
    }));
  const addConsumption = () =>
    setForm((f) => ({
      ...f,
      consumptions: [...f.consumptions, newConsumption()],
    }));

  const handleSave = async () => {
    if (saving) return;

    try {
      setSaving(true);

      const payload = {
        orderNumber: form.orderNumber,
        orderDescription: form.orderDescription,
        material: form.material,
        seal: form.seal,
        kitType: form.kitType,
        productionDate: new Date(form.productionDate).toISOString(),
        consumptions: form.consumptions.map((c) => ({
          invoiceNumber: null,
          batchNumber: c.batch,
          usedMetrage: Number(c.usedMetrage),
          supplier: c.supplier,
          layerQuantity: c.layers,
          plateId: c.plate.split("-")[0] || null,
        })),
      };

      if (mode === "create") {
        await api.post("/cutting", payload);

        showToast?.("Registro criado");
      } else {
        await api.put("/cutting/" + record.id, payload);

        showToast?.("Registro atualizado");
      }

      onClose(); // fecha modal

      await onSave(); // recarrega tabela
    } catch (e) {
      console.error(e);

      showToast?.("Erro ao salvar", "error");
    } finally {
      setSaving(false);
    }
  };

  const modalMeta = {
    create: {
      title: "Criar Registro de Corte",
      iconBg: "bg-gradient-to-br from-green-500 to-emerald-600",
    },
    view: {
      title: "Visualizar Registro de Corte",
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
    },
    edit: {
      title: "Editar Registro de Corte",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
    },
  }[mode];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-6 pb-6 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl mx-4 rounded-2xl shadow-2xl border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`${modalMeta.iconBg} p-2 rounded-xl`}>
              <Scissors size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {modalMeta.title}
              </h2>
              {record && (
                <p className="text-xs text-gray-500">{record.orderNumber}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Basic Info Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                <ClipboardList size={16} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Informações Básicas
                </h3>
                <p className="text-xs text-gray-500">
                  Dados principais do registro
                </p>
              </div>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              <TextField
                label="Número da Ordem"
                value={form.orderNumber}
                onChange={(v) => setField("orderNumber", v)}
                disabled={isView}
                required
                placeholder="54321"
              />
              <SelectField
                label="Material"
                value={form.material}
                onChange={(v) => setField("material", v)}
                options={metadata.material}
                disabled={isView}
                required
              />
              <SelectField
                label="Tipo de Kit"
                value={form.kitType}
                onChange={(v) => setField("kitType", v)}
                options={metadata.kitType}
                disabled={isView}
                required
              />
              <TextField
                label="Data de Produção"
                value={form.productionDate}
                onChange={(v) => setField("productionDate", v)}
                disabled={isView}
                type="date"
                required
              />
            </div>
            <div className="px-5 pb-5 grid grid-cols-2 gap-4">
              <TextField
                label="Descrição da Ordem (Veículo)"
                value={form.orderDescription}
                onChange={(v) => setField("orderDescription", v)}
                disabled={isView}
                placeholder="Ex: Ford Ranger Raptor Seat Cover Assembly"
              />

              <TextField
                label="Lacre"
                value={form.seal}
                onChange={(v) => setField("seal", v)}
                disabled={isView}
                placeholder="Ex: 000123"
              />
            </div>
          </div>

          {/* Consumption Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Package size={16} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Consumo de Material
                  </h3>
                  <p className="text-xs text-gray-500">
                    {form.consumptions.length} item(s) registrado(s)
                  </p>
                </div>
              </div>
              {!isView && (
                <button
                  onClick={addConsumption}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-sm"
                >
                  <Plus size={12} /> Adicionar
                </button>
              )}
            </div>

            <div className="p-5 space-y-3">
              {form.consumptions.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Package size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">
                    {isView
                      ? "Nenhum consumo registrado."
                      : "Nenhum item adicionado. Clique em Adicionar."}
                  </p>
                </div>
              ) : (
                form.consumptions.map((row, i) => (
                  <ConsumptionRow
                    key={row.id}
                    row={row}
                    index={i}
                    material={form.material}
                    metadata={metadata}
                    viewMode={isView}
                    onChange={updateConsumption}
                    onRemove={removeConsumption}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-100 transition-colors font-medium"
          >
            {isView ? "Fechar" : "Cancelar"}
          </button>
          {!isView && (
            <button
              onClick={() => handleSave(form)}
              disabled={saving}
              className={`flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm rounded-xl ${saving ? "opacity-60 cursor-not-allowed" : "hover:from-green-600 hover:to-emerald-700 hover:scale-105"} transition-all font-semibold shadow-lg`}
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Salvando...
                </>
              ) : isEdit ? (
                "Atualizar"
              ) : (
                "Salvar"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function CuttingRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const today = new Date().toLocaleDateString("en-CA");
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [toast, setToast] = useState(null);

  const handleSave = async () => {
    await fetchData();
  };

  const [metadata, setMetadata] = useState({
    suppliers: [],
    material: [],
    kitType: [],
  });

  useEffect(() => {
    fetchData();

    fetchMetadata();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const res = await api.get("/cutting");
      setRecords(
        (res.data || []).sort(
          (a, b) => new Date(b.productionDate) - new Date(a.productionDate),
        ),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMetadata() {
    try {
      const res = await api.get("/cutting/metadata");
      const data = res.data;
      if (!data.suppliers.includes("PROTECTA")) {
        data.suppliers = [...data.suppliers, "PROTECTA"].sort();
      }
      setMetadata(data);
    } catch (e) {
      console.error(e);
    }
  }

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(
    () =>
      records.filter((r) => {
        const q = search.toLowerCase();
        const from = dateFrom ? new Date(dateFrom + "T00:00:00") : null;
        const to = dateTo ? new Date(dateTo + "T23:59:59") : null;
        const prodDate = new Date(r.productionDate);

        return (
          (!q ||
            r.orderNumber.toLowerCase().includes(q) ||
            r.orderDescription.toLowerCase().includes(q) ||
            r.material.toLowerCase().includes(q)) &&
          (!from || prodDate >= from) &&
          (!to || prodDate <= to)
        );
      }),
    [records, search, dateFrom, dateTo],
  );

  const handleDelete = async (id) => {
    if (!window.confirm("Excluir este registro de corte?")) return;
    try {
      await api.delete("/cutting/" + id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      showToast("Registro excluído");
    } catch (e) {
      showToast("Erro ao excluir", "error");
    }
  };

  const totalM = filtered.reduce((s, r) => s + totalMeters(r), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans text-gray-800">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg text-sm font-medium backdrop-blur-sm
          ${toast.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={15} />
          ) : (
            <AlertCircle size={15} />
          )}
          {toast.msg}
        </div>
      )}

      <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-6">
        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Registros de Corte
            </h1>
            <p className="text-gray-500">
              Histórico de Produção · Rastreamento de Consumo de Material
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchData();
              }}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 text-sm rounded-xl hover:bg-gray-50 transition-all font-medium shadow-sm"
            >
              <RefreshCw size={14} /> Atualizar
            </button>
            <button
              onClick={() => setModal({ mode: "create", record: null })}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Scissors size={14} /> Criar Corte
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={ClipboardList}
            iconBg="bg-gradient-to-br from-blue-500 to-indigo-600"
            label="Total de Registros"
            value={filtered.length}
          />
          <StatCard
            icon={TrendingUp}
            iconBg="bg-gradient-to-br from-green-500 to-emerald-600"
            label="Metragem Total"
            value={`${fmt(filtered.reduce((s, r) => s + totalMeters(r), 0))} mm`}
          />
          <StatCard
            icon={Package}
            iconBg="bg-gradient-to-br from-purple-500 to-violet-600"
            label="Total de Placas"
            value={filtered.reduce((s, r) => s + totalPlates(r), 0)}
          />
          <StatCard
            icon={Database}
            iconBg="bg-gradient-to-br from-amber-500 to-orange-500"
            label="Filtrado"
            value={filtered.length}
            sub={`${fmt(totalM)} mm`}
          />
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5 flex-1 min-w-52">
            <label className="block text-sm font-medium text-gray-700">
              Buscar
            </label>
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ordem, descrição, material..."
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <Calendar size={13} /> Data Início
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
              <Calendar size={13} /> Data Fim
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {(search || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setSearch("");
                setDateFrom(today);
                setDateTo("");
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 text-sm text-gray-500 rounded-xl hover:bg-gray-50 transition-all"
            >
              <X size={13} /> Limpar
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 size={28} className="animate-spin mb-3 text-blue-500" />
              <p className="text-sm">Carregando registros...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {[
                      "DT. Produção",
                      "OS",
                      "Descrição",
                      "Material",
                      "Tipo de Kit",
                      "Fornec.",
                      "Placas",
                      "Total Metros",
                      "Total M²",
                      "Ações",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="text-center py-14 text-gray-400"
                      >
                        <Search size={28} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhum registro encontrado.</p>
                      </td>
                    </tr>
                  )}
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs font-mono text-gray-500 whitespace-nowrap">
                        {fmtDate(r.productionDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-gray-800">
                          {r.orderNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-48">
                        <span title={r.orderDescription} className="text-sm">
                          {truncate(r.orderDescription)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <MaterialBadge material={r.material} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                          {r.kitType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {uniqueSuppliers(r) || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                          <Package size={13} className="text-gray-400" />
                          {totalPlates(r)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-blue-600">
                          {(totalMeters(r)).toFixed(0)} mm
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-blue-600">
                          {calcTotalArea(r).toFixed(3)} m²
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setModal({ mode: "view", record: r })
                            }
                            title="Visualizar"
                            className="w-8 h-8 flex items-center justify-center text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() =>
                              setModal({ mode: "edit", record: r })
                            }
                            title="Editar"
                            className="w-8 h-8 flex items-center justify-center text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            title="Excluir"
                            className="w-8 h-8 flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
              <span>
                Exibindo{" "}
                <span className="font-semibold text-gray-700">
                  {filtered.length}
                </span>{" "}
                de{" "}
                <span className="font-semibold text-gray-700">
                  {records.length}
                </span>{" "}
                registros
              </span>
              <span className="font-bold text-blue-600">
                {fmt(totalM)} mm consumidos no filtro
              </span>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <CuttingModal
          mode={modal.mode}
          record={modal.record}
          onClose={() => setModal(null)}
          onSave={handleSave}
          metadata={metadata}
          showToast={showToast}
        />
      )}
    </div>
  );
}
