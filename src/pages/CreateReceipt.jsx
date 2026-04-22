import { useState } from "react";
import api from "../config/apiService";

export function CreateReceipt() {
  const [isSaving, setIsSaving] = useState(false);
  const [inputs, setInputs] = useState({
    receiveDate: getTodayFormatted()
  });

  function getTodayFormatted() {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setInputs((values) => ({
      ...values,
      [name]: typeof value === "string" ? value.toUpperCase() : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    const body = {
      nf: inputs.nf,
      internBatch: inputs.internBatch,
      situation: inputs.situation,
      quantity: inputs.quantity,
      responsible: inputs.responsible,
      observation: inputs.observation || " ",
      receiveDate: inputs.receiveDate,
    };

    try {
      const response = await api.post("/receipt", body);
      alert(`Recebimento criado com sucesso! ID: ${response.data.id}`);
      setInputs({ receiveDate: getTodayFormatted() });
    } catch (error) {
      console.error(
        "Erro ao criar recebimento:",
        error.response?.data || error.message
      );
      alert("Erro ao criar o recebimento!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setInputs({ receiveDate: getTodayFormatted() });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Criar Novo Recebimento</h1>
          </div>
          <p className="text-slate-600 ml-13">
            Preencha os dados abaixo para registrar um novo recebimento
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Seção 1 */}
            <div>
              <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                Identificação
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <input
                  type="text"
                  name="nf"
                  placeholder="Número da Nota Fiscal"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg"
                  value={inputs.nf || ""}
                  onChange={handleChange}
                  required
                />

                <input
                  type="text"
                  name="internBatch"
                  placeholder="Código do Lote Interno"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg"
                  value={inputs.internBatch || ""}
                  onChange={handleChange}
                  required
                />

                <input
                  type="number"
                  name="quantity"
                  placeholder="Quantidade"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg"
                  value={inputs.quantity || ""}
                  onChange={handleChange}
                  min={1}
                  required
                />
              </div>
            </div>

            {/* Seção 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <input
                type="text"
                name="responsible"
                placeholder="Responsável"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg"
                value={inputs.responsible || ""}
                onChange={handleChange}
                required
              />

              <input
                type="date"
                name="receiveDate"
                max={getTodayFormatted()}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg"
                value={inputs.receiveDate || ""}
                onChange={handleChange}
                required
              />

              <select
                name="situation"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg"
                value={inputs.situation || ""}
                onChange={handleChange}
                required
              >
                <option value="">Selecione...</option>
                <option value="APROVADO">APROVADO</option>
                <option value="REPROVADO">REPROVADO</option>
              </select>
            </div>

            {/* Observação */}
            <textarea
              name="observation"
              rows={4}
              placeholder="Observações"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg"
              value={inputs.observation || ""}
              onChange={handleChange}
            />

            {/* Botões */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={handleClear}
                className="px-6 py-3 bg-slate-100 rounded-lg"
                disabled={isSaving}
              >
                Limpar
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg flex items-center gap-2"
              >
                {isSaving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
