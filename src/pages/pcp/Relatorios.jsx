import { useState } from 'react';
import toast from 'react-hot-toast';
import { exportJiraReport, exportContecReport } from '../../services/jiraService';

function ReportCard({ title, desc, icon, color, loading, onGenerate }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-5 leading-snug">{desc}</p>
      <button
        onClick={onGenerate}
        disabled={loading}
        className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
          loading
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-slate-900 hover:bg-slate-700 text-white'
        }`}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            Gerando...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Gerar Excel
          </>
        )}
      </button>
    </div>
  );
}

export default function RelatoriosPCP() {
  const [generatingJira, setGeneratingJira] = useState(false);
  const [generatingContec, setGeneratingContec] = useState(false);

  const handleJiraReport = async () => {
    setGeneratingJira(true);
    try {
      await exportJiraReport(() => {
        toast('Download iniciado...', { icon: '⬇️' });
      });
      toast.success('Relatório Jira gerado com sucesso!');
    } catch (err) {
      const msg = err?.response?.data?.message;
      if (err?.response?.status === 400) toast.error('Credenciais do Jira não configuradas.');
      else if (err?.response?.status === 401) toast.error('Sessão expirada. Faça login novamente.');
      else if (err?.response?.status === 503) toast.error('Não foi possível conectar ao Jira.');
      else toast.error(msg || 'Erro ao gerar relatório.');
    } finally {
      setGeneratingJira(false);
    }
  };

  const handleContecReport = async () => {
    setGeneratingContec(true);
    try {
      await exportContecReport(() => {
        toast('Download iniciado...', { icon: '⬇️' });
      });
      toast.success('Relatório CONTEC gerado com sucesso!');
    } catch (err) {
      const msg = err?.response?.data?.message;
      if (err?.response?.status === 400) toast.error('Credenciais do Jira não configuradas.');
      else if (err?.response?.status === 503) toast.error('Não foi possível conectar ao Jira.');
      else toast.error(msg || 'Erro ao gerar relatório CONTEC.');
    } finally {
      setGeneratingContec(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">PCP - Relatórios</h1>
        <p className="text-slate-500 text-sm mt-0.5">Geração de relatórios em Excel</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-3xl">
        <ReportCard
          title="Relatório Jira"
          desc="Exporta todos os cards do Jira com status, situação, veículo e previsão de entrega."
          icon="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          color="bg-blue-600"
          loading={generatingJira}
          onGenerate={handleJiraReport}
        />
        <ReportCard
          title="Carros CONTEC"
          desc="Exporta issues CONTEC com formatação especial por marca (Land Rover, Toyota, Jaguar)."
          icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          color="bg-emerald-600"
          loading={generatingContec}
          onGenerate={handleContecReport}
        />
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-5 max-w-3xl">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-blue-800 text-sm font-medium mb-1">Sobre os relatórios</p>
            <p className="text-blue-600 text-xs leading-relaxed">
              Os relatórios são gerados em formato Excel (.xlsx) com formatação automática.
              Linhas de Land Rover, Toyota e Jaguar (exceto RAV4) são destacadas em vermelho.
              Os arquivos são baixados diretamente no seu navegador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
