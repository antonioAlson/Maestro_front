import Modal from "../components/modal-edit-ot";
import { useEffect, useState } from "react";
import api from "../config/apiService.js";

export function PCP_production() {
  const [ot, setOt] = useState([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    api
      .get("/plate/getEstoque")
      .then((response) => {
        const sorted = [...response.data].sort(
          (a, b) => new Date(a.creationDate) - new Date(b.creationDate)
        );
        setOt(sorted);
      })
      .catch((error) => {
        console.error("Erro ao buscar produtos:", error.message);
      });
  }, []);

  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "desc",
  });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedOt = [...ot].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key])
      return sortConfig.direction === "asc" ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key])
      return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  function getTodayFormatted() {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  const handleExport = async () => {
    try {
      // Verifica se ambas as datas foram selecionadas
      if (!startDate || !endDate) {
        alert("Por favor, selecione ambas as datas (início e fim)");
        return;
      }
      const formattedStart = new Date(startDate).toISOString().split("T")[0];
      const formattedEnd = new Date(endDate).toISOString().split("T")[0];

      setIsExporting(true); // Mostra estado de carregamento
      const response = await fetch(
        `${
          import.meta.env.VITE_API_KEY
        }/workorder/export/excel?start=${formattedStart}&end=${formattedEnd}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Falha ao exportar relatório");
      }

      const blob = await response.blob(); // Obtém o blob do arquivo
      const fileName = `relatorio_enfesto_${formattedStart}_a_${formattedEnd}.xlsx`; // Gera o nome do arquivo com as datas
      saveAs(blob, fileName); // Faz o download do arquivo
      alert("Relatorio gerado com sucesso");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      alert("Ocorreu um erro ao exportar o relatório: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };
  return (
    <div className="flex flex-col items-center dashboard-container">
      <Modal open={exportOpen} onClose={() => setExportOpen(false)}>
        <div className="input-align alg-itens-center mgt-2">
          <div className="flex">
            <div className="line-inputs">
              <div className="input-align">
                <label>De:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input inputs-placeholder"
                />
              </div>
              <div className="input-align ">
                <label>Até:</label>
                <input
                  type="date"
                  value={endDate}
                  max={getTodayFormatted()}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input inputs-placeholder"
                />
              </div>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="icon-button flex gap-2 alinhamentoBtnExport exporButton"
            disabled={isExporting}
            style={{ opacity: isExporting ? 0.7 : 1 }}
          >
            {isExporting ? (
              <span
                className="export-loading "
                style={{ marginRight: "0.5em" }}
              />
            ) : (
              <img
                src="/images/export-icon.svg"
                alt="Exportar"
                className="imgIcon1"
              />
            )}
            <span>{isExporting ? "Exportando..." : "Exportar Excel"}</span>
          </button>
        </div>
      </Modal>
      <section className="flex justify-between">
        <a className="button transition" onClick={() => setExportOpen(true)}>
          Exportar Base de Dados (Excel)
        </a>
      </section>
      <div className="section-background section-background-size">
        <table>
          <thead>
            <tr>
              {[
                { key: "id", label: "Placa" },
                { key: "status", label: "Status" },
                { key: "actualSize", label: "Tamanho Restante" },
                { key: "layers", label: "Camadas" },
              ].map((column) => (
                <th
                  key={column.key}
                  className="cursor-pointer border2"
                  onClick={() => handleSort(column.key)}
                  style={{
                    fontWeight:
                      sortConfig.key === column.key ? "bold" : "normal",
                  }}
                >
                  <div className="th-flex">{column.label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedOt.map((record) => (
              <tr key={record.id} className="border1 border-gray-200">
                <td className="border2">{record.id}</td>
                <td className="border2">{record.status}</td>
                <td className="border2">{record.actualSize}</td>
                <td className="border2">{record.layers}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
