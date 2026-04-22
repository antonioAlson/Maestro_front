import { useState } from "react";
import {
  Menu,
  X,
  ChevronRight,
  Layers,
  Package,
  Inbox,
  Settings,
  Info,
  Plus,
  List,
  Scissors,
  Wrench,
  FileText,
  BarChart3,
  Monitor,
  Home,
  FolderOpen,
  FolderPlus,
  ClipboardList,
  Activity,
  PieChart,
  Users,
  UserCog,
  Lock,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  TrendingDown,
  ShieldCheck,
  Paperclip,
} from "lucide-react";

function SidebarAccordion({ item, isCollapsed, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);

  if (item.direct) {
    return (
      <button
        onClick={() => onNavigate(item.path)}
        title={isCollapsed ? item.title : undefined}
        className={`w-full flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-white hover:bg-slate-800 ${
          isCollapsed ? "justify-center px-2" : "px-3"
        }`}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && <span>{item.title}</span>}
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => !isCollapsed && setIsOpen(!isOpen)}
        title={isCollapsed ? item.title : undefined}
        className={`w-full flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-white hover:bg-slate-800 ${
          isCollapsed ? "justify-center px-2" : "px-3 justify-between"
        }`}
      >
        <div className="flex items-center gap-3">
          <item.icon className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>{item.title}</span>}
        </div>
        {!isCollapsed && (
          <ChevronRight
            className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
              isOpen ? "rotate-90" : ""
            }`}
          />
        )}
      </button>

      {!isCollapsed && isOpen && (
        <div className="ml-3 mt-0.5 mb-1 border-l-2 border-slate-700 pl-3 space-y-0.5">
          {item.items.map((sub, i) => (
            <button
              key={i}
              onClick={() => (sub.action ? sub.action() : onNavigate(sub.path))}
              disabled={sub.disabled}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                sub.disabled
                  ? "text-white/50 cursor-not-allowed"
                  : "text-white hover:bg-slate-800"
              }`}
            >
              <sub.icon className="w-4 h-4 flex-shrink-0" />
              <span>{sub.name}</span>
              {sub.disabled && (
                <span className="ml-auto text-xs bg-slate-700 text-slate-100 px-1.5 py-0.5 rounded">
                  Em breve
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarNav({ collapsed, onNavigate, setAboutOpen }) {
  const carbonItems = [
    {
      id: "enfesto",
      title: "Enfesto",
      icon: Layers,
      items: [
        { name: "Criar OT", path: "/create-ot", icon: Plus },
        { name: "Listar OT", path: "/", icon: List },
      ],
    },
    {
      id: "autoclave",
      title: "Autoclave",
      icon: Wrench,
      items: [{ name: "Gerenciar", path: "/CreateCicleAutoClave", icon: Settings }],
    },
    {
      id: "corte",
      title: "Corte",
      icon: Scissors,
      items: [
        { name: "Apontamento de Corte", path: "/corte", icon: Monitor },
        { name: "Dashboard", path: "/dash", icon: BarChart3 },
      ],
    },
    {
      id: "recebimento",
      title: "Recebimento",
      icon: Inbox,
      items: [
        { name: "Criar Recebimento", path: "/CreateReceipt", icon: Plus },
        { name: "Listar Recebimento", path: "/ListReceipt", icon: List },
      ],
    },
    {
      id: "outros",
      title: "Outros",
      icon: Settings,
      items: [
        { name: "Identificação", path: "/TestBody", icon: FileText },
        { name: "Sobre o Orquestra", action: () => setAboutOpen(true), icon: Info },
        { name: "PCP Estoque", path: "/PCP_production", icon: BarChart3 },
      ],
    },
  ];

  const maestroItems = [
    { id: "maestro-home", title: "Início", icon: Home, direct: true, path: "/home" },
    {
      id: "projetos",
      title: "Projetos",
      icon: FolderOpen,
      items: [
        { name: "Cadastro", path: "/projetos/cadastro", icon: FolderPlus },
        { name: "Espelhos", path: "/projetos/espelhos", icon: FileText },
      ],
    },
    {
      id: "pcp-maestro",
      title: "PCP",
      icon: ClipboardList,
      items: [
        { name: "Ordens", path: "/pcp/ordens", icon: ClipboardList },
        { name: "Acompanhamento", path: "/pcp/acompanhamento", icon: Activity },
        { name: "Relatórios PCP", path: "/pcp/relatorios", icon: PieChart },
      ],
    },
    {
      id: "faturamento",
      title: "Faturamento",
      icon: Receipt,
      items: [
        { name: "Apontamento de NF",    path: "/invoicing",           icon: FileText    },
        { name: "Aging de Faturamento", path: "/invoicing/aging",     icon: TrendingDown },
        { name: "Integridade de Docs",  path: "/invoicing/integrity", icon: ShieldCheck },
      ],
    },
    {
      id: "usuarios",
      title: "Usuários",
      icon: Users,
      items: [
        { name: "Gerenciar", path: "/users", icon: UserCog },
        { name: "Acesso", path: "/users/acesso", icon: Lock },
      ],
    },
    {
      id: "configuracoes",
      title: "Configurações",
      icon: SlidersHorizontal,
      direct: true,
      path: "/settings",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
      {!collapsed ? (
        <p className="px-3 pt-1 pb-2 text-xs font-semibold text-white uppercase tracking-widest">
          Orquestra
        </p>
      ) : (
        <div className="pb-2 border-b border-slate-700 mx-1" />
      )}

      {carbonItems.map((item) => (
        <SidebarAccordion
          key={item.id}
          item={item}
          isCollapsed={collapsed}
          onNavigate={onNavigate}
        />
      ))}

      <div className={`my-2 border-t border-slate-700 ${collapsed ? "mx-1" : "mx-2"}`} />

      {!collapsed && (
        <p className="px-3 pt-1 pb-2 text-xs font-semibold text-white uppercase tracking-widest">
          Maestro
        </p>
      )}

      {maestroItems.map((item) => (
        <SidebarAccordion
          key={item.id}
          item={item}
          isCollapsed={collapsed}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

export function NavBarComponent({ onNavigate }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const handleNavigate = (path) => {
    if (onNavigate) onNavigate(path);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* ── Desktop Sidebar ───────────────────────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col bg-slate-900 border-r border-slate-700/50 shadow-2xl h-screen flex-shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-72"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center h-16 border-b border-slate-700/50 px-3 flex-shrink-0 ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          {isCollapsed ? (
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Package className="w-5 h-5 text-white" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white tracking-wide">Orquestra</span>
              </div>
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 rounded-lg text-white hover:bg-slate-800 transition-all"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Nav items */}
        <SidebarNav
          collapsed={isCollapsed}
          onNavigate={handleNavigate}
          setAboutOpen={setAboutOpen}
        />

        {/* Expand button when collapsed */}
        {isCollapsed && (
          <div className="flex-shrink-0 p-2 border-t border-slate-700/50">
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-full flex items-center justify-center p-2 rounded-xl text-white hover:bg-slate-800 transition-all"
              title="Expandir menu"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>
          </div>
        )}
      </aside>

      {/* ── Mobile: top bar ──────────────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-700/50 h-14 flex items-center px-4 gap-3 shadow-lg">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-1.5 rounded-lg text-white hover:bg-slate-800 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-white">Orquestra</span>
        </div>
      </div>

      {/* ── Mobile: sidebar drawer ───────────────────────────────────────────── */}
      {isMobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="md:hidden fixed top-0 left-0 h-full w-72 bg-slate-900 border-r border-slate-900 shadow-2xl z-50 flex flex-col text-white">
            <div className="flex items-center justify-between h-16 border-b border-slate-700/50 px-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Orquestra</span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-lg text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarNav
              collapsed={false}
              onNavigate={handleNavigate}
              setAboutOpen={setAboutOpen}
            />
          </aside>
        </>
      )}

      {/* ── Modal "Sobre" ────────────────────────────────────────────────────── */}
      {aboutOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Orquestra</h2>
                    <p className="text-sm text-gray-500">Sistema de Gestão</p>
                  </div>
                </div>
                <button
                  onClick={() => setAboutOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="border-t border-gray-200 pt-4 text-center space-y-2">
                  <p className="text-gray-700">
                    <strong>Desenvolvido por:</strong> Antonio Ailton
                  </p>
                  <p className="text-sm text-gray-500">© Opera 2025</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 text-center">
                  <Info className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Sistema integrado para gestão de produção industrial
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setAboutOpen(false)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
