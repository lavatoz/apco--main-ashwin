import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, Navigate, NavLink, useLocation } from 'react-router-dom';
import type { Client, Invoice, Booking, Division, Task, Expense, Project } from './types';
import { getDisplayId } from './utils/displayId';
import {
  Lock,
  LayoutDashboard, Sparkles, Settings,
  Package, Wallet, Plus, Users, Command, Briefcase, Menu
} from 'lucide-react';
import ThemeDiagnosticsPanel from './components/ThemeDiagnosticsPanel';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import ClientManager from './components/ClientManager';
import FinanceManager from './components/FinanceManager';
import ClientPortal from './components/ClientPortal';
import AIToolsView from './components/AIToolsView';
import SettingsView from './components/SettingsView';
import NotificationCenter from './components/NotificationCenter';
import FallbackWarning from './components/FallbackWarning';

import AuditLogsView from './components/AuditLogsView';
import ProductionHub from './components/ProductionHub';
import Sidebar from './components/Sidebar';
import Breadcrumb from './components/Breadcrumb';
import PhotographyWorkflow from './components/PhotographyWorkflow';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import PackagesPage from './pages/PackagesPage';
import PortfolioPage from './pages/PortfolioPage';
import CollectionDetailPage from './pages/CollectionDetailPage';
import LoginPage from './pages/LoginPage';
import InvitePage from './pages/InvitePage';
import SetupAccountPage from './pages/SetupAccountPage';
import TeamPage from './pages/TeamPage';
import ClientDetailsPage from './pages/ClientDetailsPage';
import CreateProjectPage from './pages/CreateProjectPage';
import DivisionDashboard from './pages/DivisionDashboard';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import AgreementPage from './pages/AgreementPage';
import CompanySettingsPage from './pages/CompanySettingsPage';
import AlertsPage from './pages/AlertsPage';
import CoordinationPage from './pages/CoordinationPage';
import CoordinationCenter from './pages/CoordinationCenter';
import GalleryCollectionsPage from './components/admin/gallery/GalleryCollectionsPage';
import GalleryEditorPage from './components/admin/gallery/GalleryEditorPage';
import WebsiteDivisionsManager from './components/settings/WebsiteDivisionsManager';
import WebsiteDivisionForm from './components/settings/WebsiteDivisionForm';
import BrandDetailPage from './pages/BrandDetailPage';
import SecurityHubPage from './pages/SecurityHubPage';
import StaffPortal from './pages/staff/StaffPortal';
import PublicVerifyDocumentPage from './pages/PublicVerifyDocumentPage';
import { useCompanySettings, clearCompanySettingsCache } from './hooks/useCompanySettings';
import { type UserPermission, type CompanyProfile } from './types';
import { usePermissions } from './hooks/usePermissions';

import ClientDashboard from './pages/client/ClientDashboard';
import ClientActivityPage from './pages/client/ClientActivityPage';
import ClientEvents from './pages/client/ClientEvents';
import ClientTimeline from './pages/client/ClientTimeline';
import ClientDeliverables from './pages/client/ClientDeliverables';
import ClientGallery from './pages/client/ClientGallery';
import ClientInvoices from './pages/client/ClientInvoices';
import ClientAgreements from './pages/client/ClientAgreements';
import ClientMessages from './pages/client/ClientMessages';
import ClientDirectory from './pages/client/ClientDirectory';
import ClientSupport from './pages/client/ClientSupport';

import { api } from './services/api';
import { getAuthUser, removeAuthUser } from './utils/storage';
import { applyTheme } from './utils/themeEngine';

type AuthRole = 'none' | 'Admin' | 'Staff' | 'Client';

// --- Sub-Components (Defined outside App to prevent re-mounting) ---

const RoleProtectedRoute = ({ allowedRoles, children }: { allowedRoles: AuthRole[], children: React.ReactNode }) => {
  const user = getAuthUser();
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'Admin') return <>{children}</>;
  if (allowedRoles.includes(user.role)) return <>{children}</>;

  return <Navigate to="/unauthorized" replace />;
};

