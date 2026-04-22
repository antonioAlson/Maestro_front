import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import maestroApi from '../services/maestroApi';

const AuthContext = createContext(null);

const TOKEN_KEY = 'maestro_token';
const TABS_KEY = 'maestro_active_tabs';
const TAB_SESSION_KEY = 'maestro_tab_id';
const RELOAD_FLAG_KEY = 'maestro_tab_reloading';
const LAST_UNLOAD_KEY = 'maestro_last_unload_at';
const STALE_THRESHOLD = 45000;
const HEARTBEAT_INTERVAL = 15000;
const RELOAD_GRACE = 5000;

function generateTabId() {
  return `tab_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function readTabsMap() {
  try {
    const raw = localStorage.getItem(TABS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeTabsMap(tabs) {
  if (Object.keys(tabs).length === 0) {
    localStorage.removeItem(TABS_KEY);
  } else {
    localStorage.setItem(TABS_KEY, JSON.stringify(tabs));
  }
}

function purgeStaleTabs() {
  const now = Date.now();
  const tabs = readTabsMap();
  let changed = false;
  Object.entries(tabs).forEach(([id, lastSeen]) => {
    if (now - Number(lastSeen) > STALE_THRESHOLD) {
      delete tabs[id];
      changed = true;
    }
  });
  if (changed) writeTabsMap(tabs);
}

function getActiveTabsCount() {
  return Object.keys(readTabsMap()).length;
}

function hadRecentUnload() {
  const raw = localStorage.getItem(LAST_UNLOAD_KEY);
  if (!raw) return false;
  const lastUnloadAt = Number(raw);
  return !Number.isNaN(lastUnloadAt) && Date.now() - lastUnloadAt <= RELOAD_GRACE;
}

function isReloadNavigation() {
  const entries = performance.getEntriesByType('navigation');
  if (entries.length > 0) return entries[0].type === 'reload';
  return performance.navigation?.type === 1;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const tabIdRef = useRef('');
  const heartbeatRef = useRef(null);

  const getToken = useCallback(() => localStorage.getItem(TOKEN_KEY), []);

  const setToken = useCallback((token) => {
    localStorage.setItem(TOKEN_KEY, token);
  }, []);

  const isAuthenticated = useCallback(() => !!localStorage.getItem(TOKEN_KEY), []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TABS_KEY);
    localStorage.removeItem(LAST_UNLOAD_KEY);
    sessionStorage.removeItem(TAB_SESSION_KEY);
    sessionStorage.removeItem(RELOAD_FLAG_KEY);
    setCurrentUser(null);
  }, []);

  const loadCurrentUser = useCallback(async () => {
    try {
      const res = await maestroApi.get('/auth/me');
      if (res.data?.success) {
        setCurrentUser(res.data.data.user);
      }
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        logout();
      }
    }
  }, [logout]);

  const reloadCurrentUser = useCallback(() => loadCurrentUser(), [loadCurrentUser]);

  const login = useCallback(async (email, password) => {
    const res = await maestroApi.post('/auth/login', { email, password });
    if (res.data?.success) {
      setToken(res.data.data.token);
      setCurrentUser(res.data.data.user);
    }
    return res.data;
  }, [setToken]);

  const listUsers = useCallback(async () => {
    const res = await maestroApi.get('/auth/users');
    return res.data?.data?.users || [];
  }, []);

  const createManagedUser = useCallback(async (name, email, password) => {
    const res = await maestroApi.post('/auth/users', { name, email, password });
    return res.data;
  }, []);

  const updateUserAccess = useCallback(async (userId, menuAccess) => {
    const res = await maestroApi.put(`/auth/users/${userId}/access`, { menuAccess });
    if (res.data?.success) {
      const updated = res.data.data.user;
      setCurrentUser(prev => {
        if (prev && prev.id === updated.id) {
          return { ...prev, menuAccess: updated.menuAccess || [] };
        }
        return prev;
      });
    }
    return res.data;
  }, []);

  useEffect(() => {
    const hadReloadFlag = sessionStorage.getItem(RELOAD_FLAG_KEY) === '1';
    sessionStorage.removeItem(RELOAD_FLAG_KEY);

    purgeStaleTabs();
    const hadActiveTabs = getActiveTabsCount() > 0;

    if (!hadActiveTabs && !hadReloadFlag && !isReloadNavigation() && !hadRecentUnload()) {
      localStorage.removeItem(TOKEN_KEY);
    }

    let tabId = sessionStorage.getItem(TAB_SESSION_KEY);
    if (!tabId) {
      tabId = generateTabId();
      sessionStorage.setItem(TAB_SESSION_KEY, tabId);
    }
    tabIdRef.current = tabId;

    const registerTab = () => {
      const tabs = readTabsMap();
      tabs[tabIdRef.current] = Date.now();
      writeTabsMap(tabs);
    };

    const unregisterTab = () => {
      const tabs = readTabsMap();
      delete tabs[tabIdRef.current];
      writeTabsMap(tabs);
    };

    registerTab();

    heartbeatRef.current = setInterval(() => {
      purgeStaleTabs();
      registerTab();
    }, HEARTBEAT_INTERVAL);

    const handleUnload = () => {
      sessionStorage.setItem(RELOAD_FLAG_KEY, '1');
      localStorage.setItem(LAST_UNLOAD_KEY, Date.now().toString());
      unregisterTab();
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      loadCurrentUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    return () => {
      clearInterval(heartbeatRef.current);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [loadCurrentUser]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      isAuthenticated,
      getToken,
      login,
      logout,
      listUsers,
      createManagedUser,
      updateUserAccess,
      reloadCurrentUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
