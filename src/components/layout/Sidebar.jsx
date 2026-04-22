import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const MENU = [
  {
    icon: 'home',
    label: 'Inicio',
    route: '/home',
    type: 'symbol',
  },
  {
    icon: 'folder_copy',
    label: 'Projetos',
    type: 'symbol',
    children: [
      { icon: 'create_new_folder', label: 'Cadastro', route: '/projetos/cadastro', type: 'symbol' },
      { icon: 'description', label: 'Espelhos', route: '/projetos/espelhos', type: 'symbol' },
    ],
  },
  {
    icon: 'precision_manufacturing',
    label: 'PCP',
    type: 'symbol',
    children: [
      {
        label: 'Ordens',
        route: '/pcp/ordens',
        svgPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      },
      {
        label: 'Acompanhamento',
        route: '/pcp/acompanhamento',
        svgPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      },
      {
        label: 'Relatórios PCP',
        route: '/pcp/relatorios',
        svgPath: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      },
    ],
  },
  {
    label: 'Usuários',
    svgPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    children: [
      {
        label: 'Gerenciar',
        route: '/users',
        svgPath: 'M8 7a4 4 0 118 0 4 4 0 01-8 0zm-2 10a6 6 0 0112 0v1H6v-1z',
      },
      {
        label: 'Acesso',
        route: '/users/acesso',
        svgPath: 'M12 11c1.657 0 3-1.343 3-3V7a3 3 0 10-6 0v1c0 1.657 1.343 3 3 3zm-6 9v-3a6 6 0 1112 0v3H6z',
      },
    ],
  },
  {
    label: 'Configurações',
    route: '/settings',
    svgPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
];

function MenuIcon({ item, className = 'w-5 h-5' }) {
  if (item.type === 'symbol') {
    return (
      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
        {item.icon}
      </span>
    );
  }
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.svgPath} />
    </svg>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);

  const allowedRoutes = new Set(currentUser?.menuAccess || []);
  const hasAccess = allowedRoutes.size === 0;

  const visibleMenu = MENU.map((item) => {
    if (item.children) {
      const kids = item.children.filter((c) => hasAccess || !c.route || allowedRoutes.has(c.route));
      if (kids.length === 0) return null;
      return { ...item, children: kids };
    }
    if (!item.route || hasAccess || allowedRoutes.has(item.route)) return item;
    return null;
  }).filter(Boolean);

  useEffect(() => {
    const handleClick = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setCollapsed(true);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isActive = (route) => location.pathname === route || location.hash === `#${route}`;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = (label, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (collapsed) setCollapsed(false);
    setExpandedMenu((prev) => (prev === label ? null : label));
  };

  const handleNavClick = (route) => {
    navigate(route);
    setCollapsed(true);
  };

  return (
    <>
      {/* Link para Material Symbols */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
      />

      <aside
        ref={sidebarRef}
        className={`fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-300 shadow-2xl ${
          collapsed ? 'w-16' : 'w-64'
        }`}
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-slate-700">
          {!collapsed && (
            <span className="text-white font-bold text-lg tracking-wide">Maestro</span>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="text-slate-100 hover:text-white p-1 rounded transition-colors ml-auto"
            title={collapsed ? 'Expandir' : 'Recolher'}
          >
            {collapsed ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {visibleMenu.map((item) => {
            if (item.children) {
              const open = expandedMenu === item.label;
              return (
                <div key={item.label}>
                  <button
                    onClick={(e) => toggleMenu(item.label, e)}
                    title={collapsed ? item.label : ''}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-100 hover:bg-slate-700 hover:text-white transition-colors text-sm ${
                      collapsed ? 'justify-center' : ''
                    }`}
                  >
                    <MenuIcon item={item} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <svg
                          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                  {!collapsed && open && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <button
                          key={child.route}
                          onClick={() => handleNavClick(child.route)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive(child.route)
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-100 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <MenuIcon item={child} className="w-4 h-4" />
                          <span>{child.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.route}
                onClick={() => handleNavClick(item.route)}
                title={collapsed ? item.label : ''}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive(item.route)
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-100 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <MenuIcon item={item} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-700 p-3">
          {currentUser && (
            <div className={`flex items-center gap-3 mb-3 ${collapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {currentUser.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-white text-xs font-medium truncate">{currentUser.name}</p>
                  <p className="text-slate-100 text-xs truncate">{currentUser.email}</p>
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            title={collapsed ? 'Sair' : ''}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-100 hover:bg-red-600 hover:text-white transition-colors text-sm ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
