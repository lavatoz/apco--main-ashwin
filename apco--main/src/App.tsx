import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, NavLink } from 'react-router-dom';
import type { Client, Invoice, Company, Task, Staff, Person, Project } from './types';
import {
  Lock, RefreshCw, Briefcase,
  LayoutDashboard, Heart, Sparkles, Settings,
  Terminal, ShieldCheck, Package, Wallet, Plus, Users, Command, ArrowLeft
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import ClientManager from './components/ClientManager';
import FinanceManager from './components/FinanceManager';
import ClientPortal from './components/ClientPortal';
import AIToolsView from './components/AIToolsView';
import SettingsView from './components/SettingsView';
import TaskManager from './components/TaskManager';
import TeamManager from './components/TeamManager';
import AuditLogsView from './components/AuditLogsView';
import ProductionHub from './components/ProductionHub';
import ClientDetails from './components/ClientDetails';
import Sidebar from './components/Sidebar';
import AnalyticsPage from './components/AnalyticsPage';
import FileManager from './components/FileManager';

import { api, API_URL } from './services/api';

type AuthRole = 'none' | 'Admin' | 'Staff' | 'Client';
type LoginMode = 'ADMIN' | 'STAFF' | 'CLIENT';

const App: React.FC = () => {
  const [authRole, setAuthRole] = useState<AuthRole>('none');
  const [showLogin, setShowLogin] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('ADMIN');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOTP] = useState('');
  const [showOTP, setShowOTP] = useState(false);

  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFABOpen, setIsFABOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  const [loggedInUserName, setLoggedInUserName] = useState<string>('');

  const navigate = useNavigate();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [c, i, co, t, s] = await Promise.all([
        api.getClients(),
        api.getInvoices(),
        api.getCompanies(),
        api.getTasks(),
        api.getStaff()
      ]);
      setClients(c);
      setInvoices(i);
      setCompanies(co);
      setTasks(t);
      setStaff(s);
    } catch {
      setError("Sync Error: Database connection unstable.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authRole !== 'none') fetchData();
  }, [authRole]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const role = loginMode.toLowerCase();
      console.log("Sending login:", { email, role });
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, role })
      });
      
      const data = await response.json().catch(() => ({}));
      console.log("Login response:", data);
      
      if (response.ok) {
        if (data.requiresMFA) {
            setShowOTP(true);
            setError(null);
            return;
        }

        if (data.user) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            
            const dbRole = data.user.role;
            const mappedRole = dbRole === 'admin' ? 'Admin' : (dbRole === 'client' ? 'Client' : 'Staff');
            setAuthRole(mappedRole);
            localStorage.setItem("userRole", mappedRole);
            setLoggedInUserName(data.user.name || 'User');
            setShowLogin(false);
            
            if (dbRole === "admin") navigate("/dashboard");
            else if (dbRole === "client") navigate("/client-dashboard");
            else if (dbRole === "staff") navigate("/staff-dashboard");
            else navigate("/dashboard");
        }
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);
      try {
          const res = await fetch(`${API_URL}/auth/mfa-verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, otp })
          });
          const data = await res.json();
          if (res.ok && data.token) {
              localStorage.setItem("token", data.token);
              localStorage.setItem("user", JSON.stringify(data.user));
              const mappedRole = data.user.role === 'admin' ? 'Admin' : (data.user.role === 'client' ? 'Client' : 'Staff');
              setAuthRole(mappedRole);
              localStorage.setItem("userRole", mappedRole);
              setLoggedInUserName(data.user.name || 'User');
              setShowLogin(false);
              setShowOTP(false);
              setOTP('');
              if (data.user.role === "admin") navigate("/dashboard");
              else if (data.user.role === "client") navigate("/client-dashboard");
              else if (data.user.role === "staff") navigate("/staff-dashboard");
          } else {
              setError(data.message || 'Invalid verification code');
          }
      } catch (err) {
          setError("Verification failed");
      } finally {
          setIsLoading(false);
      }
  };

  const performLogin = async (identifier: string, mode: LoginMode) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Cinematic delay

      if (mode === 'ADMIN' && identifier === 'admin') {
        setAuthRole('Admin');
        setLoggedInUserName('System Admin');
        api.logActivity({ action: 'System Admin Logged In', type: 'Login', actorId: 'ADMIN-01', actorName: 'Admin', actorRole: 'Admin' });
      } else if (mode === 'STAFF') {
        const staffList = await api.getStaff();
        const found = staffList.find(s => s.loginId.toLowerCase() === identifier);
        if (found) {
          setAuthRole('Staff');
          setLoggedInUserName(found.name);
          api.logActivity({ action: `${found.name} Logged In`, type: 'Login', actorId: found.id, actorName: found.name, actorRole: 'Staff' });
        } else { setError("Identity not found in staff registry."); }
      } else if (mode === 'CLIENT') {
        const clientList = await api.getClients();
        let foundClient: { client: Client, person: Person } | null = null;
        for (const c of clientList) {
          const p = c.people.find((person: Person) => person.loginId.toLowerCase() === identifier);
          if (p) { foundClient = { client: c, person: p }; break; }
        }
        if (foundClient) {
          setAuthRole('Client');
          setLoggedInUserName(foundClient.person.name);
          api.logActivity({
            action: `${foundClient.person.name} Accessed Portal`,
            type: 'Login',
            actorId: foundClient.person.id,
            actorName: foundClient.person.name,
            actorRole: 'Client',
            projectId: foundClient.client.id
          });
          navigate('/portal');
        } else { setError("Project ID invalid or restricted."); }
      } else if (mode === 'ADMIN') {
        setError("Invalid Administrative Credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (type: 'owner' | 'staff' | 'client') => {
    let email = '';
    let password = 'password123';
    let role = '';

    if (type === 'owner') {
      email = 'admin@apco.com';
      role = 'admin';
      setLoginMode('ADMIN');
    } else if (type === 'staff') {
      email = 'staff@test.com';
      role = 'staff';
      setLoginMode('STAFF');
    } else if (type === 'client') {
      email = 'joel@test.com';
      role = 'client';
      setLoginMode('CLIENT');
    }

    if (email) {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role })
        });
        const data = await response.json();
        if (response.ok && data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          const mappedRole = data.user.role === 'admin' ? 'Admin' : (data.user.role === 'client' ? 'Client' : 'Staff');
          setAuthRole(mappedRole);
          localStorage.setItem("userRole", mappedRole);
          setLoggedInUserName(data.user.name || 'User');
          setShowLogin(false);
          if (data.user.role === "admin") navigate("/dashboard");
          else if (data.user.role === "client") navigate("/client-dashboard");
          else if (data.user.role === "staff") navigate("/staff-dashboard");
        } else {
          // Fallback to old behavior if login fails
          performLogin(type === 'owner' ? 'admin' : (type === 'staff' ? 'staff_rahul' : 'ananya'), type === 'owner' ? 'ADMIN' : (type === 'staff' ? 'STAFF' : 'CLIENT'));
        }
      } catch (err) {
        performLogin(type === 'owner' ? 'admin' : (type === 'staff' ? 'staff_rahul' : 'ananya'), type === 'owner' ? 'ADMIN' : (type === 'staff' ? 'STAFF' : 'CLIENT'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: React.ElementType, label: string }) => {
    return (
      <NavLink
        to={to}
        className={({ isActive }) => `flex flex-col items-center gap-1.5 flex-1 py-3 transition-all duration-300 group ${isActive ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
      >
        {({ isActive }) => (
          <>
            <div className={`p-1 rounded-lg transition-all ${isActive ? 'bg-white/10' : ''}`}>
              <Icon className={`w-5 h-5 ${isActive ? 'fill-white' : ''}`} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
          </>
        )}
      </NavLink>
    );
  };

  // Auth Handling Wrapper
  if (authRole === 'none') {
    return (
      <>
        {/* Public Landing Page */}
        <LandingPage onLogin={() => setShowLogin(true)} />

        {/* Login Modal Overlay */}
        {showLogin && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-white overflow-hidden animate-ios-slide-up">
            {/* Background Noise for Matte Effect */}
            <div className="absolute inset-0 bg-noise pointer-events-none z-0" />

            <button onClick={() => setShowLogin(false)} className="absolute top-6 left-6 p-3 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-white flex items-center gap-2 z-20">
              <ArrowLeft className="w-4 h-4" /> <span className="text-[10px] font-black uppercase tracking-widest">Back to Website</span>
            </button>

            <div className="w-full max-w-sm relative z-10 flex flex-col items-center">

              {/* Brand Identity */}
              <div className="mb-12 text-center">
                <div className="w-16 h-16 mx-auto bg-white/90 backdrop-blur-md text-black squircle-sm flex items-center justify-center font-serif text-4xl font-black shadow-[0_0_50px_rgba(255,255,255,0.2)] mb-6 border border-white/20">A</div>
                <h1 className="text-2xl font-black uppercase tracking-[0.2em] mb-2">Artisans<span className="text-zinc-600">OS</span></h1>
                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Enterprise Resource Planning v5.5</p>
              </div>

              {/* Matte Glass Login Panel */}
              <div className="w-full glass-panel rounded-[2.5rem] p-2 shadow-2xl overflow-hidden relative">
                <div className="bg-black/40 p-1.5 rounded-[2rem] border border-white/5 flex gap-1 mb-8 backdrop-blur-md">
                  <button onClick={() => { setLoginMode('CLIENT'); }} className={`flex-1 py-3 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${loginMode === 'CLIENT' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                    <Heart className="w-3 h-3" /> Client
                  </button>
                  <button onClick={() => { setLoginMode('STAFF'); }} className={`flex-1 py-3 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${loginMode === 'STAFF' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                    <Briefcase className="w-3 h-3" /> Staff
                  </button>
                  <button onClick={() => { setLoginMode('ADMIN'); }} className={`flex-1 py-3 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${loginMode === 'ADMIN' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                    <ShieldCheck className="w-3 h-3" /> Owner
                  </button>
                </div>

                <form onSubmit={showOTP ? handleVerifyOTP : handleLogin} className="px-6 pb-6 space-y-6">
                  <div className="space-y-4 text-center">
                    {!showOTP ? (
                      <>
                        <p className="text-[9px] font-mono uppercase text-zinc-500 tracking-widest">Identity Verification</p>
                        <input
                          type="email"
                          required
                          className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-center focus:border-white/20 focus:bg-black/60 outline-none text-sm font-bold font-mono placeholder:text-zinc-800 transition-all backdrop-blur-sm"
                          placeholder="EMAIL ADDRESS"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                          type="password"
                          required
                          className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-center focus:border-white/20 focus:bg-black/60 outline-none text-sm font-bold font-mono placeholder:text-zinc-800 transition-all backdrop-blur-sm shadow-inner"
                          placeholder="PASSWORD"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-[9px] font-mono uppercase text-blue-500 tracking-widest animate-pulse">Dual-Factor Authentication</p>
                        <div className="space-y-4">
                          <input
                            type="text"
                            required
                            maxLength={6}
                            className="w-full bg-black/40 border border-blue-500/30 rounded-2xl p-6 text-white text-center focus:border-blue-500/50 focus:bg-black/60 outline-none text-3xl font-black font-mono placeholder:text-zinc-800 transition-all backdrop-blur-md tracking-[0.5em] shadow-[0_0_30px_rgba(37,99,235,0.1)]"
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => setOTP(e.target.value)}
                            autoFocus
                          />
                          <button type="button" onClick={() => setShowOTP(false)} className="text-[8px] font-black uppercase text-zinc-600 hover:text-white tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto">
                            <ArrowLeft className="w-3 h-3" /> Change Credentials
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-xl text-[10px] uppercase tracking-[0.2em]"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Command className="w-4 h-4" />}
                    {isLoading ? 'Processing...' : (showOTP ? 'Secure Access' : 'Authenticate')}
                  </button>

                  {error && <p className="text-red-500 text-[9px] font-mono uppercase tracking-widest animate-pulse text-center bg-red-500/5 py-2 rounded-lg border border-red-500/10">{error}</p>}
                </form>
              </div>

              {/* Dev Override */}
              <div className="mt-12 w-full border-t border-dashed border-zinc-800 pt-6">
                <p className="text-center text-[8px] font-black uppercase text-zinc-700 tracking-[0.3em] mb-4 flex items-center justify-center gap-2">
                  <Terminal className="w-3 h-3" /> Developer Override
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => quickLogin('owner')} className="group flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 group-hover:bg-white group-hover:text-black flex items-center justify-center transition-colors"><ShieldCheck className="w-4 h-4" /></div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white">Admin</span>
                  </button>
                  <button onClick={() => quickLogin('staff')} className="group flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 group-hover:bg-blue-500 group-hover:text-white flex items-center justify-center transition-colors"><Briefcase className="w-4 h-4" /></div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white">Staff</span>
                  </button>
                  <button onClick={() => quickLogin('client')} className="group flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 group-hover:bg-pink-500 group-hover:text-white flex items-center justify-center transition-colors"><Heart className="w-4 h-4" /></div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white">Client</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }


  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      <header className="px-6 py-4 flex items-center justify-between glass-panel-dark z-50 pt-safe sticky top-0 lg:hidden">
        <div className="flex items-center gap-4">
          <div onClick={() => setIsMobileOpen(true)} className="w-10 h-10 bg-white text-black squircle-sm flex items-center justify-center font-bold text-lg font-serif shadow-[0_0_20px_rgba(255,255,255,0.15)] cursor-pointer">A</div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 leading-none mb-1">Workspace</p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs font-black uppercase text-white tracking-wide leading-none">{loggedInUserName}</p>
            </div>
          </div>
        </div>
        <button onClick={() => { setAuthRole('none'); setShowLogin(false); }} className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 active:scale-95 transition-all">
          <Lock className="w-4 h-4" />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden relative">


        {/* Main Sidebar (Responsive) */}
        <Sidebar
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          userRole={authRole}
        />

        <main className="flex-1 overflow-y-auto no-scrollbar pb-safe relative">
          {/* Matte Glass Noise Texture Background */}
          <div className="fixed inset-0 pointer-events-none bg-noise z-0 opacity-50" />

          <div className="max-w-7xl mx-auto p-6 md:p-10 animate-ios-slide-up relative z-10">
            <div className="flex justify-end mb-8">
              <div className="flex bg-zinc-900/50 p-1 rounded-[1.2rem] border border-white/5 backdrop-blur-md">
                {['All', 'AAHA Kalyanam', 'Tiny Toes'].map((brand) => (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(brand)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedBrand === brand ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white'}`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
            <Routes>
              <Route path="/" element={<Dashboard clients={clients} invoices={invoices} tasks={tasks} selectedBrand={selectedBrand} userRole={authRole} />} />
              <Route path="/dashboard" element={<Dashboard clients={clients} invoices={invoices} tasks={tasks} selectedBrand={selectedBrand} userRole={authRole} />} />
              <Route path="/client-dashboard" element={<Dashboard clients={clients} invoices={invoices} tasks={tasks} selectedBrand={selectedBrand} userRole={authRole} />} />
              <Route path="/staff-dashboard" element={<Dashboard clients={clients} invoices={invoices} tasks={tasks} selectedBrand={selectedBrand} userRole={authRole} />} />
              <Route path="/analytics/:type" element={<AnalyticsPage />} />
              <Route path="/client/:id" element={<ClientDetails />} />
              <Route path="/production" element={<ProductionHub companies={companies} clients={clients} tasks={tasks} selectedBrand={selectedBrand} onOpenClient={(p: Project) => { console.log("ID:", p._id); navigate(`/portal/${p._id}`); }} />} />
              <Route path="/tasks" element={<ProductionHub companies={companies} clients={clients} tasks={tasks} selectedBrand={selectedBrand} onOpenClient={(p: Project) => { console.log("ID:", p._id); navigate(`/portal/${p._id}`); }} />} />
              <Route path="/directory" element={<ClientManager clients={clients} companies={companies} addClient={async (c) => { await api.saveClient(c); fetchData(); }} selectedBrand={selectedBrand} onOpenPortal={(c) => { console.log("ID:", c._id); navigate(`/client/${c._id}`); }} />} />
              <Route path="/finance" element={<FinanceManager invoices={invoices} clients={clients} companies={companies} updateInvoiceStatus={async (id: string, s: string) => { await api.updateInvoiceStatus(id, s); fetchData(); }} selectedBrand={selectedBrand} userRole={authRole} />} />
              <Route path="/copilot" element={<AIToolsView clients={clients} selectedBrand={selectedBrand} />} />
              <Route path="/system" element={<SettingsView companies={companies} addCompany={async (co) => { await api.saveCompany(co); fetchData(); }} onOpenTeam={() => navigate('/team')} isAdmin={authRole === 'Admin'} />} />
              <Route path="/portal/:id" element={<ClientPortal onUpdateClient={async (u) => { await api.saveClient(u); fetchData(); }} onBack={() => navigate('/production')} userRole={authRole} />} />
              <Route path="/team" element={<TeamManager staff={staff} onSaveStaff={async (s) => { await api.saveStaff(s); fetchData(); }} onDeleteStaff={async (id) => { await api.deleteStaff(id); fetchData(); }} />} />
              <Route path="/logs" element={<AuditLogsView />} />
              <Route path="/calendar" element={<TaskManager tasks={tasks} onSaveTask={async (t) => { await api.saveTask(t); fetchData(); }} onDeleteTask={async (id) => { await api.deleteTask(id); fetchData(); }} companies={companies} selectedBrand={selectedBrand} />} />
              <Route path="/vault" element={<FileManager />} />
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
            <button onClick={() => { navigate('/copilot'); setIsFABOpen(false); }} className="glass-panel p-6 squircle-lg flex flex-col items-center gap-3 group border border-white/10 hover:border-white/20 hover:bg-white/10">
              <div className="p-4 bg-blue-600 rounded-2xl group-active:scale-90 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"><Sparkles className="w-6 h-6 text-white" /></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">CoPilot AI</span>
            </button>
            <button onClick={() => { navigate('/directory'); setIsFABOpen(false); }} className="glass-panel p-6 squircle-lg flex flex-col items-center gap-3 group border border-white/10 hover:border-white/20 hover:bg-white/10">
              <div className="p-4 bg-emerald-600 rounded-2xl group-active:scale-90 transition-all shadow-[0_0_20px_rgba(5,150,105,0.3)]"><Users className="w-6 h-6 text-white" /></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">New Project</span>
            </button>
            <button onClick={() => { navigate('/tasks'); setIsFABOpen(false); }} className="glass-panel p-6 squircle-lg flex flex-col items-center gap-3 group border border-white/10 hover:border-white/20 hover:bg-white/10">
              <div className="p-4 bg-amber-600 rounded-2xl group-active:scale-90 transition-all shadow-[0_0_20px_rgba(217,119,6,0.3)]"><Package className="w-6 h-6 text-white" /></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Ops Log</span>
            </button>
            <button onClick={() => { navigate('/finance'); setIsFABOpen(false); }} className="glass-panel p-6 squircle-lg flex flex-col items-center gap-3 group border border-white/10 hover:border-white/20 hover:bg-white/10">
              <div className="p-4 bg-red-600 rounded-2xl group-active:scale-90 transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]"><Wallet className="w-6 h-6 text-white" /></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Invoice</span>
            </button>
          </div>
          <div className="mt-8 flex items-center gap-3 opacity-50">
            <Command className="w-4 h-4 text-white" />
            <p className="text-[9px] font-mono uppercase text-white tracking-[0.3em]">Command Menu</p>
          </div>
        </div>
      )}

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 glass-panel-dark border-t border-white/5 px-6 pb-6 pt-3 z-[70] flex items-center justify-between lg:hidden">
        <NavItem to="/" icon={LayoutDashboard} label="Home" />
        <NavItem to="/tasks" icon={Package} label="Ops" />
        <div className="flex flex-col items-center -mt-10 flex-1 relative z-50">
          <button
            onClick={() => setIsFABOpen(!isFABOpen)}
            className={`w-16 h-16 ${isFABOpen ? 'bg-zinc-800 rotate-45' : 'bg-white shadow-[0_0_30px_rgba(255,255,255,0.2)]'} rounded-[1.5rem] flex items-center justify-center border-[6px] border-black transition-all duration-500 active:scale-90`}
          >
            <Plus className={`w-7 h-7 ${isFABOpen ? 'text-white' : 'text-black'}`} />
          </button>
        </div>
        <NavItem to="/finance" icon={Wallet} label="Finance" />
        <NavItem to="/system" icon={Settings} label="System" />
      </nav>
    </div>
  );
};

export default App;
