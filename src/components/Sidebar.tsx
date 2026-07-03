import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  LayoutDashboard, Users, Calendar, Wallet, Sparkles,
  LogOut, Settings, X, RefreshCw,
  CloudRain, Cpu,
  Activity, Shield,
  FolderDown, Receipt, FileSignature, MessageSquare, HelpCircle,
  Image
} from 'lucide-react';

import { api } from '../services/api';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { getAuthUser } from '../utils/storage';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen, onLogout }) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const user = getAuthUser();
  const { settings } = useCompanySettings();

  const ADMIN_MENU = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
    { path: '/directory', label: 'Directory', icon: Users, permission: 'clients' },
    { path: '/calendar', label: 'Coordination', icon: Calendar, permission: 'tasks' },
    { path: '/workflow', label: 'Workflow', icon: Activity, permission: 'workflow' },
    { path: '/selections', label: 'Client Selections', icon: Image, permission: 'workflow' },
    { path: '/ledger', label: 'Ledger', icon: Wallet, permission: 'finance' },
    { path: '/copilot', label: 'Copilot', icon: Sparkles, permission: 'ai' },
    { path: '/analytics', label: 'Analytics', icon: BarChart3, permission: 'analytics' },
    { path: '/security', label: 'Security Hub', icon: Shield, permission: 'system' },
    { path: '/ecosystem', label: 'Ecosystem', icon: Settings, permission: 'system' },
    { path: '/settings', label: 'Settings', icon: Settings, permission: 'dashboard' },
  ];

  const CLIENT_MENU = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
    { path: '/gallery', label: 'Gallery', icon: Image, permission: 'dashboard' },
    { path: '/deliverables', label: 'Deliverables', icon: FolderDown, permission: 'dashboard' },
    { path: '/events', label: 'My Event', icon: Calendar, permission: 'dashboard' },
    { path: '/timeline', label: 'Timeline', icon: Activity, permission: 'dashboard' },
    { path: '/invoices', label: 'Invoices', icon: Receipt, permission: 'dashboard' },
    { path: '/agreements', label: 'Agreements', icon: FileSignature, permission: 'dashboard' },
    { path: '/messages', label: 'Messages', icon: MessageSquare, permission: 'dashboard' },
    { path: '/support', label: 'Support', icon: HelpCircle, permission: 'dashboard' },
  ];

  const STAFF_MENU = [
    { path: '/workspace', label: 'My Workspace', icon: LayoutDashboard, permission: 'dashboard' },
    { path: '/selections', label: 'Client Selections', icon: Image, permission: 'dashboard' },
  ];

  let menuItems = ADMIN_MENU;

  if (user?.role === 'Client') {
    menuItems = CLIENT_MENU;
  } else if (user?.role === 'Staff') {
    menuItems = STAFF_MENU;
  } else if (user?.role === 'Admin') {
    menuItems = ADMIN_MENU;
  } else {
    menuItems = [];
  }

  const handleManualSync = async () => {
    setIsSyncing(true);
    await api.syncToRemote();
    setIsSyncing(false);
  };

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div className={`
        fixed top-0 left-0 h-screen glass-panel-dark flex flex-col transition-all duration-500 z-50
        ${isMobileOpen ? 'w-72 translate-x-0' : 'w-72 max-lg:-translate-x-full lg:translate-x-0 lg:w-72'}
      `}>
        {/* Sidebar Close for Mobile */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 bg-white/5 rounded-full text-zinc-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 mb-8 flex items-center gap-4 group">
          <div className="w-12 h-12 shrink-0 bg-white text-black rounded-[1rem] flex items-center justify-center font-bold text-2xl font-serif shadow-[0_0_25px_rgba(255,255,255,0.15)] group-hover:scale-105 transition-transform duration-500 overflow-hidden">
            {settings.logo ? (
              <img src={settings.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              settings.companyName ? settings.companyName.charAt(0).toUpperCase() : 'A'
            )}
          </div>
          <div className={`${isMobileOpen ? 'block opacity-100' : 'lg:block hidden lg:opacity-100'} transition-opacity`}>
            <span className="text-xl font-black tracking-tight text-white block truncate max-w-[160px]">{settings.companyName || 'Artisans'}</span>
            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em]">{settings.tagline || 'Enterprise OS'}</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-3 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) => `
                  w-full flex items-center gap-5 px-4 py-3.5 rounded-[1.2rem] text-base font-bold transition-all group relative overflow-hidden
                  ${isActive
                    ? 'bg-white/10 text-white shadow-inner border border-white/5'
                    : 'text-zinc-500 hover:text-white hover:bg-white/5'}
                `}
              >
                {({ isActive }) => (
                  <>
                    {/* Active Indicator Glow */}
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary blur-md" />}
   
                    <Icon className={`w-6 h-6 shrink-0 transition-transform duration-300 ${isActive ? 'text-white scale-110' : 'group-hover:text-white group-hover:scale-110'}`} />
                    <span className={`${isMobileOpen ? 'block' : 'lg:block hidden'} truncate transition-all tracking-tight`}>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>


        <div className="p-6 mt-auto space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/10"><Cpu className="w-4 h-4" /></div>
              <div>
                <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Core Status</p>
                <p className="text-[10px] font-bold text-white shadow-emerald-500/50">Encrypted & Online</p>
              </div>
            </div>
            <button
              onClick={handleManualSync}
              className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 transition-all flex items-center justify-center gap-2 border border-white/5"
            >
              {isSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CloudRain className="w-3 h-3" />}
              Commit Changes
            </button>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center justify-start gap-4 px-4 py-3.5 w-full text-zinc-500 hover:text-red-400 transition-all font-bold rounded-2xl hover:bg-red-500/5 group border border-transparent hover:border-red-500/10"
          >
            <LogOut className="w-6 h-6 shrink-0" />
            <span className={`${isMobileOpen ? 'block' : 'lg:block hidden'} text-base tracking-tight`}>Lock Station</span>
          </button>
      </div>
    </>
  );
};

export default Sidebar;