const PermissionRoute = ({ permission, children, allowedRoles }: { permission?: UserPermission, children: React.ReactNode, allowedRoles?: AuthRole[] }) => {
  const { hasRoutePermission, user } = usePermissions();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admins bypass all guards
  if (user.role === 'Admin') {
    return <>{children}</>;
  }

  // Role-based authorization
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'Client') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/unauthorized" replace />;
  }

  // Role-based Hard Gate: Block clients from everything except specific routes
  if (user.role === 'Client') {
    const allowedPaths = ['/dashboard', '/events', '/timeline', '/workflow', '/directory', '/gallery', '/deliverables', '/invoices', '/agreements', '/messages', '/support', '/unauthorized', '/agreement'];
    const currentPath = location.pathname;
    const isAllowed = allowedPaths.some(p => currentPath.startsWith(p));
    if (!isAllowed) {
      return <Navigate to="/dashboard" replace />;
    }

    // Clients bypass explicit permission checks since their access is determined strictly by the hard gate
    return <>{children}</>;
  }

  // Permission Check using the new normalized mapping
  if (!hasRoutePermission(location.pathname)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Secondary explicit permission check if provided
  if (permission && !user.permissions.includes(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

const NavItem = ({ to, icon: Icon, label }: { to: string, icon: React.ElementType, label: string }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `touch-target flex flex-col items-center justify-center gap-1 flex-1 py-2 px-1 transition-all duration-300 group ${isActive ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
    >
      {({ isActive }) => (
        <>
          <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-white/10' : ''}`}>
            <Icon className={`w-5 h-5 ${isActive ? 'fill-white' : ''}`} />
          </div>
          <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest hidden sm:block truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
};

const UserIndicator = ({ authRole, loggedInUserName, handleLogout }: { authRole: AuthRole, loggedInUserName: string, handleLogout: () => void }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  if (authRole === 'none') return null;

  return (
    <div className="relative flex items-center gap-4">
      <div className="hidden lg:flex flex-col items-end">
        <p className="text-[10px] font-black uppercase text-white tracking-widest leading-none">
          {loggedInUserName}
        </p>
        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1">
          ({authRole})
        </p>
      </div>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all active:scale-95 group relative"
      >
        <span className="text-xs font-black text-white group-hover:scale-110 transition-transform">{loggedInUserName.charAt(0).toUpperCase()}</span>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-black" />
      </button>

      {isMenuOpen && (
        <div className="absolute top-14 right-0 w-56 glass-panel-dark border border-white/10 rounded-[1.5rem] p-2 shadow-2xl animate-ios-slide-up z-[100]">
          <div className="p-4 border-b border-white/5 mb-2">
            <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-1">Session Protocol</p>
            <p className="text-xs font-bold text-white uppercase">{loggedInUserName} ({authRole})</p>
          </div>
          <button className="w-full text-left p-3.5 rounded-xl hover:bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Setup Profile
          </button>
          <button onClick={handleLogout} className="w-full text-left p-3.5 rounded-xl hover:bg-red-500/10 text-[10px] font-black uppercase tracking-widest text-red-500 transition-all flex items-center gap-3">
            <Lock className="w-3.5 h-3.5" /> Lock Station
          </button>
        </div>
      )}
    </div>
  );
};

const CompanySelector = ({ authRole, selectedCompanyId, setSelectedCompanyId, companies }: { authRole: AuthRole, selectedCompanyId: string, setSelectedCompanyId: (id: string) => void, companies: CompanyProfile[] }) => {
  if (authRole === 'none' || authRole === 'Client') return null;

  return (
    <div className="hidden lg:flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-2 rounded-2xl">
      <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest border-r border-white/10 pr-3 mr-1">Brand Portal</p>
      <select
        value={selectedCompanyId}
        onChange={(e) => setSelectedCompanyId(e.target.value)}
        className="bg-transparent border-none outline-none text-[10px] font-black text-white uppercase tracking-widest cursor-pointer"
      >
        <option value="All" className="bg-zinc-950 text-white">All Entities</option>
        {companies.map(c => (
          <option key={c.id} value={c.id} className="bg-zinc-950 text-white">{c.companyName}</option>
        ))}
      </select>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [authRole, setAuthRole] = useState<AuthRole>(() => {
    const user = getAuthUser();
    return user ? (user.role as AuthRole) : 'none';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(() => {
    const user = getAuthUser();
    return user ? true : false;
  });
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const fetchInitiated = useRef(false);
  const messagingInitialized = useRef(false);
  const foregroundUnsubscribe = useRef<(() => void) | null>(null);

  const { hasPermission } = usePermissions();
  const { companies, settings, selectedCompanyId, setSelectedCompanyId, globalSettings } = useCompanySettings();
  const [isFABOpen, setIsFABOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);

  const [loggedInUserName, setLoggedInUserName] = useState<string>(() => {
    const user = getAuthUser();
    return user ? (user.name || user.email.split('@')[0]) : '';
  });

  const navigate = useNavigate();


  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [c, i, t, b, e, d, p] = await Promise.all([
        api.getClients(),
        api.getInvoices(),
        api.getTasks(),
        api.getBookings(),
        api.getExpenses(),
        api.getDivisions(),
        api.getProjects()
      ]);
      const sortedClients = [...c].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setClients(sortedClients);
      setProjects(p);
      setInvoices(i);
      setTasks(t);
      setBookings(b);
      setExpenses(e);
      setDivisions(d);
    } catch (err) {
      console.error("Critical Registry desync:", err);
    } finally {
      if (!silent) setIsLoading(false);
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    const handleSync = () => {
      fetchData(true);
    };
    window.addEventListener('finance-updated', handleSync);
    return () => window.removeEventListener('finance-updated', handleSync);
  }, []);

  useEffect(() => {
    const handleSync = () => {
      fetchData(true);
    };
    window.addEventListener('tasks-updated', handleSync);
    return () => window.removeEventListener('tasks-updated', handleSync);
  }, []);

  // Cross-tab multi-session synchronization & Tab activation listeners
  useEffect(() => {
    const syncAuthState = () => {
      const currentUser = getAuthUser();
      if (currentUser) {
        const newRole = currentUser.role as AuthRole;
        setAuthRole(prev => (prev !== newRole ? newRole : prev));
        const newName = currentUser.name || currentUser.email?.split('@')[0] || '';
        setLoggedInUserName(prev => (prev !== newName ? newName : prev));
      } else {
        setAuthRole('none');
        sessionStorage.removeItem('active_role');
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('auth_user_') || e.key.startsWith('access_token_')) {
        syncAuthState();
      }
    };

    const handleTabReactivation = () => {
      syncAuthState();
    };

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        syncAuthState();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('visibilitychange', handleTabReactivation);
    window.addEventListener('focus', handleTabReactivation);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('visibilitychange', handleTabReactivation);
      window.removeEventListener('focus', handleTabReactivation);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  useEffect(() => {
    if (authRole !== 'none') {
      if (!fetchInitiated.current) {
        fetchInitiated.current = true;
        fetchData(false);
        setHasFetched(true);
      }
      // Request permission and register listeners exactly once per authenticated session
      if (!messagingInitialized.current) {
        messagingInitialized.current = true;
        import('./services/messaging').then(({ requestNotificationPermission, registerForegroundMessageListener }) => {
          requestNotificationPermission()
            .then((permission) => {
              if (permission === 'granted') {
                registerForegroundMessageListener((payload) => {
                  console.log('Foreground push notification payload received:', payload);
                  // Refresh notification states on new messages
                  fetchData(true);
                }).then((unsub) => {
                  // Capture unsubscribe cleanup function
                  foregroundUnsubscribe.current = unsub;
                }).catch((err) => {
                  console.error('Failed to register foreground messaging listener:', err);
                });
              }
            })
            .catch((err) => {
              console.error('Failed to request notification permission:', err);
            });
        });
      }
    } else {
      setIsInitialLoading(false);
      setHasFetched(false);
      fetchInitiated.current = false;
      // Cleanup messaging resources on unauthenticated/logout states
      if (foregroundUnsubscribe.current) {
        foregroundUnsubscribe.current();
        foregroundUnsubscribe.current = null;
      }
      messagingInitialized.current = false;
      import('./services/messaging').then(({ clearMessagingSession }) => {
        clearMessagingSession();
      });
    }
  }, [authRole, hasFetched]);

  // Theme Engine Application
  useEffect(() => {
    const themePreset = settings.themePreset || 'artisans-noir';
    const graphicsPreset = settings.graphicsPreset || 'classic';
    const typographyPreset = settings.typographyPreset || 'executive';

    applyTheme(themePreset, graphicsPreset, typographyPreset, globalSettings.customThemes || []);
  }, [settings, globalSettings.customThemes]);

  // Seeding removed for security compliance




  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn("Logout request failed", err);
    }
    
    // Clear hook caches and settings from local storage
    clearCompanySettingsCache();

    // Reset React data states to clear stale client/user data
    setClients([]);
    setInvoices([]);
    setTasks([]);
    setBookings([]);
    setExpenses([]);
    setDivisions([]);
    setSelectedCompanyId('All'); // Safeguard workspace selection

    removeAuthUser();
    fetchInitiated.current = false;
    setAuthRole('none');
    navigate('/login');
  };



  const handleAuthLogin = (user: any) => {
    setIsInitialLoading(true);
    setAuthRole(user.role as AuthRole);
    setLoggedInUserName(user.name || user.email.split('@')[0]);

    if (user.role === 'Client') {
      // Handled by global resolution logic below
    }

    // Manual Redirect calculation to avoid hook race conditions
    let destination = '/dashboard';
    if (user.role === 'Client') {
      destination = '/dashboard';
    } else if (user.role === 'Staff') {
      destination = '/workspace';
    } else if (user.permissions.includes('dashboard')) {
      destination = '/dashboard';
    } else if (user.permissions.includes('finance')) {
      destination = '/ledger';
    } else if (user.permissions.length > 0) {
      // General map for other permissions
      const map: Record<string, string> = { clients: '/directory', tasks: '/tasks', ai: '/copilot', workflow: '/workflow' };
      destination = map[user.permissions[0]] || '/dashboard';
    }

    navigate(destination);
  };

  // Auth Handling Wrapper
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-10 font-sans">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <div className="w-16 h-16 bg-white text-black rounded-3xl flex items-center justify-center font-bold text-2xl font-serif shadow-[0_0_30px_rgba(255,255,255,0.15)]">
            {settings.companyName ? settings.companyName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Initializing System</p>
            <p className="text-[8px] font-mono uppercase tracking-[0.2em] text-zinc-500">Securing environment & hydrating registry...</p>
          </div>
        </div>
      </div>
    );
  }

  if (authRole === 'none') {
    return (
      <>
        <Routes>
          <Route path="/" element={<LandingPage onLogin={() => navigate('/login')} />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/collections/:slug" element={<CollectionDetailPage />} />
          <Route path="/packages" element={<PackagesPage onLogin={() => navigate('/login')} />} />
          <Route path="/invite/:token" element={<InvitePage onLogin={handleAuthLogin} />} />
          <Route path="/setup-account" element={<SetupAccountPage />} />
          <Route path="/setup-account/:token" element={<SetupAccountPage />} />
          <Route path="/login" element={<LoginPage onLogin={handleAuthLogin} />} />
          <Route path="/verify/:documentId" element={<PublicVerifyDocumentPage />} />
          <Route path="/unauthorized" element={<div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-10"><h1 className="text-4xl font-black text-white mb-4">RESTRICTED ACCESS</h1><p className="text-zinc-500 font-mono text-xs mb-8">Permission Profile Conflict Detected</p><button onClick={() => navigate('/')} className="px-6 py-2 bg-white text-black text-[10px] font-black uppercase rounded-full">Return Base</button></div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    );
  }

  // Step 1: Base Client Data Isolation
  const authUser = getAuthUser() || {};
  const isClient = authUser.role === 'Client';

  // Find the exact client record linked to this user login
  const activeClient = (isClient ? clients.find(
    c => c.email && authUser.email && c.email.trim().toLowerCase() === (authUser.email as string).trim().toLowerCase()
  ) : null) ?? null;

  if (isClient && !activeClient && !isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-10">
        <h1 className="text-4xl font-black text-white mb-4">RESTRICTED ACCESS</h1>
        <p className="text-zinc-500 font-mono text-xs mb-8">No client profile linked to this account.</p>
        <button onClick={handleLogout} className="px-6 py-2 bg-white text-black text-[10px] font-black uppercase rounded-full">Logout</button>
      </div>
    );
  }

  const linkedClientId = activeClient?.id;

  if (isClient && !isLoading) {
    console.log("AUTH USER:", authUser);
    console.log("ACTIVE CLIENT:", activeClient);
    console.log("CLIENT ID:", linkedClientId);
    console.log("CLIENT FOUND:", !!activeClient);
  }

  const baseClients = isClient && linkedClientId ? clients.filter(c => c.id === linkedClientId) : clients;
  const baseInvoices = isClient && linkedClientId ? invoices.filter(i => i.clientId === linkedClientId) : invoices;
  const baseTasks = isClient && linkedClientId ? tasks.filter(t => t.client === linkedClientId) : tasks;
  const baseBookings = isClient && linkedClientId ? bookings.filter(b => b.clientId === linkedClientId) : bookings;

  // Step 2: Company/Division Filtering
  const selectedCompany =
    selectedCompanyId === 'All'
      ? companies.find(c => c.isDefault) || companies[0]
      : companies.find(c => c.id === selectedCompanyId);

  const filteredClients = selectedCompanyId === 'All' ? baseClients : baseClients.filter(c =>
    c.companyId === selectedCompanyId ||
    c.brandId === selectedCompanyId ||
    c.divisionId === selectedCompanyId ||
    (selectedCompany && (
      (c.brand || '').trim().toLowerCase() === selectedCompany.companyName.trim().toLowerCase() ||
      (c.companyName || '').trim().toLowerCase() === selectedCompany.companyName.trim().toLowerCase()
    ))
  );

  const filteredInvoices = selectedCompanyId === 'All' ? baseInvoices : baseInvoices.filter(i =>
    i.brandId === selectedCompanyId ||
    (i as any).companyId === selectedCompanyId ||
    (selectedCompany && i.brand === selectedCompany.companyName)
  );

  const filteredTasks = selectedCompanyId === 'All' ? baseTasks : baseTasks.filter(t =>
    (t as any).companyId === selectedCompanyId ||
    t.brand === selectedCompanyId ||
    (selectedCompany && t.brand === selectedCompany.companyName)
  );

  const filteredBookings = selectedCompanyId === 'All' ? baseBookings : baseBookings.filter(b =>
    (b as any).companyId === selectedCompanyId ||
    b.brand === selectedCompanyId ||
    (selectedCompany && b.brand === selectedCompany.companyName)
  );


  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col font-sans selection-primary">
      <header className="px-6 py-4 flex flex-col gap-4 glass-panel-dark z-50 pt-safe font-sans sticky top-0 lg:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-zinc-400 hover:text-white active:scale-95 transition-all lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-white text-black squircle-sm flex items-center justify-center font-bold text-lg font-serif shadow-[0_0_20px_rgba(255,255,255,0.15)] overflow-hidden">
              {settings.logo ? (
                <img src={settings.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                settings.companyName ? settings.companyName.charAt(0).toUpperCase() : 'A'
              )}
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 leading-none mb-1">Workspace</p>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                <p className="text-xs font-black uppercase text-white tracking-wide leading-none">{settings.companyName || 'Artisans'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <button onClick={handleLogout} className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 active:scale-95 transition-all">
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
        {authRole !== 'Client' && (
          <div className="flex bg-white/5 p-1 rounded-xl">
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-[9px] font-black text-white uppercase tracking-[0.2em] px-4 py-2 cursor-pointer"
            >
              <option value="All" className="bg-zinc-950 text-white">All Entities</option>
              {companies.map(c => (
                <option key={c.id} value={c.id} className="bg-zinc-950 text-white">{c.companyName}</option>
              ))}
            </select>
          </div>
        )}
      </header>

      <div className="flex flex-1 relative font-sans">
        {/* Main Sidebar (Responsive) - Dynamic based on Permissions */}
        <Sidebar
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          onLogout={handleLogout}
        />

        <main className="flex-1 lg:pl-72 overflow-y-auto overflow-x-hidden pb-safe relative">
          {/* Matte Glass Noise Texture Background */}
          <div className="fixed inset-0 pointer-events-none bg-noise z-0 opacity-50" />

          <div className="max-w-none p-4 md:p-14 animate-ios-slide-up relative z-10">
            {isLoading && (
              <div className="fixed top-20 right-10 z-[100] flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Syncing Systems...
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[9px] font-black uppercase tracking-widest flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="hover:text-white transition-colors">Dismiss</button>
              </div>
            )}

            <div className="flex items-start justify-between mb-8 gap-4">
              {(() => {
                const customLabels: Record<string, string> = {};
                clients.forEach(c => {
                  const code = c.clientCode;
                  const label = getDisplayId(code, c.id);
                  if (c.id) customLabels[c.id] = label;
                  if (c._id) customLabels[c._id] = label;
                });
                projects.forEach(p => {
                  const code = p.projectCode;
                  const label = getDisplayId(code, p.id);
                  if (p.id) customLabels[p.id] = label;
                  if (p._id) customLabels[p._id] = label;
                });
                invoices.forEach(inv => {
                  const isQuote = inv.isQuotation || inv.type === 'quotation';
                  const code = isQuote ? inv.quotationCode : inv.invoiceCode;
                  const label = getDisplayId(code, inv.id);
                  if (inv.id) customLabels[inv.id] = label;
                });
                return <Breadcrumb customLabels={customLabels} />;
              })()}
              <div className="flex items-center gap-4">
                <CompanySelector authRole={authRole} selectedCompanyId={selectedCompanyId} setSelectedCompanyId={setSelectedCompanyId} companies={companies} />
                <div className="hidden lg:block">
                  <NotificationCenter />
                </div>
                <div className="hidden lg:block">
                  <UserIndicator authRole={authRole} loggedInUserName={loggedInUserName} handleLogout={handleLogout} />
                </div>
              </div>
            </div>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/setup-account" element={<Navigate to="/" replace />} />
              <Route path="/setup-account/:token" element={<Navigate to="/" replace />} />

              <Route path="/workspace" element={<PermissionRoute allowedRoles={['Staff']}><StaffPortal selectedBrand={selectedCompanyId} /></PermissionRoute>} />

              {/* Management Routes - Admin, Staff, and Client substitution */}
              <Route path="/dashboard" element={<PermissionRoute allowedRoles={['Admin', 'Client']} permission="dashboard">
                {authRole === 'Client' ? <ClientDashboard client={activeClient} invoices={invoices} bookings={bookings} /> : <Dashboard invoices={filteredInvoices} clients={filteredClients} bookings={filteredBookings} tasks={filteredTasks} selectedBrand={selectedCompanyId} userRole={authRole} divisions={divisions} addDivision={async (d) => { await api.saveDivision(d); fetchData(true); }} deleteDivision={async (id) => {
                  setDivisions(prev => prev.filter(div => div.id !== id));
                  await api.deleteDivision(id);
                  fetchData(true);
                }} addClient={async (c) => {
                  const isEditing = clients.some(client => client.id === c.id || (client._id && c._id && client._id === c._id));
                  if (isEditing) {
                    setClients(prev => prev.map(item => (item.id === c.id || (item._id && c._id && item._id === c._id)) ? c : item));
                    const saved = await api.updateClient(c.id, c);
                    setClients(prev => prev.map(item => (item.id === c.id || (item._id && c._id && item._id === c._id)) ? saved : item));
                    fetchData(true);
                    return saved;
                  } else {
                    setClients(prev => [c, ...prev]);
                    const saved = await api.createClient(c);
                    setClients(prev => prev.map(item => (item.id === c.id || (item._id && c._id && item._id === c._id)) ? saved : item));
                    fetchData(true);
                    return saved;
                  }
                }} />}
              </PermissionRoute>} />
              <Route path="/project/:id" element={<PermissionRoute allowedRoles={['Admin']}><ProjectDetailsPage /></PermissionRoute>} />
              <Route path="/staff-dashboard" element={<Navigate to="/workspace" replace />} />
              <Route path="/tasks" element={<PermissionRoute allowedRoles={['Admin']} permission="tasks">
                <ProductionHub clients={filteredClients} tasks={filteredTasks} selectedBrand={selectedCompanyId} companies={companies} />
              </PermissionRoute>} />
              <Route path="/workflow" element={<PermissionRoute allowedRoles={['Admin', 'Client']} permission="workflow">
                {authRole === 'Client' ? <ClientTimeline client={activeClient} /> : <PhotographyWorkflow selectedBrand={selectedCompanyId} />}
              </PermissionRoute>} />
              <Route path="/analytics" element={<PermissionRoute allowedRoles={['Admin']} permission="analytics"><AnalyticsDashboard /></PermissionRoute>} />
              <Route path="/ledger" element={<PermissionRoute allowedRoles={['Admin', 'Client']} permission="finance"><FinanceManager invoices={filteredInvoices} expenses={expenses} clients={filteredClients} companies={companies} selectedBrand={selectedCompanyId} userRole={authRole} /></PermissionRoute>} />
              <Route path="/revenue" element={<PermissionRoute allowedRoles={['Admin', 'Client']} permission="finance"><FinanceManager invoices={filteredInvoices} expenses={expenses} clients={filteredClients} companies={companies} selectedBrand={selectedCompanyId} userRole={authRole} /></PermissionRoute>} />
              <Route path="/copilot" element={<PermissionRoute allowedRoles={['Admin']} permission="ai"><AIToolsView clients={filteredClients} selectedBrand={selectedCompanyId} /></PermissionRoute>} />
              <Route path="/create-project/:clientId" element={<PermissionRoute allowedRoles={['Admin']} permission="clients"><CreateProjectPage /></PermissionRoute>} />
              <Route path="/division/:divisionId" element={<PermissionRoute allowedRoles={['Admin']} permission="system"><DivisionDashboard /></PermissionRoute>} />
              <Route path="/client" element={<Navigate to="/directory" replace />} />
              <Route path="/client/:id" element={<PermissionRoute allowedRoles={['Admin']} permission="clients"><ClientDetailsPage /></PermissionRoute>} />
              <Route path="/directory" element={<PermissionRoute allowedRoles={['Admin', 'Client']} permission="clients">
                {authRole === 'Client' ? <ClientDirectory client={activeClient} /> : <ClientManager clients={filteredClients} divisions={divisions} addClient={async (c) => {
                  const isEditing = clients.some(client => client.id === c.id || (client._id && c._id && client._id === c._id));
                  if (isEditing) {
                    setClients(prev => prev.map(item => (item.id === c.id || (item._id && c._id && item._id === c._id)) ? c : item));
                    const saved = await api.updateClient(c.id, c);
                    setClients(prev => prev.map(item => (item.id === c.id || (item._id && c._id && item._id === c._id)) ? saved : item));
                    fetchData(true);
                    return saved;
                  } else {
                    setClients(prev => [c, ...prev]);
                    const saved = await api.createClient(c);
                    setClients(prev => prev.map(item => (item.id === c.id || (item._id && c._id && item._id === c._id)) ? saved : item));
                    fetchData(true);
                    return saved;
                  }
                }} deleteClient={async (id) => {
                  setClients(prev => prev.filter(cl => cl.id !== id));
                  await api.deleteClient(id);
                  fetchData(true);
                }} selectedDivisionId={selectedCompanyId} onOpenPortal={(client) => navigate(`/client/${client.id}`)} userRole={authRole} userId={getAuthUser()?.id} />}
              </PermissionRoute>} />
              <Route path="/ecosystem" element={<PermissionRoute allowedRoles={['Admin']} permission="system"><SettingsView onOpenTeam={() => navigate('/team')} isAdmin={authRole === 'Admin'} /></PermissionRoute>} />
              <Route path="/ecosystem/gallery" element={<PermissionRoute allowedRoles={['Admin']} permission="system"><GalleryCollectionsPage /></PermissionRoute>} />
              <Route path="/ecosystem/gallery/new" element={<PermissionRoute allowedRoles={['Admin']} permission="system"><GalleryEditorPage /></PermissionRoute>} />
              <Route path="/ecosystem/gallery/:id/edit" element={<PermissionRoute allowedRoles={['Admin']} permission="system"><GalleryEditorPage /></PermissionRoute>} />
              <Route path="/admin/gallery" element={<PermissionRoute allowedRoles={['Admin']} permission="system"><GalleryCollectionsPage /></PermissionRoute>} />
              <Route path="/admin/gallery/new" element={<PermissionRoute allowedRoles={['Admin']} permission="system"><GalleryEditorPage /></PermissionRoute>} />
              <Route path="/admin/gallery/:id/edit" element={<PermissionRoute allowedRoles={['Admin']} permission="system"><GalleryEditorPage /></PermissionRoute>} />
              <Route path="/ecosystem/divisions" element={<PermissionRoute allowedRoles={['Admin']} permission="system"><WebsiteDivisionsManager /></PermissionRoute>} />
              <Route path="/ecosystem/divisions/new" element={<PermissionRoute allowedRoles={['Admin']} permission="system"><WebsiteDivisionForm /></PermissionRoute>} />
              <Route path="/ecosystem/divisions/:id/edit" element={<PermissionRoute allowedRoles={['Admin']} permission="system"><WebsiteDivisionForm /></PermissionRoute>} />
              <Route path="/ecosystem/brand/:brandId" element={<PermissionRoute allowedRoles={['Admin']} permission="system"><BrandDetailPage /></PermissionRoute>} />
              <Route path="/system" element={<Navigate to="/ecosystem" replace />} />
              <Route path="/team" element={<PermissionRoute allowedRoles={['Admin']} permission="system"><TeamPage /></PermissionRoute>} />
              <Route path="/logs" element={<PermissionRoute allowedRoles={['Admin']} permission="system"><AuditLogsView /></PermissionRoute>} />
              <Route path="/calendar" element={<PermissionRoute allowedRoles={['Admin', 'Client']} permission="tasks"><CoordinationCenter clients={filteredClients} invoices={filteredInvoices} companies={companies} selectedBrand={selectedCompanyId} /></PermissionRoute>} />
              <Route path="/settings" element={<PermissionRoute allowedRoles={['Admin']}><CompanySettingsPage /></PermissionRoute>} />
              <Route path="/alerts" element={<PermissionRoute allowedRoles={['Admin']}><AlertsPage /></PermissionRoute>} />
              <Route path="/coordination" element={<PermissionRoute allowedRoles={['Admin']}>
                <CoordinationPage />
              </PermissionRoute>} />
              <Route path="/security" element={<PermissionRoute allowedRoles={['Admin']}><SecurityHubPage /></PermissionRoute>} />

              {/* Deliverables Top-level route for client */}
              <Route path="/deliverables" element={<PermissionRoute allowedRoles={['Admin', 'Client']}><ClientDeliverables client={activeClient} /></PermissionRoute>} />
              <Route path="/gallery" element={<PermissionRoute allowedRoles={['Admin', 'Client']}><ClientGallery client={activeClient} /></PermissionRoute>} />

              {/* Client Restricted Top-level Routes */}
              <Route path="/events" element={<PermissionRoute allowedRoles={['Client']}><ClientEvents client={activeClient} /></PermissionRoute>} />
              <Route path="/timeline" element={<PermissionRoute allowedRoles={['Client']}><ClientActivityPage client={activeClient} invoices={invoices} bookings={bookings} /></PermissionRoute>} />
              <Route path="/invoices" element={<PermissionRoute allowedRoles={['Client']}><ClientInvoices client={activeClient} invoices={invoices} /></PermissionRoute>} />
              <Route path="/agreements" element={<PermissionRoute allowedRoles={['Client']}><ClientAgreements client={activeClient} /></PermissionRoute>} />
              <Route path="/messages" element={<PermissionRoute allowedRoles={['Client', 'Admin', 'Staff']}><ClientMessages client={activeClient} /></PermissionRoute>} />
              <Route path="/support" element={<PermissionRoute allowedRoles={['Client']}><ClientSupport client={activeClient} /></PermissionRoute>} />

              {/* Legacy portal route for backward compatibility / staff view */}
              <Route path="/portal/:clientId" element={<RoleProtectedRoute allowedRoles={['Client', 'Admin', 'Staff']}><ClientPortal client={activeClient || {} as Client} onUpdateClient={() => { }} onBack={() => navigate('/login')} userRole={authRole} /></RoleProtectedRoute>} />
              <Route path="/agreement/:quoteId" element={<RoleProtectedRoute allowedRoles={['Client']}><AgreementPage /></RoleProtectedRoute>} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/collections/:slug" element={<CollectionDetailPage />} />
              <Route path="/verify/:documentId" element={<PublicVerifyDocumentPage />} />

              <Route path="/unauthorized" element={<div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-10"><h1 className="text-4xl font-black text-white mb-4">RESTRICTED ACCESS</h1><p className="text-zinc-500 font-mono text-xs mb-8">Permission Profile Conflict Detected</p><button onClick={() => navigate('/')} className="px-6 py-2 bg-white text-black text-[10px] font-black uppercase rounded-full">Return Base</button></div>} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Floating Action Menu (FAB) for Mobile */}
      {isFABOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60] flex flex-col items-center justify-end pb-36 p-6 animate-ios-slide-up lg:hidden" onClick={() => setIsFABOpen(false)}>
          {/* ... existing FAB code ... */}
          {/* (Keeping existing FAB code, essentially unchanged but wrapped in context) */}
          <div className="w-full max-w-sm grid grid-cols-2 gap-4">
            {hasPermission('ai') && (
              <button onClick={() => { navigate('/copilot'); setIsFABOpen(false); }} className="glass-panel p-6 squircle-lg flex flex-col items-center gap-3 group border border-white/10 hover:border-white/20 hover:bg-white/10">
                <div className="p-4 bg-primary rounded-2xl group-active:scale-90 transition-all shadow-primary"><Sparkles className="w-6 h-6 text-white" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">CoPilot AI</span>
              </button>
            )}
            {hasPermission('clients') && (
              <button onClick={() => { navigate('/directory'); setIsFABOpen(false); }} className="glass-panel p-6 squircle-lg flex flex-col items-center gap-3 group border border-white/10 hover:border-white/20 hover:bg-white/10">
                <div className="p-4 bg-emerald-600 rounded-2xl group-active:scale-90 transition-all shadow-[0_0_20px_rgba(5,150,105,0.3)]"><Users className="w-6 h-6 text-white" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">New Project</span>
              </button>
            )}
            {hasPermission('tasks') && (
              <button onClick={() => { navigate('/tasks'); setIsFABOpen(false); }} className="glass-panel p-6 squircle-lg flex flex-col items-center gap-3 group border border-white/10 hover:border-white/20 hover:bg-white/10">
                <div className="p-4 bg-amber-600 rounded-2xl group-active:scale-90 transition-all shadow-[0_0_20px_rgba(217,119,6,0.3)]"><Package className="w-6 h-6 text-white" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Ops Log</span>
              </button>
            )}
            {hasPermission('finance') && (
              <button onClick={() => { navigate('/revenue'); setIsFABOpen(false); }} className="glass-panel p-6 squircle-lg flex flex-col items-center gap-3 group border border-white/10 hover:border-white/20 hover:bg-white/10">
                <div className="p-4 bg-red-600 rounded-2xl group-active:scale-90 transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]"><Wallet className="w-6 h-6 text-white" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Invoice</span>
              </button>
            )}
          </div>
          <div className="mt-8 flex items-center gap-3 opacity-50">
            <Command className="w-4 h-4 text-white" />
            <p className="text-[9px] font-mono uppercase text-white tracking-[0.3em]">Command Menu</p>
          </div>
        </div>
      )}

      {/* Mobile Nav */}
      {authRole === 'Admin' && (
        <nav className="fixed bottom-0 left-0 right-0 glass-panel-dark border-t border-white/5 px-2 sm:px-6 pt-3 z-[70] flex items-center justify-between lg:hidden" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          {hasPermission('dashboard') && <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />}
          {hasPermission('tasks') && <NavItem to="/tasks" icon={Package} label="Ops" />}
          <div className="flex flex-col items-center -mt-10 flex-1 relative z-50">
            <button
              onClick={() => setIsFABOpen(!isFABOpen)}
              className={`w-14 h-14 md:w-16 md:h-16 ${isFABOpen ? 'bg-zinc-800 rotate-45' : 'bg-white shadow-[0_0_30px_rgba(255,255,255,0.2)]'} rounded-[1.2rem] md:rounded-[1.5rem] flex items-center justify-center border-[4px] md:border-[6px] border-black transition-all duration-500 active:scale-90`}
            >
              <Plus className={`w-6 h-6 md:w-7 md:h-7 ${isFABOpen ? 'text-white' : 'text-black'}`} />
            </button>
          </div>
          {hasPermission('finance') && <NavItem to="/ledger" icon={Wallet} label="Ledger" />}
          {hasPermission('system') && <NavItem to="/ecosystem" icon={Settings} label="Ecosystem" />}
        </nav>
      )}

      {authRole === 'Staff' && (
        <nav className="fixed bottom-0 left-0 right-0 glass-panel-dark border-t border-white/5 px-2 sm:px-6 pt-3 z-[70] flex items-center justify-around lg:hidden" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <NavItem to="/workspace" icon={Briefcase} label="Workspace" />
        </nav>
      )}

      {/* Theme Diagnostics Panel */}
      {import.meta.env.DEV && <ThemeDiagnosticsPanel />}
      <FallbackWarning />
    </div>
  );
};

export default App;

