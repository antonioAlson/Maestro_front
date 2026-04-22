import React, { useState } from 'react';
import { Save, ArrowLeft, Plus, Hash, Package2, Layers3, Calendar, FileText, Shirt, Zap } from 'lucide-react';
import api from "../config/apiService.js";

export function CreateOT() {
  const [inputs, setInputs] = useState({
    enfestoDate: getTodayFormatted(),
  });
  const [isSaving, setIsSaving] = useState(false);

  function getTodayFormatted() {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setInputs((values) => ({ ...values, [name]: value.toUpperCase() }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    const body = {
      lote: inputs.lote,
      platesQuantity: inputs.quantidade,
      clothType: inputs.cloth,
      clothBatch: inputs.clothBatch,
      plasticType: inputs.plastic,
      plasticBatch: inputs.plasticBatch,
      platesLayres: inputs.camadas,
      resinedBatch: inputs.resineBatch,
      enfestoDate: `${inputs.enfestoDate}T00:00:00`,
    };

    try {
      const response = await api.post("/workorder", body);
      alert("Ordem criada com sucesso! OT: " + response.data.id);
      setInputs({ enfestoDate: getTodayFormatted() });
    } catch (error) {
      console.error(
        "Erro ao criar ordem:",
        error.response?.data || error.message
      );
      alert("Erro ao criar a Ordem!");
    } finally {
      setIsSaving(false);
    }
  };

  const getCompletedFields = () => {
    const requiredFields = ['lote', 'quantidade', 'camadas', 'plastic', 'plasticBatch', 'cloth', 'clothBatch', 'resineBatch'];
    return requiredFields.filter(field => inputs[field] && inputs[field].toString().trim() !== '').length;
  };

  const totalRequired = 8;
  const completed = getCompletedFields();
  const progress = (completed / totalRequired) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar Nova Ordem de Trabalho</h1>
                <p className="text-gray-600">Preencha as informações para criar uma nova OT</p>
              </div>
            </div>
            
            {/* Progress Card */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Progresso</p>
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{completed}</p>
                  <p className="text-xs text-gray-500">de {totalRequired}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Sections */}
        <div className="space-y-6">
          
          {/* Basic Information Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Hash className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Informações Básicas</h2>
                  <p className="text-sm text-gray-500">Dados principais da ordem de trabalho</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lote *
                  </label>
                  <input
                    type="text"
                    name="lote"
                    placeholder="Digite o lote"
                    value={inputs.lote || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade de Placas *
                  </label>
                  <input
                    type="number"
                    name="quantidade"
                    placeholder="Quantidade"
                    value={inputs.quantidade || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    min={1}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Camadas *
                  </label>
                  <select
                    name="camadas"
                    value={inputs.camadas || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="11">11</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Enfesto
                  </label>
                  <input
                    type="date"
                    name="enfestoDate"
                    value={inputs.enfestoDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    max={getTodayFormatted()}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Plastic Materials Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Materiais Plásticos</h2>
                  <p className="text-sm text-gray-500">Informações sobre os plásticos utilizados</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Plástico *
                  </label>
                  <input
                    type="text"
                    name="plastic"
                    placeholder="Ex: CAF, PU, ..."
                    value={inputs.plastic || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lote do Plástico *
                  </label>
                  <input
                    type="text"
                    name="plasticBatch"
                    placeholder="Lote do plástico"
                    value={inputs.plasticBatch || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Textile Materials Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Shirt className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Materiais Têxteis</h2>
                  <p className="text-sm text-gray-500">Informações sobre tecidos e resinados</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Tecido *
                  </label>
                  <input
                    type="text"
                    name="cloth"
                    placeholder="Ex: Aramida, Porcher"
                    value={inputs.cloth || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lote do Tecido *
                  </label>
                  <input
                    type="text"
                    name="clothBatch"
                    placeholder="Lote do tecido"
                    value={inputs.clothBatch || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lote Resinado (RWO) *
                  </label>
                  <input
                    type="text"
                    name="resineBatch"
                    placeholder="Lote resinado"
                    value={inputs.resineBatch || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{completed}</span> de <span className="font-medium">{totalRequired}</span> campos obrigatórios preenchidos
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={isSaving || completed < totalRequired}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-2.5 rounded-xl flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Criar Ordem de Trabalho
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}