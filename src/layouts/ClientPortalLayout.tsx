import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, CalendarClock, Image,
  FolderDown, Receipt, FileSignature, MessageSquare,
  HelpCircle, LogOut, X, Menu, Building2
} from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useCompanySettings } from '../hooks/useCompanySettings';

interface ClientPortalLayoutProps {
  onLogout: () => void;
}

const ClientPortalLayout: React.FC<ClientPortalLayoutProps> = ({ onLogout }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = usePermissions();
  const { settings } = useCompanySettings();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  if (!user || user.role !== 'Client') {
    return null;
  }

  const allModules = [
    { path: '/client-portal/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard', isDefault: true },
    { path: '/client-portal/events', label: 'My Events', icon: Calendar, permission: 'events' },
    { path: '/client-portal/timeline', label: 'Timeline', icon: CalendarClock, permission: 'timeline' },
    { path: '/client-portal/gallery', label: 'Gallery', icon: Image, permission: 'gallery' },
    { path: '/client-portal/deliverables', label: 'Deliverables', icon: FolderDown, permission: 'deliverables' },
    { path: '/client-portal/invoices', label: 'Invoices', icon: Receipt, permission: 'invoices' },
    { path: '/client-portal/agreements', label: 'Agreements', icon: FileSignature, permission: 'agreements' },
    { path: '/client-portal/messages', label: 'Messages', icon: MessageSquare, permission: 'messages' },
    { path: '/client-portal/support', label: 'Support', icon: HelpCircle, permission: 'support' },
  ];

  const visibleModules = allModules.filter(
    (mod) => mod.isDefault || (user.permissions && user.permissions.includes(mod.permission as any))
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection-primary">
      {/* Mobile Header */}
      <header className="lg:hidden px-6 py-4 flex items-center justify-between glass-panel-dark z-50 pt-safe font-sans sticky top-0 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMobileOpen(true)} className="p-2 -ml-2 text-white">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black uppercase text-white tracking-widest">{settings.companyName || 'Artisans'}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative font-sans">
        {/* Client Sidebar */}
        <div className={`
          fixed top-0 left-0 h-screen w-72 glass-panel-dark flex flex-col transition-all duration-500 z-[100]
          ${isMobileOpen ? 'translate-x-0' : 'max-lg:-translate-x-full lg:translate-x-0'}
        `}>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 bg-white/5 rounded-full text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 mb-8 flex items-center gap-4 group">
            <div className="w-12 h-12 shrink-0 bg-white text-black rounded-[1rem] flex items-center justify-center font-bold text-2xl font-serif shadow-[0_0_25px_rgba(255,255,255,0.15)] overflow-hidden">
              {settings.logo ? (
                <img src={settings.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white block truncate max-w-[160px]">{settings.companyName || 'Client Portal'}</span>
              <span className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em]">{user.name || user.email}</span>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
            {visibleModules.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }: { isActive: boolean }) => `
                    w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group relative overflow-hidden
                    ${isActive
                      ? 'bg-white text-black shadow-xl'
                      : 'text-zinc-500 hover:text-white hover:bg-white/5'}
                  `}
                >
                  {({ isActive }: { isActive: boolean }) => (
                    <>
                      <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isActive ? 'text-black scale-110' : 'group-hover:text-white group-hover:scale-110'}`} />
                      <span className="truncate transition-all tracking-wide">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-6 mt-auto">
            <button
              onClick={onLogout}
              className="flex items-center justify-center lg:justify-start gap-4 px-4 py-4 w-full text-zinc-500 hover:text-red-400 transition-all font-bold rounded-2xl hover:bg-red-500/5 group border border-transparent hover:border-red-500/10"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span className="text-sm tracking-wide">Secure Logout</span>
            </button>
          </div>
        </div>

        {/* Client Main Content Area */}
        <main className="flex-1 lg:pl-72 overflow-y-auto pb-safe relative min-h-screen">
          <div className="fixed inset-0 pointer-events-none bg-noise z-0 opacity-50" />
          <div className="relative z-10 w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClientPortalLayout;
