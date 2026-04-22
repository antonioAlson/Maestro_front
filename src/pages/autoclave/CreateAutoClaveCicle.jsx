import { useState, useEffect } from "react";
import api from "../../config/apiService";
import CycleReportViewer from "../../components/CycleReportViewer";
import { motion, AnimatePresence } from "framer-motion";

import {
  Plus,
  ChevronDown,
  ChevronRight,
  Play,
  Check,
  X,
  Package,
  Layers,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  BarChart3,
  LineChart,
  PieChart,
  Upload,
  FileText,
  TrendingUp,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
} from "recharts";

export function CreateCicleAutoClave() {
  const [expandedCycles, setExpandedCycles] = useState([]);
  const [expandedPackages, setExpandedPackages] = useState([]);
  const [addPlatesModal, setAddPlatesModal] = useState(false);
  const [addChartModal, setAddChartModal] = useState(false);
  const [completeCycleModal, setCompleteCycleModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [plateInput, setPlateInput] = useState("");
  const [chartType, setChartType] = useState("temperature");
  const [chartData, setChartData] = useState("");
  const [cycleObservations, setCycleObservations] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadOk, setUploadOk] = useState(false);

  const [viewMode, setViewMode] = useState("pendentes");
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      PREPARANDO: "bg-yellow-100 text-yellow-800 border-yellow-200",
      EM_ANDAMENTO: "bg-blue-100 text-blue-800 border-blue-200",
      APROVADO: "bg-green-100 text-green-800 border-green-200",
      FINALIZADO: "bg-green-100 text-green-800 border-green-200",
      CONCLUIDO: "bg-green-100 text-gray-800 border-green-200",
      FALHA: "bg-red-100 text-red-800 border-red-200",
      EM_PACOTE: "bg-purple-100 text-purple-800 border-purple-200",
      EM_ESTOQUE: "bg-green-100 text-green-800 border-green-200",
      EM_ENFESTO: "bg-orange-100 text-orange-800 border-orange-200",
      FALHA_NO_CICLO: "bg-red-100 text-red-800 border-red-200",
      REPASSE: "bg-indigo-100 text-indigo-800 border-indigo-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status) => {
    const icons = {
      PREPARANDO: <Clock className="w-4 h-4" />,
      EM_ANDAMENTO: <Activity className="w-4 h-4" />,
      APROVADO: <CheckCircle className="w-4 h-4" />,
      FINALIZADO: <CheckCircle className="w-4 h-4" />,
      CONCLUIDO: <Check className="w-4 h-4" />,
      FALHA: <AlertCircle className="w-4 h-4" />,
      EM_PACOTE: <Package className="w-4 h-4" />,
      EM_ESTOQUE: <CheckCircle className="w-4 h-4" />,
      EM_ENFESTO: <Layers className="w-4 h-4" />,
      FALHA_NO_CICLO: <X className="w-4 h-4" />,
      REPASSE: <Activity className="w-4 h-4" />,
    };
    return icons[status] || <AlertCircle className="w-4 h-4" />;
  };

  const sorter = (cycles) => {
    return [...cycles].sort((a, b) => a.id - b.id); // Ordem crescente pelo ID
  };

  // Atualiza a lista de ciclos
  const refreshCycleInfo = async () => {
    try {
      setLoading(true);

      let endpoint = "/autoclave/cycle/summary";

      if (viewMode === "pendentes") {
        endpoint = "/autoclave/cycle/incomplete";
      }

      if (viewMode === "periodo") {
        endpoint = "/autoclave/cycle/by-cycle";
      }

      const response = await api.get(endpoint);

      const sorted = sorter(response.data);
      setCycles(sorted);
    } catch (error) {
      console.error("Erro ao buscar ciclos:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCycles = async () => {
    try {
      setLoading(true);

      let endpoint = "/autoclave/cycle/summary";

      if (viewMode === "pendentes") {
        endpoint = "/autoclave/cycle/incomplete";
      }

      if (viewMode === "periodo") {
        endpoint = "/autoclave/cycle/by-cycle";
      }

      const response = await api.get(endpoint);
      setCycles(response.data);
    } catch (error) {
      console.error("Erro ao buscar ciclos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, [viewMode]);

  const toggleCycleExpansion = (cycleId) => {
    setExpandedCycles((prev) =>
      prev.includes(cycleId)
        ? prev.filter((id) => id !== cycleId)
        : [...prev, cycleId],
    );
  };

  const togglePackageExpansion = (packageId) => {
    setExpandedPackages((prev) =>
      prev.includes(packageId)
        ? prev.filter((id) => id !== packageId)
        : [...prev, packageId],
    );
  };

  const createCycle = async () => {
    event.preventDefault();
    setIsSaving(true);

    const formattedDate = formatDateToISO(new Date());

    const body = { cycleDate: formattedDate };
    try {
      const response = await api.post("/autoclave/cycle", body);
      alert("Ciclo de AutoClave criado com sucesso! ID: " + response.data.id);
      refreshCycleInfo();
    } catch (error) {
      console.error(
        "Erro ao criar ciclo",
        error.response?.data || error.message,
      );
      alert("Erro ao criar o Ciclo!");
    } finally {
      setIsSaving(false);
    }
  };

  function formatDateToISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  const startCycle = async (cycleId) => {
    setIsSaving(true);
    await changeCycleStatus(cycleId, "EM_ANDAMENTO");
    setIsSaving(false);
  };

  const changeCycleStatus = async (cycleId, newStatus) => {
    const body = {
      newStatus: newStatus,
    };
    try {
      const response = await api.patch(
        `/autoclave/cycle/${cycleId}/status`,
        body,
      );
      alert(`Status do ciclo ${cycleId} atualizado para  ${newStatus}!`);
      refreshCycleInfo();
    } catch (error) {
      console.error("Erro ao atualizar status do ciclo:", error);
      alert(`Erro ao atualizar status do ciclo ${cycleId}`);
    }
  };

  const openAddPlatesModal = (pkg) => {
    setSelectedPackage(pkg);
    setAddPlatesModal(true);
    setPlateInput("");
  };
  const MAX_FILE_SIZE = 1024 * 1024;

  const uploadFile = async (cycleId) => {
    if (!selectedFile) {
      alert("Selecione uma imagem antes de enviar");
      return false;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      alert("O arquivo excede o tamanho máximo permitido de 20MB.");
      return false;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    // Enviar o objeto como JSON
    const jsonData = JSON.stringify({
      cycleId: cycleId,
      newStatus: "FINALIZADO",
    });
    formData.append("data", new Blob([jsonData], { type: "application/json" }));

    try {
      const response = await api.post(
        `/autoclave/cycle/complete/${cycleId}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      refreshCycleInfo();
      return true;
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar imagem.");
      return false;
    }
  };

  const openCompleteCycleModal = (cycle) => {
    setSelectedCycle(cycle);
    setCompleteCycleModal(true);
    setCycleObservations(cycle.observations || "");
  };

  const completeCycle = async () => {
    if (!selectedFile) {
      alert("Selecione uma imagem antes de concluir.");
      return;
    }

    const updatedCycle = await uploadFile(selectedCycle.id);
    if (!updatedCycle) {
      alert("Upload falhou. Ciclo não concluído.");
      return;
    }
    //parece que existe algum erro em emitir algo depois de um alert
    setCompleteCycleModal(false);
    setTimeout(() => {
      alert(`Ciclo ${selectedCycle.id} concluído com sucesso!`);
    }, 0);
    refreshCycleInfo();
  };

  const addPackage = async (cycleId, pkgQtd) => {
    const body = {
      autoclaveCycleId: cycleId,
      packageName: "Pacote " + (pkgQtd + 1),
      plateIds: [],
      creationTime: "2025-07-21T20:00:00",
    };
    try {
      const response = await api.post(`/autoclave/package/cycle`, body);
      alert(`Novo ${response.data.id} pacote criado para o ciclo ${cycleId}!`);
      refreshCycleInfo();
    } catch (error) {
      console.error("Erro ao adicionar pacote:", error);
      alert(`Erro ao adicionar novo pacote no ciclo ${cycleId}`);
    }
  };

  const handleAddPlates = async () => {
    const plates = plateInput
      .split("\n")
      .map((p) => p.trim().split("-")[0])
      .filter((p) => p);
    if (plates.length === 0) {
      alert("Digite ao menos uma placa para adicionar.");
      return;
    }

    try {
      setIsSaving(true);
      const { error, normal } = await platesStatus(plates, selectedPackage.id);

      if (error.length > 0) {
        const erroMsg = error
          .map((e) => `Placa ${e.id} está em status: ${e.status}`)
          .join("\n");
        alert(
          `Algumas placas não estão disponíveis para uso:\n\n${erroMsg}\n\nApenas as placas com status correto poderão ser adicionadas.`,
        );
      }

      if (normal.length === 0) {
        alert("Nenhuma placa válida para adicionar ao pacote.");
        return;
      }

      const validPlateIds = normal.map((p) => p.id);
      await addPlates(validPlateIds, selectedPackage.id);

      alert(
        `${validPlateIds.length} placas adicionadas ao pacote ${selectedPackage.id}!`,
      );
      setAddPlatesModal(false);
      setPlateInput("");
      refreshCycleInfo();
    } catch (err) {
      console.error("Erro ao adicionar placas:", err);
      alert("Erro ao adicionar placas ao pacote.");
    } finally {
      setIsSaving(false);
    }
  };

  const platesStatus = async (platesArray, pacoteId) => {
    let error = [];
    let normal = [];
    try {
      const response = await api.post(`/plate`, platesArray);
      for (let i = 0; i < response.data.length; i++) {
        const plate = response.data[i];
        if (plate.status == "EM_ESTOQUE" || plate.packageId == pacoteId) {
          error.push({ id: plate.id, status: "{ JÁ ESTÁ NESTE PACOTE }" });
        } else {
          normal.push({ id: plate.id, status: plate.status });
        }
      }
      return { error, normal };
    } catch (error) {
      throw error;
    }
  };

  const addPlates = async (platesArray, pacoteId) => {
    try {
      const response = await api.post(
        `/autoclave/package/${pacoteId}/addPlates`,
        platesArray,
      );
      console.log("Placas adicionadas com sucesso" + response.data);
    } catch (error) {
      console.error("Erro ao adicionar placas:", error);
    }
  };

  const changePlateStatus = async (plateID, newStatus) => {
    const body = {
      plateId: plateID,
      newStatus: newStatus,
    };
    try {
      const response = await api.post(`/plate/update-status`, body);
      refreshCycleInfo();
    } catch (error) {
      console.error("Erro ao atualizar status da placa:", error);
      alert(`Erro ao atualizar status da placa ${cycleId}`);
    }
  };

  const removePlate = async (packid, plateId) => {
    const body = {
      packid: packid,
      plateId: plateId,
    };

    try {
      const response = await api.post(`/autoclave/package/removePlate`, body);
      refreshCycleInfo();
      alert("Sucesso ao remover placa");
    } catch (error) {
      alert(`Erro ao reomver placa ${response.error}`);
    }
  };

  const changePackingStatus = async (packingId, newStatus) => {
    const body = { newStatus };
    try {
      const response = await api.post(
        `/autoclave/package/${packingId}/updateStatus`,
        body,
      );
      alert(`Status do pacote ${packingId} atualizado para  ${newStatus}!`);
      refreshCycleInfo();
    } catch (error) {
      console.error("Erro ao atualizar status do pacote:", error);
      alert(`Erro ao atualizar status do pacote ${packingId}`);
    }
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Ciclos de Autoclave
              </h1>
              <p className="text-gray-600 mt-1">
                Gerenciamento de ciclos e pacotes
              </p>
            </div>
            <div className="flex justify-center mb-6">
              <div className="relative flex bg-gray-200 rounded-xl p-1 w-64">
                <div
                  className={`absolute top-1 bottom-1 w-1/2 rounded-lg bg-slate-700 transition-all duration-300 ${
                    viewMode === "pendentes" ? "left-1/2" : "left-1"
                  }`}
                />

                <button
                  onClick={() => setViewMode("todos")}
                  className={`relative z-10 w-1/2 py-2 text-sm font-medium transition-colors ${
                    viewMode === "todos"
                      ? "text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Todos
                </button>

                <button
                  onClick={() => setViewMode("pendentes")}
                  className={`relative z-10 w-1/2 py-2 text-sm font-medium transition-colors ${
                    viewMode === "pendentes"
                      ? "text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Pendentes
                </button>
                {/* <button
                  onClick={() => setViewMode("periodo")}
                  className={`relative z-10 w-1/3 py-2 text-sm font-medium transition-colors ${
                    viewMode === "periodo"
                      ? "text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Período
                </button> */}
              </div>
            </div>
            {/*
             */}
            <button
              onClick={createCycle}
              disabled={isSaving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {isSaving ? "Criando..." : "Criar Novo Ciclo"}
            </button>
          </div>
        </div>

        {/* Cycles List */}
        <div className="space-y-4">
          {cycles.map((cycle) => (
            <div
              key={cycle.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200"
            >
              {/* Cycle Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleCycleExpansion(cycle.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      {expandedCycles.includes(cycle.id) ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                    </button>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Ciclo {cycle.id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatDateTime(cycle.creationDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">
                          {cycle.totalPackages}
                        </p>
                        <p className="text-xs text-gray-500">
                          Pacotes {cycle.totalPackages}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">
                          {cycle.totalPlates}
                        </p>
                        <p className="text-xs text-gray-500">Placas</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border ${getStatusColor(
                          cycle.status,
                        )}`}
                      >
                        {getStatusIcon(cycle.status)}
                        {cycle.status + ""}
                      </span>

                      {cycle.status === "EM_ANDAMENTO" && (
                        <button
                          onClick={() => openCompleteCycleModal(cycle)}
                          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Concluir Ciclo
                        </button>
                      )}

                      {cycle.status === "CRIADO" && cycle.totalPlates > 0 && (
                        <button
                          onClick={() => startCycle(cycle.id)}
                          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          {isSaving ? "Iniciando ..." : "Iniciar Ciclo"}
                        </button>
                      )}

                      {cycle.status === "FINALIZADO" &&
                        !cycle.reportFilePath && (
                          <button
                            onClick={() => openAddChartModal(cycle)}
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                          >
                            <BarChart3 className="w-4 h-4" />
                            Adicionar Gráfico
                          </button>
                        )}

                      {cycle.status === "FINALIZADO" &&
                        cycle.reportFilePath && (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-green-600 px-3 py-1 bg-green-50 rounded-lg text-sm border border-green-200">
                              <BarChart3 className="w-4 h-4" />
                              Gráfico Disponível
                            </span>
                            <button
                              onClick={() => openAddChartModal(cycle)}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded text-sm transition-colors"
                            >
                              <Upload className="w-3 h-3" />
                              Atualizar
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                {/* Layer Summary */}
                {cycle.platesPerLayer && (
                  <div className="flex gap-2 mt-4">
                    {Object.entries(cycle.platesPerLayer).map(
                      ([layer, count]) => (
                        <span
                          key={layer}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                        >
                          <Layers className="w-3 h-3" />
                          {layer} Camada: {count}
                        </span>
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* Packages */}
              {expandedCycles.includes(cycle.id) && (
                <div className="p-6">
                  {/* Observations */}
                  {cycle.observations && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h5 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Observações do Ciclo
                      </h5>
                      <p className="text-sm text-blue-800">
                        {cycle.observations}
                      </p>
                    </div>
                  )}
                  {cycle.status === "FINALIZADO" && cycle.reportFilePath && (
                    <div>
                      <CycleReportViewer
                        reportFilePath={cycle.reportFilePath}
                      />
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-4 mt-6">
                    <h4 className="text-lg font-medium text-gray-900">
                      Pacotes
                    </h4>
                    {cycle.status == "CRIADO" && (
                      <button
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                        onClick={() =>
                          addPackage(cycle.id, cycle.totalPackages)
                        }
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Pacote
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {cycle.packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="border border-gray-200 rounded-lg"
                      >
                        {/* Package Header */}
                        <div className="p-4 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => togglePackageExpansion(pkg.id)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                              >
                                {expandedPackages.includes(pkg.id) ? (
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-500" />
                                )}
                              </button>

                              <div>
                                <h5 className="font-medium text-gray-900">
                                  Pacote {pkg.id}
                                </h5>
                                <p className="text-sm text-gray-600">
                                  {pkg.totalPlates} placas
                                </p>
                                <div className="flex gap-2 mt-4">
                                  {Object.entries(
                                    pkg.plates.reduce((acc, plate) => {
                                      acc[plate.layers] =
                                        (acc[plate.layers] || 0) + 1;
                                      return acc;
                                    }, {}),
                                  ).map(([layer, count]) => (
                                    <span
                                      key={layer}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-400 rounded text-sm"
                                    >
                                      {layer} Camada: {count}
                                    </span>
                                  ))}
                                </div>
                                {pkg.cycleObservation && (
                                  <p className="text-sm text-gray-500 italic">
                                    {pkg.cycleObservation}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm border ${getStatusColor(
                                  pkg.packageStatus,
                                )}`}
                              >
                                {getStatusIcon(pkg.packageStatus)}
                                {pkg.packageStatus}
                              </span>

                              {pkg.packageStatus == "PREPARANDO" && (
                                <button
                                  onClick={() => openAddPlatesModal(pkg)}
                                  className="text-blue-600 hover:text-blue-700 text-sm px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                                >
                                  + Placas
                                </button>
                              )}
                              {pkg.packageStatus == "AGUARDANDO_APROVACAO" && (
                                <div className="flex gap-2">
                                  <button
                                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm transition-colors"
                                    onClick={() =>
                                      changePackingStatus(pkg.id, "APROVADO")
                                    }
                                  >
                                    <Check className="w-3 h-3" />
                                    Aprovar
                                  </button>
                                  <button
                                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm transition-colors"
                                    onClick={() =>
                                      changePackingStatus(pkg.id, "FALHA")
                                    }
                                  >
                                    <X className="w-3 h-3" />
                                    Reprovar
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Package Plates */}
                        {expandedPackages.includes(pkg.id) &&
                          pkg.plates.length > 0 && (
                            <div className="p-4 border-t border-gray-200">
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-200">
                                      <th className="text-left py-2 font-medium text-gray-900">
                                        Placa
                                      </th>
                                      <th className="text-left py-2 font-medium text-gray-900">
                                        Status
                                      </th>
                                      <th className="text-left py-2 font-medium text-gray-900">
                                        Camadas
                                      </th>
                                      <th className="text-left py-2 font-medium text-gray-900">
                                        Ações
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {pkg.plates.map((plate) => (
                                      <tr
                                        key={plate.id}
                                        className="border-b border-gray-100 last:border-b-0"
                                      >
                                        <td className="py-2 font-medium text-gray-900">
                                          {plate.id}
                                        </td>
                                        <td className="py-2">
                                          <span
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(
                                              plate.status,
                                            )}`}
                                          >
                                            {getStatusIcon(plate.status)}
                                            {plate.status}
                                          </span>
                                        </td>
                                        <td className="py-2 text-gray-600">
                                          {plate.layers}
                                        </td>
                                        <td className="py-2">
                                          <div className="flex gap-2">
                                            {(plate.status ===
                                              "AGUARDANDO_APROVACAO" ||
                                              plate.status === "REPASSE") && (
                                              <button
                                                className="text-green-600 hover:text-green-700 text-xs px-2 py-1 hover:bg-green-50 rounded transition-colors"
                                                onClick={() =>
                                                  changePlateStatus(
                                                    plate.id,
                                                    "EM_ESTOQUE",
                                                  )
                                                }
                                              >
                                                Aprovar
                                              </button>
                                            )}
                                            {plate.status ===
                                              "AGUARDANDO_APROVACAO" && (
                                              <button
                                                className="text-red-600 hover:text-red-700 text-xs px-2 py-1 hover:bg-red-50 rounded transition-colors"
                                                onClick={() =>
                                                  changePlateStatus(
                                                    plate.id,
                                                    "REPASSE",
                                                  )
                                                }
                                              >
                                                Reprovar
                                              </button>
                                            )}
                                          </div>

                                          {cycle.status === "CRIADO" &&
                                            pkg.packageStatus ===
                                              "PREPARANDO" && (
                                              <div className="flex gap-2">
                                                <button
                                                  className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm transition-colors"
                                                  onClick={() =>
                                                    removePlate(
                                                      pkg.id,
                                                      plate.id,
                                                    )
                                                  }
                                                >
                                                  <X className="w-3 h-3" />
                                                  Remover placa
                                                </button>
                                              </div>
                                            )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Complete Cycle Modal */}
        {completeCycleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Concluir Ciclo {selectedCycle?.id}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Para concluir o ciclo, é obrigatório adicionar o gráfico de
                    monitoramento
                  </p>
                </div>
                <button
                  onClick={() => setCompleteCycleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setSelectedFile(e.target.files[0]);
                    setUploadOk(false);
                  }}
                />
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setCompleteCycleModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={completeCycle}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                >
                  ✅ Concluir Ciclo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Chart Modal */}
        {addChartModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedCycle?.chartData ? "Atualizar img" : "Adicionar"}{" "}
                  Gráfico - Ciclo {selectedCycle?.id}
                </h3>
                <button
                  onClick={() => setAddChartModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Gráfico
                    </label>
                    <select
                      value={chartType}
                      onChange={(e) => setChartType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="temperature">Temperatura e Pressão</option>
                      <option value="efficiency">Eficiência do Ciclo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dados do Gráfico
                    </label>
                    {chartType === "temperature" && (
                      <p className="text-xs text-gray-500 mb-2">
                        Formato: tempo,temperatura,pressão (uma linha por ponto)
                        <br />
                        Exemplo: 00:00,20,1
                      </p>
                    )}
                    {chartType === "efficiency" && (
                      <p className="text-xs text-gray-500 mb-2">
                        Formato: categoria,valor (uma linha por categoria)
                        <br />
                        Exemplo: Aprovadas,22
                      </p>
                    )}
                    <textarea
                      value={chartData}
                      onChange={(e) => setChartData(e.target.value)}
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                      placeholder={
                        chartType === "temperature"
                          ? "00:00,20,1\n00:15,45,1.2\n00:30,80,1.5"
                          : "Aprovadas,22\nReprovadas,3"
                      }
                    />
                  </div>
                </div>

                <div>{renderChartPreview(chartPreview)}</div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setAddChartModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddChart}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {selectedCycle?.chartData ? "Atualizar" : "Adicionar"} Gráfico
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Plates Modal */}
        {addPlatesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Adicionar Placas - Pacote {selectedPackage?.id}
                </h3>
                <button
                  onClick={() => setAddPlatesModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IDs das Placas (um por linha)
                </label>
                <textarea
                  value={plateInput}
                  onChange={(e) => setPlateInput(e.target.value)}
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="456-123&#10;789-098&#10;012-456"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setAddPlatesModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={isSaving}
                  onClick={handleAddPlates}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {isSaving ? "Adicionando ..." : "Adicionar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
