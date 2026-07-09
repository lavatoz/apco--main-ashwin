import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';

interface BreadcrumbProps {
  customLabels?: Record<string, string>;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ customLabels = {} }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const formatName = (name: string) => {
    if (customLabels[name]) {
      return customLabels[name];
    }
    // Specific overrides for routes
    if (name === 'revenue' || name === 'ledger' || name === 'finance') return 'Revenue Analytics';
    if (name === 'directory') return 'Directory';
    if (name === 'copilot') return 'Copilot AI';
    if (name === 'tasks') return 'Production';
    if (name === 'calendar') return 'Schedule';
    if (name === 'system') return 'Ecosystem';
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Don't show breadcrumb on dashboard or root
  if (pathnames.length === 0 || pathnames[0] === 'dashboard') {
    return null;
  }

  return (
    <div className="flex items-center gap-4 mb-8 bg-black/40 border border-white/5 p-3 rounded-2xl w-max">
      <Link 
        to="/dashboard" 
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all text-[10px] font-black uppercase tracking-widest border border-white/5"
      >
        <ArrowLeft className="w-3 h-3" /> Back to Dashboard
      </Link>
      
      <div className="w-px h-4 bg-white/10" />
      
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
        <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          
          return (
            <React.Fragment key={to}>
              <ChevronRight className="w-3 h-3 text-zinc-700" />
              {isLast ? (
                <span className="text-white">{formatName(value)}</span>
              ) : (
                <Link to={to} className="hover:text-white transition-colors">{formatName(value)}</Link>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default Breadcrumb;
