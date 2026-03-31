import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Wallet, Sparkles,
  LogOut, Settings, X, RefreshCw,
  CloudRain, Cpu,
  CheckSquare
} from 'lucide-react';
import { api } from '../services/api';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const menuItems = [
    { path: '/', label: 'Home', icon: LayoutDashboard },
    { path: '/directory', label: 'Directory', icon: Users },
    { path: '/calendar', label: 'Schedule', icon: Calendar },
    { path: '/tasks', label: 'Production', icon: CheckSquare },
    { path: '/finance', label: 'Ledger', icon: Wallet },
    { path: '/copilot', label: 'Copilot', icon: Sparkles },
    { path: '/system', label: 'Ecosystem', icon: Settings },
  ];

  const handleManualSync = async () => {
    setIsSyncing(true);
    await api.syncToRemote();
    setIsSyncing(false);
  };

  return (
    <div className={`
      h-full w-20 lg:w-72 glass-panel-dark flex flex-col transition-all duration-500 z-50
      ${isMobileOpen ? 'fixed inset-y-0 left-0 translate-x-0 w-72' : 'fixed lg:static -translate-x-full lg:translate-x-0'}
    `}>
      {/* Sidebar Close for Mobile */}
      <button
        onClick={() => setIsMobileOpen(false)}
        className="lg:hidden absolute top-4 right-4 p-2 bg-white/5 rounded-full text-zinc-400 hover:text-white"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="p-6 mb-8 flex items-center gap-4 group">
        <div className="w-12 h-12 shrink-0 bg-white text-black rounded-[1rem] flex items-center justify-center font-bold text-2xl font-serif shadow-[0_0_25px_rgba(255,255,255,0.15)] group-hover:scale-105 transition-transform duration-500">A</div>
        <div className="lg:block hidden opacity-0 lg:opacity-100 transition-opacity">
          <span className="text-xl font-black tracking-tight text-white block">Artisans</span>
          <span className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em]">Enterprise OS</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) => `
                w-full flex items-center gap-5 px-4 py-4 rounded-[1.2rem] text-sm font-semibold transition-all group relative overflow-hidden
                ${isActive
                  ? 'bg-white/10 text-white shadow-inner border border-white/5'
                  : 'text-zinc-500 hover:text-white hover:bg-white/5'}
              `}
            >
              {({ isActive }) => (
                <>
                  {/* Active Indicator Glow */}
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/50 blur-md" />}

                  <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isActive ? 'text-white scale-110' : 'group-hover:text-white group-hover:scale-110'}`} />
                  <span className="lg:block hidden truncate transition-all tracking-tight font-bold">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-6 mt-auto space-y-4">
        <div className="p-5 bg-black/20 border border-white/5 rounded-[1.5rem] mb-4 lg:block hidden backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/10"><Cpu className="w-4 h-4" /></div>
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
          onClick={() => window.location.reload()}
          className="flex items-center justify-center lg:justify-start gap-4 px-4 py-4 w-full text-zinc-500 hover:text-red-400 transition-all font-semibold rounded-2xl hover:bg-red-500/5 group border border-transparent hover:border-red-500/10"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="lg:block hidden text-sm tracking-tight font-bold">Lock Station</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
