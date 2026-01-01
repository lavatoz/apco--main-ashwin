
import React from 'react';
import { LayoutDashboard, Users, Calendar, Wallet, Sparkles, LogOut, Menu, CloudCheck } from 'lucide-react';
import type { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  lastSynced: string;
  email: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isMobileOpen, setIsMobileOpen, lastSynced, email }) => {
  const menuItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'CLIENTS', label: 'Clients', icon: Users },
    { id: 'CALENDAR', label: 'Bookings', icon: Calendar },
    { id: 'FINANCE', label: 'Finance', icon: Wallet },
    { id: 'AI_TOOLS', label: 'AI Assistant', icon: Sparkles },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-20 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-black border-r border-zinc-800 text-white z-30 transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:h-screen
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded bg-white text-black flex items-center justify-center font-bold text-xl font-serif">A</div>
            <span className="text-xl font-bold tracking-tight text-white font-serif">AP Co.</span>
          </div>
          <p className="text-xs text-zinc-500 pl-11">Aaha Kalayanam & Tiny Toes</p>
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden absolute top-6 right-4 text-zinc-400">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <nav className="px-3 space-y-1 mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id as ViewState);
                  setIsMobileOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-zinc-800 text-white border-l-4 border-white' 
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-zinc-800 bg-zinc-900/50">
          <div className="mb-3 px-2">
            <p className="text-[10px] uppercase text-zinc-500 font-bold mb-1">Registered to</p>
            <p className="text-xs text-zinc-300 truncate">{email}</p>
          </div>
          <div className="flex items-center gap-2 mb-4 px-2 text-[10px] text-green-500">
             <CloudCheck className="w-3 h-3" />
             <span>Synced: {new Date(lastSynced).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          <button 
             onClick={() => window.location.reload()}
             className="flex items-center gap-3 px-2 py-2 w-full text-zinc-400 hover:text-white transition-colors text-sm font-medium hover:bg-zinc-800 rounded"
          >
            <LogOut className="w-4 h-4" />
            Lock & Exit
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
