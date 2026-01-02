
import React, { useState, useEffect } from 'react';
import { 
  Lock, RefreshCw, AlertCircle, Briefcase, 
  LayoutDashboard, Heart, Sparkles, Settings, 
  Terminal, ShieldCheck, History, Package, Wallet, Plus, X, Users, MessageSquare, Database, Zap, Command, ArrowLeft
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import ClientManager from './components/ClientManager';
import FinanceManager from './components/FinanceManager';
import ClientPortal from './components/ClientPortal';
import AIToolsView from './components/AIToolsView';
import SettingsView from './components/SettingsView';
import TaskManager from './components/TaskManager';
import ClientExperience from './components/ClientExperience';
import TeamManager from './components/TeamManager';
import AuditLogsView from './components/AuditLogsView';
import ProductionHub from './components/ProductionHub';
import Sidebar from './components/Sidebar';
import type { ViewState, Client, Invoice, Booking, Company, Task, Staff } from './types';
import { api } from './services/api';

type AuthRole = 'none' | 'Admin' | 'Staff' | 'Client';
type LoginMode = 'ADMIN' | 'STAFF' | 'CLIENT';

const App: React.FC = () => {
  const [authRole, setAuthRole] = useState<AuthRole>('none');
  const [showLogin, setShowLogin] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('ADMIN');
  const [loginId, setLoginId] = useState('admin');
  
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [activeStaff, setActiveStaff] = useState<Staff | null>(null);
  const [loggedInUserId, setLoggedInUserId] = useState<string>('');
  const [loggedInUserName, setLoggedInUserName] = useState<string>('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [c, i, co, t, s, b] = await Promise.all([
        api.getClients(),
        api.getInvoices(),
        api.getCompanies(),
        api.getTasks(),
        api.getStaff(),
        api.getBookings()
      ]);
      setClients(c);
      setInvoices(i);
      setCompanies(co);
      setTasks(t);
      setStaff(s);
      setBookings(b);
    } catch (err) {
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
    setIsLoading(true);
    setError(null);
    const identifier = loginId.trim().toLowerCase();
    await performLogin(identifier, loginMode);
  };

  const performLogin = async (identifier: string, mode: LoginMode) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800)); // Cinematic delay
    
    if (mode === 'ADMIN' && identifier === 'admin') {
      setAuthRole('Admin');
      setLoggedInUserId('ADMIN-01');
      setLoggedInUserName('System Admin');
      api.logActivity({ action: 'System Admin Logged In', type: 'Login', actorId: 'ADMIN-01', actorName: 'Admin', actorRole: 'Admin' });
    } else if (mode === 'STAFF') {
      const staffList = await api.getStaff();
      const found = staffList.find(s => s.loginId.toLowerCase() === identifier);
      if (found) {
        setAuthRole('Staff');
        setActiveStaff(found);
        setLoggedInUserId(found.id);
        setLoggedInUserName(found.name);
        api.logActivity({ action: `${found.name} Logged In`, type: 'Login', actorId: found.id, actorName: found.name, actorRole: 'Staff' });
      } else { setError("Identity not found in staff registry."); }
    } else if (mode === 'CLIENT') {
      const clientList = await api.getClients();
      let foundClient: any = null;
      for (const c of clientList) {
        const p = c.people.find(person => person.loginId.toLowerCase() === identifier);
        if (p) { foundClient = { client: c, person: p }; break; }
      }
      if (foundClient) {
        setAuthRole('Client');
        setActiveClient(foundClient.client);
        setLoggedInUserId(foundClient.person.id);
        setLoggedInUserName(foundClient.person.name);
        api.logActivity({ 
            action: `${foundClient.person.name} Accessed Portal`, 
            type: 'Login', 
            actorId: foundClient.person.id, 
            actorName: foundClient.person.name, 
            actorRole: 'Client', 
            projectId: foundClient.client.id
          });
      } else { setError("Project ID invalid or restricted."); }
    } else if (mode === 'ADMIN') {
        setError("Invalid Administrative Credentials.");
    }
    setIsLoading(false);
  };

  const quickLogin = (type: 'owner' | 'staff' | 'client') => {
    if (type === 'owner') {
      setLoginMode('ADMIN');
      setLoginId('admin');
      performLogin('admin', 'ADMIN');
    } else if (type === 'staff') {
      setLoginMode('STAFF');
      setLoginId('staff_rahul');
      performLogin('staff_rahul', 'STAFF');
    } else if (type === 'client') {
      setLoginMode('CLIENT');
      setLoginId('ananya');
      performLogin('ananya', 'CLIENT');
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => {
    const isActive = currentView === view;
    return (
      <button 
        onClick={() => setCurrentView(view)}
        className={`flex flex-col items-center gap-1.5 flex-1 py-3 transition-all duration-300 group ${isActive ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
      >
        <div className={`p-1 rounded-lg transition-all ${isActive ? 'bg-white/10' : ''}`}>
           <Icon className={`w-5 h-5 ${isActive ? 'fill-white' : ''}`} />
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
      </button>
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
                     <button onClick={() => { setLoginMode('CLIENT'); setLoginId(''); }} className={`flex-1 py-3 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${loginMode === 'CLIENT' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                       <Heart className="w-3 h-3" /> Client
                     </button>
                     <button onClick={() => { setLoginMode('STAFF'); setLoginId(''); }} className={`flex-1 py-3 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${loginMode === 'STAFF' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                       <Briefcase className="w-3 h-3" /> Staff
                     </button>
                     <button onClick={() => { setLoginMode('ADMIN'); setLoginId('admin'); }} className={`flex-1 py-3 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${loginMode === 'ADMIN' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                       <ShieldCheck className="w-3 h-3" /> Owner
                     </button>
                  </div>

                  <form onSubmit={handleLogin} className="px-6 pb-6 space-y-6">
                     <div className="space-y-3 text-center">
                        <p className="text-[9px] font-mono uppercase text-zinc-500 tracking-widest">Identity Verification</p>
                        <input 
                          required 
                          className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-center focus:border-white/20 focus:bg-black/60 outline-none text-sm font-bold font-mono placeholder:text-zinc-800 transition-all backdrop-blur-sm" 
                          placeholder={loginMode === 'CLIENT' ? "PROJECT ID" : loginMode === 'STAFF' ? "STAFF ID" : "ADMIN KEY"} 
                          value={loginId} 
                          onChange={(e) => setLoginId(e.target.value)} 
                        />
                     </div>
                     
                     <button 
                       type="submit" 
                       disabled={isLoading} 
                       className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-xl text-[10px] uppercase tracking-[0.2em]"
                     >
                       {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Command className="w-4 h-4" />}
                       Authenticate
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

  if (authRole === 'Client' && activeClient) {
    return <ClientExperience client={activeClient} loggedInPersonId={loggedInUserId} onLogout={() => { setAuthRole('none'); setShowLogin(false); }} onUpdateClient={async (u) => { await api.saveClient(u); fetchData(); setActiveClient(u); }} />;
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
         {/* Sidebar for Desktop */}
         <div className="hidden lg:block h-full relative z-20">
            <Sidebar 
               currentView={currentView} 
               setView={setCurrentView} 
               isMobileOpen={isMobileOpen} 
               setIsMobileOpen={setIsMobileOpen} 
               lastSynced={new Date().toISOString()} 
               email="admin@artisans.co" 
            />
         </div>

         {/* Mobile Sidebar */}
         <Sidebar 
            currentView={currentView} 
            setView={setCurrentView} 
            isMobileOpen={isMobileOpen} 
            setIsMobileOpen={setIsMobileOpen} 
            lastSynced={new Date().toISOString()} 
            email="admin@artisans.co" 
         />

         <main className="flex-1 overflow-y-auto no-scrollbar pb-safe relative">
            {/* Matte Glass Noise Texture Background */}
            <div className="fixed inset-0 pointer-events-none bg-noise z-0 opacity-50" />
            
            <div className="max-w-7xl mx-auto p-6 md:p-10 animate-ios-slide-up relative z-10">
               {currentView === 'DASHBOARD' && <Dashboard invoices={invoices} clients={clients} bookings={bookings} companies={companies} tasks={tasks} selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand} userRole={authRole} />}
               {currentView === 'PRODUCTION' && <ProductionHub clients={clients} tasks={tasks} bookings={bookings} selectedBrand={selectedBrand} onOpenClient={(c) => { setActiveClient(c); setCurrentView('CLIENT_PORTAL'); }} />}
               {currentView === 'CLIENTS' && <ClientManager clients={clients} companies={companies} addClient={async (c) => { await api.saveClient(c); fetchData(); }} selectedBrand={selectedBrand} onOpenPortal={(c) => { setActiveClient(c); setCurrentView('CLIENT_PORTAL'); }} />}
               {currentView === 'FINANCE' && <FinanceManager invoices={invoices} expenses={[]} clients={clients} companies={companies} addInvoice={async (i) => { await api.saveInvoice(i); fetchData(); }} addExpense={() => {}} deleteExpense={() => {}} updateInvoiceStatus={async (id, s) => { await api.updateInvoiceStatus(id, s); fetchData(); }} selectedBrand={selectedBrand} userRole={authRole} />}
               {currentView === 'AI_TOOLS' && <AIToolsView clients={clients} selectedBrand={selectedBrand} />}
               {currentView === 'SETTINGS' && <SettingsView companies={companies} addCompany={async (co) => { await api.saveCompany(co); fetchData(); }} onOpenTeam={() => setCurrentView('TEAM')} isAdmin={authRole === 'Admin'} />}
               {currentView === 'CLIENT_PORTAL' && activeClient && <ClientPortal client={activeClient} onUpdateClient={async (u) => { await api.saveClient(u); setActiveClient(u); fetchData(); }} onBack={() => setCurrentView('CLIENTS')} />}
               {currentView === 'TEAM' && <TeamManager staff={staff} onSaveStaff={async (s) => { await api.saveStaff(s); fetchData(); }} onDeleteStaff={async (id) => { await api.deleteStaff(id); fetchData(); }} />}
               {currentView === 'LOGS' && <AuditLogsView />}
               {currentView === 'TASKS' && <TaskManager tasks={tasks} onSaveTask={async (t) => { await api.saveTask(t); fetchData(); }} onDeleteTask={async (id) => { await api.deleteTask(id); fetchData(); }} companies={companies} selectedBrand={selectedBrand} />}
            </div>
         </main>
      </div>

      {/* Floating Action Menu (FAB) for Mobile */}
      {isFABOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60] flex flex-col items-center justify-end pb-36 p-6 animate-ios-slide-up lg:hidden" onClick={() => setIsFABOpen(false)}>
           {/* ... existing FAB code ... */}
           {/* (Keeping existing FAB code, essentially unchanged but wrapped in context) */}
           <div className="w-full max-w-sm grid grid-cols-2 gap-4">
              <button onClick={() => {setCurrentView('AI_TOOLS'); setIsFABOpen(false);}} className="glass-panel p-6 squircle-lg flex flex-col items-center gap-3 group border border-white/10 hover:border-white/20 hover:bg-white/10">
                 <div className="p-4 bg-blue-600 rounded-2xl group-active:scale-90 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"><Sparkles className="w-6 h-6 text-white" /></div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">CoPilot AI</span>
              </button>
              <button onClick={() => {setCurrentView('CLIENTS'); setIsFABOpen(false);}} className="glass-panel p-6 squircle-lg flex flex-col items-center gap-3 group border border-white/10 hover:border-white/20 hover:bg-white/10">
                 <div className="p-4 bg-emerald-600 rounded-2xl group-active:scale-90 transition-all shadow-[0_0_20px_rgba(5,150,105,0.3)]"><Users className="w-6 h-6 text-white" /></div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">New Project</span>
              </button>
              <button onClick={() => {setCurrentView('PRODUCTION'); setIsFABOpen(false);}} className="glass-panel p-6 squircle-lg flex flex-col items-center gap-3 group border border-white/10 hover:border-white/20 hover:bg-white/10">
                 <div className="p-4 bg-amber-600 rounded-2xl group-active:scale-90 transition-all shadow-[0_0_20px_rgba(217,119,6,0.3)]"><Package className="w-6 h-6 text-white" /></div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Ops Log</span>
              </button>
              <button onClick={() => {setCurrentView('FINANCE'); setIsFABOpen(false);}} className="glass-panel p-6 squircle-lg flex flex-col items-center gap-3 group border border-white/10 hover:border-white/20 hover:bg-white/10">
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
         <NavItem view="DASHBOARD" icon={LayoutDashboard} label="Home" />
         <NavItem view="PRODUCTION" icon={Package} label="Ops" />
         <div className="flex flex-col items-center -mt-10 flex-1 relative z-50">
            <button 
              onClick={() => setIsFABOpen(!isFABOpen)} 
              className={`w-16 h-16 ${isFABOpen ? 'bg-zinc-800 rotate-45' : 'bg-white shadow-[0_0_30px_rgba(255,255,255,0.2)]'} rounded-[1.5rem] flex items-center justify-center border-[6px] border-black transition-all duration-500 active:scale-90`}
            >
              <Plus className={`w-7 h-7 ${isFABOpen ? 'text-white' : 'text-black'}`} />
            </button>
         </div>
         <NavItem view="FINANCE" icon={Wallet} label="Finance" />
         <NavItem view="SETTINGS" icon={Settings} label="System" />
      </nav>
    </div>
  );
};

export default App;
