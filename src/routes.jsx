import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

// Auth
import ProtectedRoute from './components/ProtectedRoute';

// Maestro pages
import Login from './pages/login/Login';
import Dashboard from './pages/dashboard/Dashboard';
import OrdensProducao from './pages/pcp/Ordens';
import Acompanhamento from './pages/pcp/Acompanhamento';
import RelatoriosPCP from './pages/pcp/Relatorios';
import UsersManage from './pages/users/UsersManage';
import ProjetosEspelhos from './pages/projetos/Espelhos';
import CadastroProjetos from './pages/projetos/Cadastro';

// Existing Carbon pages
import { Enfesto } from './pages/Enfesto';
import { CreateOT } from './pages/CreateOt';
import { CreateReceipt } from './pages/CreateReceipt';
import { ListReceipt } from './pages/ListReceipt';
import { TestBody } from './pages/TestBody_temp';
import { CreateCicleAutoClave } from './pages/autoclave/CreateAutoClaveCicle';
import { PCP_production } from './pages/PCP_production';
import { CuttingRecords } from './pages/corte/mainCorte';
import { DashboardPage } from './pages/corte/temp';
import { CuttingRecordInvoicePage } from './pages/invoicing/invoicing';
import { AgingPage } from './pages/invoicing/AgingPage';
import { IntegrityPage } from './pages/invoicing/IntegrityPage';
import { NavBarComponent } from './components/navBar';

function Settings() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
      <p className="text-slate-500 mt-2">Em desenvolvimento.</p>
    </div>
  );
}

function MainLayout() {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen overflow-hidden">
      <NavBarComponent onNavigate={navigate} />
      <main className="flex-1 overflow-auto bg-slate-50 pt-14 md:pt-0">
        <Routes>
          {/* Carbon pages */}
          <Route path="/" element={<Enfesto />} />
          <Route path="/CreateReceipt" element={<CreateReceipt />} />
          <Route path="/ListReceipt" element={<ListReceipt />} />
          <Route path="/CreateCicleAutoClave" element={<CreateCicleAutoClave />} />
          <Route path="/create-ot" element={<CreateOT />} />
          <Route path="/pdf/ot-plates/:id" element={<CreateOT />} />
          <Route path="/TestBody" element={<TestBody />} />
          <Route path="/PCP_production" element={<PCP_production />} />
          <Route path="/corte" element={<CuttingRecords />} />
          <Route path="/invoicing"           element={<ProtectedRoute><CuttingRecordInvoicePage /></ProtectedRoute>} />
          <Route path="/invoicing/aging"     element={<ProtectedRoute><AgingPage /></ProtectedRoute>} />
          <Route path="/invoicing/integrity" element={<ProtectedRoute><IntegrityPage /></ProtectedRoute>} />
          <Route path="/dash" element={<DashboardPage />} />

          {/* Maestro pages (autenticação obrigatória) */}
          <Route path="/home" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/pcp/ordens" element={<ProtectedRoute><OrdensProducao /></ProtectedRoute>} />
          <Route path="/pcp/acompanhamento" element={<ProtectedRoute><Acompanhamento /></ProtectedRoute>} />
          <Route path="/pcp/relatorios" element={<ProtectedRoute><RelatoriosPCP /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><UsersManage /></ProtectedRoute>} />
          <Route path="/users/acesso" element={<ProtectedRoute><UsersManage /></ProtectedRoute>} />
          <Route path="/projetos/espelhos" element={<ProtectedRoute><ProjetosEspelhos /></ProtectedRoute>} />
          <Route path="/projetos/cadastro" element={<ProtectedRoute><CadastroProjetos /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </main>
   </div>
  );
}

export function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </Router>
  );
}
