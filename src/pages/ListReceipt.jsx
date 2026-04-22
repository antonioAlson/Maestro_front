import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../config/apiService.js";

export function ListReceipt() {
  const [recebimentos, setRecebimentos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSituation, setFilterSituation] = useState("ALL");
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  const [editModal, setEditModal] = useState({ open: false, data: null });
  const [detailModal, setDetailModal] = useState({ open: false, data: null });
  const [loadingPdfId, setLoadingPdfId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [sortConfig, setSortConfig] = useState({ key: "receiveDate", direction: "asc" });

  const navigate = useNavigate();

  // Função para formatar data atual
  function getTodayFormatted() {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  // Carregar dados da API
  useEffect(() => {
    setIsLoading(true);
    api
      .get("/receipt")
      .then((response) => {
        const sorted = [...response.data].sort(
          (a, b) => new Date(a.receiveDate) - new Date(b.receiveDate)
        );
        setRecebimentos(sorted);
      })
      .catch((error) => {
        console.error("Erro ao buscar recebimentos:", error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Filtros e busca
  const filteredRecebimentos = recebimentos.filter((r) => {
    const matchSearch = 
      r.nf?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.internBatch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.responsible?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchSituation = filterSituation === "ALL" || r.situation === filterSituation;
    
    return matchSearch && matchSituation;
  });

  // Ordenação
  const sortedRecebimentos = [...filteredRecebimentos].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Função para deletar recebimento
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/receipt?id=${deleteModal.id}`);
      setRecebimentos((prev) => prev.filter((r) => r.id !== deleteModal.id));
      setDeleteModal({ open: false, id: null });
    } catch (error) {
      console.error(`Erro ao deletar recebimento ${deleteModal.id}: `, error.message);
      alert("Erro ao deletar recebimento");
    } finally {
      setIsDeleting(false);
    }
  };

  // Função para editar
  const handleEdit = (r) => {
    setEditModal({ 
      open: true, 
      data: { 
        ...r,
        receiveDate: r.receiveDate ? new Date(r.receiveDate).toISOString().split("T")[0] : ""
      } 
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditModal((prev) => ({
      ...prev,
      data: { ...prev.data, [name]: value }
    }));
  };

  const saveEdit = async () => {
    try {
      await api.put(`/receipt/${editModal.data.id}`, editModal.data);
      setRecebimentos((prev) =>
        prev.map((r) => (r.id === editModal.data.id ? editModal.data : r))
      );
      setEditModal({ open: false, data: null });
    } catch (error) {
      console.error("Erro ao atualizar o recebimento:", error);
      alert("Erro ao atualizar o recebimento");
    }
  };

  // Função para gerar PDF
  const handlePdf = async (id) => {
    setLoadingPdfId(id);
    const pdfUrl = `${import.meta.env.VITE_API_KEY}/etiquetaReceipt?id=${id}`;

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
      console.error("Erro ao imprimir o PDF:", error);
      alert("Erro ao gerar PDF");
    } finally {
      setLoadingPdfId(null);
    }
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) {
      return <span className="text-slate-400">⇅</span>;
    }
    return sortConfig.direction === "asc" ? <span>↑</span> : <span>↓</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Recebimentos</h1>
                <p className="text-slate-600 text-sm">Gerencie todos os recebimentos cadastrados</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{recebimentos.length}</div>
              <div className="text-sm text-slate-600">Total de registros</div>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Busca */}
              <div className="md:col-span-2">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar por NF, Lote ou Responsável..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Filtro por Situação */}
              <div>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer"
                  value={filterSituation}
                  onChange={(e) => setFilterSituation(e.target.value)}
                >
                  <option value="ALL">Todas as Situações</option>
                  <option value="APROVADO">✓ Aprovados</option>
                  <option value="REPROVADO">✗ Reprovados</option>
                </select>
              </div>
            </div>

            {/* Resultados */}
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-slate-600">
                Exibindo <strong>{sortedRecebimentos.length}</strong> de <strong>{recebimentos.length}</strong> registros
              </span>
              {(searchTerm || filterSituation !== "ALL") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterSituation("ALL");
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-200">
                  <tr>
                    <th 
                      className="px-6 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition select-none"
                      onClick={() => handleSort("id")}
                    >
                      <div className="flex items-center gap-2">
                        ID <SortIcon column="id" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition select-none"
                      onClick={() => handleSort("nf")}
                    >
                      <div className="flex items-center gap-2">
                        NF <SortIcon column="nf" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition select-none"
                      onClick={() => handleSort("internBatch")}
                    >
                      <div className="flex items-center gap-2">
                        Lote Interno <SortIcon column="internBatch" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition select-none"
                      onClick={() => handleSort("situation")}
                    >
                      <div className="flex items-center gap-2">
                        Situação <SortIcon column="situation" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition select-none"
                      onClick={() => handleSort("quantity")}
                    >
                      <div className="flex items-center gap-2">
                        Quantidade <SortIcon column="quantity" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition select-none"
                      onClick={() => handleSort("responsible")}
                    >
                      <div className="flex items-center gap-2">
                        Responsável <SortIcon column="responsible" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {sortedRecebimentos.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="text-slate-500 font-medium">Nenhum recebimento encontrado</p>
                          <p className="text-slate-400 text-sm">Tente ajustar os filtros de busca</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedRecebimentos.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-blue-50 transition cursor-pointer"
                        onClick={() => setDetailModal({ open: true, data: r })}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">#{r.id}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{r.nf}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{r.internBatch}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                              r.situation === "APROVADO"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-red-100 text-red-700 border border-red-200"
                            }`}
                          >
                            {r.situation === "APROVADO" ? (
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            )}
                            {r.situation}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700 font-medium">{r.quantity} un.</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{r.responsible}</td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setDetailModal({ open: true, data: r })}
                              className="p-2 hover:bg-blue-100 rounded-lg transition group"
                              title="Ver detalhes"
                            >
                              <svg className="w-5 h-5 text-slate-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEdit(r)}
                              className="p-2 hover:bg-amber-100 rounded-lg transition group"
                              title="Editar"
                            >
                              <svg className="w-5 h-5 text-slate-600 group-hover:text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handlePdf(r.id)}
                              disabled={loadingPdfId === r.id}
                              className="p-2 hover:bg-purple-100 rounded-lg transition group disabled:opacity-50"
                              title="Gerar PDF"
                            >
                              {loadingPdfId === r.id ? (
                                <svg className="w-5 h-5 text-purple-600 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-slate-600 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => setDeleteModal({ open: true, id: r.id })}
                              className="p-2 hover:bg-red-100 rounded-lg transition group"
                              title="Excluir"
                            >
                              <svg className="w-5 h-5 text-slate-600 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {detailModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setDetailModal({ open: false, data: null })}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Detalhes do Recebimento</h2>
              <button onClick={() => setDetailModal({ open: false, data: null })} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">ID</p>
                  <p className="font-semibold text-slate-900">#{detailModal.data.id}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Nota Fiscal</p>
                  <p className="font-semibold text-slate-900">{detailModal.data.nf}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Lote Interno</p>
                  <p className="font-semibold text-slate-900">{detailModal.data.internBatch}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Situação</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    detailModal.data.situation === "APROVADO" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {detailModal.data.situation}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Quantidade</p>
                  <p className="font-semibold text-slate-900">{detailModal.data.quantity} unidades</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Responsável</p>
                  <p className="font-semibold text-slate-900">{detailModal.data.responsible}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg col-span-2">
                  <p className="text-sm text-slate-600 mb-1">Data de Recebimento</p>
                  <p className="font-semibold text-slate-900">
                    {detailModal.data.receiveDate ? new Date(detailModal.data.receiveDate).toLocaleDateString('pt-BR') : 'Não informada'}
                  </p>
                </div>
              </div>

              {detailModal.data.observation && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900 font-medium mb-2">Observações</p>
                  <p className="text-slate-700">{detailModal.data.observation}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setDetailModal({ open: false, data: null });
                  handleEdit(detailModal.data);
                }}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Editar
              </button>
              <button
                onClick={() => setDetailModal({ open: false, data: null })}
                className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmar Exclusão</h3>
              <p className="text-slate-600 mb-6">
                Deseja realmente excluir o recebimento <strong>#{deleteModal.id}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal({ open: false, id: null })}
                  className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition font-medium"
                  disabled={isDeleting}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Excluindo...
                    </>
                  ) : (
                    "Excluir"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {editModal.open && editModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Editar Recebimento #{editModal.data.id}</h2>
              <button onClick={() => setEditModal({ open: false, data: null })} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">NF *</label>
                  <input
                    name="nf"
                    value={editModal.data.nf || ""}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Lote Interno *</label>
                  <input
                    name="internBatch"
                    value={editModal.data.internBatch || ""}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Quantidade *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={editModal.data.quantity || ""}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    min={1}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Situação *</label>
                  <select
                    name="situation"
                    value={editModal.data.situation || ""}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="APROVADO">APROVADO</option>
                    <option value="REPROVADO">REPROVADO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Responsável *</label>
                  <input
                    name="responsible"
                    value={editModal.data.responsible || ""}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Data de Recebimento *</label>
                  <input
                    type="date"
                    name="receiveDate"
                    value={editModal.data.receiveDate || ""}
                    max={getTodayFormatted()}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Observação</label>
                <textarea
                  name="observation"
                  value={editModal.data.observation || ""}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows={3}
                  maxLength={255}
                />
              </div>
            </div>

                        <div className="flex gap-3 mt-8">
              <button
                onClick={() => setEditModal({ open: false, data: null })}
                className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}