import { useEffect, useState } from "react";
import {
  Edit,
  FileText,
  Trash2,
  ChevronDown,
  ChevronRight,
  Calendar,
  Package,
  Layers,
  Search,
} from "lucide-react";
import api from "../config/apiService.js";

export function Enfesto() {
  let defaultStartDate;
  let defaultEndDate;
  const [startDate, setStartDate] = useState(
    defaultStartDate || getFirstDayOfMonth()
  );
  const [endDate, setEndDate] = useState(defaultEndDate || getToday());
  const [enfestos, setEnfestos] = useState([]);
  const [expandedDates, setExpandedDates] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedOtId, setSelectedOtId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPdfId, setLoadingPdfId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    id: null,
    lote: "",
    platesQuantity: 0,
    platesLayres: 0,
    plasticType: "",
    clothType: "",
    clothBatch: "",
    plasticBatch: "",
    resinedBatch: "",
    enfestoDate: "",
  });

  const fetchData = async (start, end) => {
    try {
      if (!start || !end) return;

      const response = await api.get(
        `${
          import.meta.env.VITE_API_KEY
        }/workorder/plates-by-enfesto?start=${start}&end=${end}`
      );

      // Processa e agrupa os dados corretamente
      const grouped = {};

      response.data.forEach((group) => {
        const date = group.enfestoDate;

        if (!grouped[date]) {
          grouped[date] = {
            enfestoDate: date,
            workOrders: [],
            totalPlacas: 0,
          };
        }

        // Adiciona as workOrders do grupo atual
        group.workOrders.forEach((ot) => {
          grouped[date].workOrders.push({
            ...ot,
            enfestoDate: date,
          });
        });
      });

      // Calcula o total de placas para cada grupo
      Object.values(grouped).forEach((group) => {
        group.totalPlacas = group.workOrders.reduce(
          (sum, ot) => sum + (ot.platesQuantity || 0),
          0
        );
      });

      // Converte para array e ordena por data (mais antigo primeiro)
      // const finalArr = Object.values(grouped).sort(
      //   (a, b) => new Date(a.enfestoDate) - new Date(b.enfestoDate)
      // );

      // Converte para array e ordena por data (mais recente primeiro)
      const finalArr = Object.values(grouped).sort(
        (a, b) => new Date(b.enfestoDate) - new Date(a.enfestoDate)
      );

      // DEBUG: Verifique no console se os dados estão corretos
      // console.log('Dados da API:', response.data);
      // console.log('Dados processados:', finalArr);

      // Atualiza o estado principal da tela
      setEnfestos(finalArr);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  function getFirstDayOfMonth() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-01`;
  }

  function getToday() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
  }

  const handleDrop = (id) => {
    setOpen(true);
    setSelectedOtId(id);
  };

  const deleteOt = async () => {
    setIsLoading(true);
    try {
      await api.delete(`/workorder?id=${selectedOtId}`);
      setEnfestos((prev) =>
        prev
          .map((enfesto) => ({
            ...enfesto,
            workOrders: enfesto.workOrders.filter(
              (item) => item.id !== selectedOtId
            ),
          }))
          .filter((enfesto) => enfesto.workOrders.length > 0)
      );

      setOpen(false);
      alert(`OT ${selectedOtId} deletada com sucesso`);
    } catch (error) {
      console.error(`Erro ao deletar OT ${selectedOtId}:`, error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdf = async (id) => {
    setLoadingPdfId(id);
    const pdfUrl = `${import.meta.env.VITE_API_KEY}/etiqueta?otid=${id}`;
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = blobUrl;
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        }, 500);
      };
      document.body.appendChild(iframe);
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(blobUrl);
      }, 50000);
    } catch (error) {
      console.error("Erro ao imprimir PDF:", error);
    } finally {
      setLoadingPdfId(null);
    }
  };

  const handleEdit = (id) => {
    const ot = enfestos.flatMap((e) => e.workOrders).find((o) => o.id === id);
    // FALTA: Preencher o estado editData e abrir o modal
    if (ot) {
      setEditData({
        id: ot.id,
        lote: ot.lote || "",
        platesQuantity: ot.platesQuantity || 0,
        platesLayres: ot.platesLayres || 0,
        plasticType: ot.plasticType || "",
        clothType: ot.clothType || "",
        clothBatch: ot.clothBatch || "",
        plasticBatch: ot.plasticBatch || "",
        resinedBatch: ot.resinedBatch || "",
        enfestoDate: ot.enfestoDate || "",
      });
      setEditOpen(true);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdit = async () => {
    try {
      const payload = {
        ...editData,
        enfestoDate: editData.enfestoDate
          ? `${editData.enfestoDate}T00:00:00`
          : null,
      };

      await api.put(`/workorder/${editData.id}`, payload);

      setEnfestos((prev) => {
        const updated = [];
        let movedOt = null;

        prev.forEach((enfesto) => {
          const filtered = enfesto.workOrders.filter(
            (o) => o.id !== editData.id
          );
          if (filtered.length !== enfesto.workOrders.length) {
            movedOt = {
              ...editData,
              enfestoDate: editData.enfestoDate.split("T")[0],
            };
          }
          if (filtered.length > 0) {
            updated.push({ ...enfesto, workOrders: filtered });
          }
        });

        const existingGroup = updated.find(
          (e) => e.enfestoDate === movedOt.enfestoDate
        );
        if (existingGroup) {
          existingGroup.workOrders.push(movedOt);
        } else {
          updated.push({
            enfestoDate: movedOt.enfestoDate,
            workOrders: [movedOt],
            totalPlacas: movedOt.platesQuantity || 0,
          });
        }

        return updated.map((e) => ({
          ...e,
          totalPlacas: e.workOrders.reduce(
            (sum, ot) => sum + (ot.platesQuantity || 0),
            0
          ),
        }));
      });

      setEditOpen(false);
    } catch (error) {
      alert("Erro ao atualizar a OT");
    }
  };

  function formatarDataCurta(dataStr) {
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  const toggleDate = (date) => {
    setExpandedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  const filteredEnfestos = enfestos
    .map((enfesto) => ({
      ...enfesto,
      workOrders: enfesto.workOrders.filter(
        (order) =>
          (order.lote || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id.toString().includes(searchTerm)
      ),
    }))
    .filter((e) => e.workOrders.length > 0);

  useEffect(() => {
    fetchData(startDate, endDate);
  }, []);

  const totalPlacasGeral = filteredEnfestos.reduce(
    (sum, enfesto) => sum + (enfesto.totalPlacas || 0),
    0
  );

  const totalOTs = filteredEnfestos.reduce(
    (sum, enfesto) => sum + (enfesto.workOrders?.length || 0),
    0
  );

  const toggleOrder = (id) => {
    setExpandedOrders((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Gestão de Enfestos
              </h1>
              <p className="text-slate-600 mt-1">
                Gerencie suas ordens de trabalho por data de enfesto
              </p>
            </div>

            {/* Stats Cards */}
            <div className="flex flex-wrap gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 min-w-32">
                <div className="flex items-center gap-2 text-green-600">
                  <Package className="w-5 h-5 text-black-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      {totalOTs}
                    </p>
                    <p className="text-xs text-blue-700">Total OTs</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 min-w-32">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5" style={{ color: "#16a34a" }} />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      {totalPlacasGeral}
                    </p>
                    <p className="text-xs text-green-700">Total Placas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
            <div className="relative flex-1 w-full">
              <Search
                className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2"
                style={{ color: "#94a3b8" }}
              />
              <input
                type="text"
                placeholder="Buscar por lote ou OT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">
                  Data inicial
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">
                  Data final
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => fetchData(startDate, endDate)}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Filtrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="space-y-6">
          {filteredEnfestos.map((enfesto) => (
            <div
              key={enfesto.enfestoDate}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
            >
              {/* Enfesto Header */}
              <div
                className={`p-6 cursor-pointer transition-all duration-200 hover:bg-slate-50 ${
                  expandedDates.includes(enfesto.enfestoDate)
                    ? "bg-blue-50 border-b border-slate-200"
                    : ""
                }`}
                onClick={() => toggleDate(enfesto.enfestoDate)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      {expandedDates.includes(enfesto.enfestoDate) ? (
                        <ChevronDown
                          className="w-5 h-5"
                          style={{ color: "#475569" }}
                        />
                      ) : (
                        <ChevronRight
                          className="w-5 h-5"
                          style={{ color: "#475569" }}
                        />
                      )}
                      <Calendar
                        className="w-5 h-5"
                        style={{ color: "#2563eb" }}
                      />
                      <div>
                        <p className="font-semibold text-slate-900">
                          Data de Enfesto
                        </p>
                        <p className="text-lg font-bold text-blue-600">
                          {formatarDataCurta(enfesto.enfestoDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Layers
                        className="w-5 h-5"
                        style={{ color: "#16a34a" }}
                      />
                      <div>
                        <p className="font-semibold text-slate-900">
                          Placas Produzidas
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          {enfesto.totalPlacas}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Package
                        className="w-5 h-5"
                        style={{ color: "#9333ea" }}
                      />
                      <div>
                        <p className="font-semibold text-slate-900">
                          Ordens de Trabalho
                        </p>
                        <p className="text-lg font-bold text-purple-600">
                          {enfesto.workOrders.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Orders Table */}
              {expandedDates.includes(enfesto.enfestoDate) && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          OT
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Lote
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Quantidade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Camadas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Filme
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Tecido
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Lote Tecido
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {enfesto.workOrders.map((order) => (
                        <>
                          {/* Linha da OT */}
                          <tr
                            key={order.id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => toggleOrder(order.id)}
                                className="flex items-center gap-2 text-blue-600 hover:underline"
                              >
                                {expandedOrders.includes(order.id) ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                                {order.id}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                              {order.lote}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {order.platesQuantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {order.platesLayres}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {order.plasticType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {order.clothType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {order.clothBatch}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEdit(order.id)}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                  title="Editar"
                                >
                                  <Edit
                                    className="w-4 h-4"
                                    style={{ color: "inherit" }}
                                  />
                                </button>
                                <button
                                  onClick={() => handlePdf(order.id)}
                                  disabled={loadingPdfId === order.id}
                                  className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all disabled:opacity-50"
                                  title="Gerar PDF"
                                >
                                  {loadingPdfId === order.id ? (
                                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <FileText
                                      className="w-4 h-4"
                                      style={{ color: "inherit" }}
                                    />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDrop(order.id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Excluir"
                                >
                                  <Trash2
                                    className="w-4 h-4"
                                    style={{ color: "inherit" }}
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Subtabela de Placas */}
                          {expandedOrders.includes(order.id) && (
                            <tr>
                              <td colSpan={8} className="px-6 py-4 bg-slate-50">
                                <div className="overflow-x-auto">
                                  <table className="w-full border border-slate-200 rounded-md">
                                    <thead className="bg-slate-100">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                                          #
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                                          Status
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                                          Camadas
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                                          Tamanho Inicial
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                                          Tamanho Atual
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {order.plates.map((plate) => (
                                        <tr
                                          key={plate.id}
                                          className="border-t border-slate-200"
                                        >
                                          <td className="px-4 py-2 text-sm text-slate-700">
                                            {plate.id}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-slate-700">
                                            {plate.status}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-slate-700">
                                            {plate.layers}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-slate-700">
                                            {plate.initSize}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-slate-700">
                                            {plate.actualSize}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delete Modal */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6" style={{ color: "#dc2626" }} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Confirmar Exclusão
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Você tem certeza que deseja <strong>deletar</strong> a OT{" "}
                {selectedOtId}? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={deleteOt}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Deletando..." : "Deletar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Editar OT {editData.id}
                </h2>
                <button
                  onClick={() => setEditOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="sr-only">Fechar</span>
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Lote
                  </label>
                  <input
                    name="lote"
                    value={editData.lote}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Lote"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Quantidade
                  </label>
                  <input
                    name="platesQuantity"
                    type="number"
                    disabled
                    value={editData.platesQuantity}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Quantidade"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Camadas
                  </label>
                  <select
                    name="platesLayres"
                    value={editData.platesLayres || ""}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="11">11</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Plástico
                  </label>
                  <input
                    name="plasticType"
                    value={editData.plasticType}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Filme"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Lote Plástico
                  </label>
                  <input
                    name="plasticBatch"
                    value={editData.plasticBatch}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Lote Plástico"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Data de Enfesto
                  </label>
                  <input
                    name="enfestoDate"
                    type="date"
                    value={
                      editData.enfestoDate
                        ? new Date(editData.enfestoDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tecido
                  </label>
                  <input
                    name="clothType"
                    value={editData.clothType}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tecido"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Lote Tecido
                  </label>
                  <input
                    name="clothBatch"
                    value={editData.clothBatch}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Lote do Tecido"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Lote do Resinado (RWO)
                  </label>
                  <input
                    name="resinedBatch"
                    value={editData.resinedBatch}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Lote do Resinado"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setEditOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
