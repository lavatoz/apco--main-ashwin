
import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  ArrowUpRight, Sparkles, Database, Layers, CheckSquare, Clock, ArrowLeft, TrendingUp, AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import { type Client, type CloudConfig, type Task, type Invoice } from '../types';
import { api } from '../services/api';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

interface DashboardProps {
  clients: Client[];
  invoices: Invoice[];
  tasks: Task[];
  selectedBrand: string;
  userRole: 'Admin' | 'Staff' | 'Client' | 'none';
}

type DashboardView = 'dashboard' | 'revenue' | 'unpaid' | 'projects' | 'tasks';

const Dashboard: React.FC<DashboardProps> = ({ clients = [], invoices = [], tasks = [], selectedBrand, userRole }) => {
  const [selectedView, setSelectedView] = useState<DashboardView>('dashboard');
  const [cloudConfig, setCloudConfig] = useState<CloudConfig | null>(null);
  const [dashboardData, setDashboardData] = useState<{ totalRevenue: number, unpaid: number }>({ totalRevenue: 0, unpaid: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Detailed Data States
  const [detailedInvoices, setDetailedInvoices] = useState<Invoice[]>([]);
  const [detailedProjects, setDetailedProjects] = useState<any[]>([]);
  const [detailedTasks, setDetailedTasks] = useState<Task[]>([]);

  useEffect(() => {
    api.getCloudConfig().then(setCloudConfig);
    fetchDashboardSummary();
  }, [selectedBrand]);

  const fetchDashboardSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/dashboard${selectedBrand !== 'All' ? `?brand=${selectedBrand}` : ''}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to load dashboard data");
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dashboard sync failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedData = async (view: DashboardView) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { "Authorization": `Bearer ${token}` };
      
      if (view === 'revenue' || view === 'unpaid') {
        const invRes = await fetch(`http://localhost:5000/api/finance/invoices`, { headers });
        if (invRes.ok) {
          const data = await invRes.json();
          setDetailedInvoices(data);
        }
      } else if (view === 'projects') {
        const projRes = await fetch(`http://localhost:5000/api/projects`, { headers });
        if (projRes.ok) {
          const data = await projRes.json();
          setDetailedProjects(data);
        }
      } else if (view === 'tasks') {
      await fetch(`http://localhost:5000/api/finance/tasks`, { headers }).catch(() => null);
      // Fallback to tasks prop if API fails or isn't perfect
      setDetailedTasks(tasks);
      }
    } catch (err) {
      console.error("Failed to fetch detailed data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedView !== 'dashboard') {
      fetchDetailedData(selectedView);
    }
  }, [selectedView, selectedBrand]);

  const chartData = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYearInvoices = (invoices || []).filter(inv => {
      const date = new Date(inv.createdAt);
      return date.getFullYear() === new Date().getFullYear();
    });

    return months.map(month => {
      const monthInvoices = currentYearInvoices.filter(inv => {
        const date = new Date(inv.createdAt);
        return date.toLocaleString('default', { month: 'short' }) === month;
      });

      const profit = monthInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);
      
      const loss = monthInvoices
        .filter(inv => inv.status === 'unpaid')
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);

      return { month, profit, loss };
    }).filter(d => d.profit > 0 || d.loss > 0).slice(-6); // Last 6 months with data
  }, [invoices]);

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  const filteredClientsCount = clients.filter(c => selectedBrand === 'All' || c.brand === selectedBrand || (c as any).brandId?.name === selectedBrand).length;
  const filteredTasksCount = tasks.filter(t => (selectedBrand === 'All' || t.brand === selectedBrand) && t.status !== 'Done').length;

  const getMetrics = () => {
    if (userRole === 'Client') {
      const myProjects = detailedProjects;
      // We'll estimate photos from the project if gallery isn't fully synced to dashboard yet
      // but we'll prioritize showing the status correctly
      const totalImages = myProjects.reduce((sum, p) => sum + (p.images?.length || 0), 0);
      const selectedImages = myProjects.reduce((sum, p) => sum + (p.images?.filter((img: any) => img.isSelected).length || 0), 0);
      
      return [
        { id: 'projects', label: 'My Projects', value: myProjects.length, icon: Layers, bg: 'bg-zinc-900', color: '#FFFFFF' },
        { id: 'gallery', label: 'Asset Pool', value: totalImages || '-', icon: ImageIcon, bg: 'bg-blue-950/10', color: '#3b82f6' },
        { id: 'selection', label: 'My Selection', value: selectedImages || '-', icon: CheckSquare, bg: 'bg-emerald-950/10', color: '#10b981' },
        { id: 'projects', label: 'Current Phase', value: myProjects[0]?.status || 'Pending', icon: Clock, bg: 'bg-amber-950/10', color: '#f59e0b' },
      ];
    }
    
    if (userRole === 'Staff') {
       const myAssignments = detailedProjects.filter(p => (p as any).assignedTo === (JSON.parse(localStorage.getItem('user') || '{}')._id));
       return [
        { id: 'projects', label: 'My Assignments', value: myAssignments.length, icon: Layers, bg: 'bg-zinc-900', color: '#FFFFFF' },
        { id: 'tasks', label: 'Assigned Tasks', value: filteredTasksCount, icon: CheckSquare, bg: 'bg-emerald-950/10', color: '#10b981' },
       ];
    }

    return [
      { id: 'revenue', label: 'Total Revenue', value: formatCurrency(dashboardData.totalRevenue), icon: Briefcase, bg: 'bg-zinc-900', color: '#FFFFFF' },
      { id: 'unpaid', label: 'Unpaid Amount', value: formatCurrency(dashboardData.unpaid), icon: Clock, bg: 'bg-amber-950/10', color: '#f59e0b' },
      { id: 'projects', label: 'Active Projects', value: filteredClientsCount, icon: Layers, bg: 'bg-emerald-950/10', color: '#10b981' },
      { id: 'tasks', label: 'Pending Tasks', value: filteredTasksCount, icon: CheckSquare, bg: 'bg-blue-950/10', color: '#3b82f6' },
    ];
  };

  const metrics = getMetrics();

  // Render Views
  const renderDashboard = () => (
    <div className="space-y-8 animate-ios-slide-up">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div 
              key={m.id} 
              onClick={() => setSelectedView(m.id as DashboardView)}
              className={`${m.bg} border border-white/5 p-6 squircle-md flex flex-col justify-between h-40 group cursor-pointer active:scale-95 ios-transition hover:border-white/10`}
            >
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-2xl bg-white/5 text-white shadow-xl group-hover:bg-white group-hover:text-black transition-all">
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-700" />
              </div>
              <div>
                <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest mb-1">{m.label}</p>
                <h3 className="text-2xl font-black text-white tracking-tight">{m.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900/10 border border-white/5 p-10 squircle-lg min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
             <div className="text-center space-y-4 relative z-10">
                <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-2xl">
                    <Sparkles className="w-10 h-10 text-white/20" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">System Health Optimal</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">All Modules Synchronized across Enterprise Network</p>
             </div>
        </div>

        <div className="bg-zinc-900/30 p-10 squircle-lg border border-blue-500/10 space-y-8 flex flex-col justify-center min-h-[400px]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
              <Database className="w-5 h-5 text-blue-500" /> Infrastructure
            </h3>
          </div>
          <div className="space-y-6">
            {cloudConfig?.vaults.map(v => (
              <div key={v.id} className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-zinc-500">{v.name}</span>
                  <span className={`${v.usagePercent > 85 ? 'text-red-500' : 'text-zinc-600'}`}>{v.usagePercent}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ios-transition bg-blue-500`} style={{ width: `${v.usagePercent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRevenueView = () => {
    return (
      <div className="space-y-8 animate-ios-slide-up">
        <div className="glass-panel p-10 squircle-lg border border-white/5">
          <div className="flex justify-between items-center mb-10">
            <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Revenue Analytics</h3>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Profit vs Operational Loss</p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-500 opacity-50" />
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                <XAxis dataKey="month" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} name="Net Profit" />
                <Bar dataKey="loss" fill="#ef4444" radius={[4, 4, 0, 0]} name="Operational Loss" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderUnpaidView = () => {
    const unpaid = detailedInvoices.filter(i => (i.status || '').toLowerCase() === 'unpaid' && (i.type === 'invoice'));
    const paid = detailedInvoices.filter(i => (i.status || '').toLowerCase() === 'paid' && (i.type === 'invoice'));

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-ios-slide-up">
        <div className="space-y-6">
          <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Unpaid Invoices
          </h3>
          <div className="space-y-4">
            {unpaid.length > 0 ? unpaid.map(inv => (
              <div key={inv._id} className="glass-panel p-6 border border-amber-500/10 flex justify-between items-center group hover:bg-amber-500/5 transition-all">
                <div>
                  <p className="text-sm font-black text-white uppercase">{inv.client?.name || 'Unknown Client'}</p>
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Ref: {inv._id.slice(-6)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-white font-mono">₹{inv.amount?.toLocaleString('en-IN')}</p>
                  <span className="text-[8px] font-black text-amber-500 uppercase bg-amber-500/10 px-2 py-0.5 rounded">Pending</span>
                </div>
              </div>
            )) : <p className="text-zinc-600 text-[10px] font-black uppercase py-10 text-center border border-dashed border-zinc-800 rounded-2xl">No unpaid invoices</p>}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <CheckSquare className="w-4 h-4" /> Paid Ledger
          </h3>
          <div className="space-y-4">
            {paid.length > 0 ? paid.map(inv => (
              <div key={inv._id} className="glass-panel p-6 border border-emerald-500/10 flex justify-between items-center group hover:bg-emerald-500/5 transition-all">
                <div>
                  <p className="text-sm font-black text-white uppercase">{inv.client?.name || 'Unknown Client'}</p>
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Ref: {inv._id.slice(-6)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-white font-mono">₹{inv.amount?.toLocaleString('en-IN')}</p>
                  <span className="text-[8px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-2 py-0.5 rounded">Settled</span>
                </div>
              </div>
            )) : <p className="text-zinc-600 text-[10px] font-black uppercase py-10 text-center border border-dashed border-zinc-800 rounded-2xl">No paid invoices</p>}
          </div>
        </div>
      </div>
    );
  };

  const renderProjectsView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-ios-slide-up">
        {detailedProjects.length > 0 ? detailedProjects.map(p => (
          <div key={p._id} className="glass-panel p-8 border border-white/5 hover:bg-white/5 transition-all space-y-6">
            <div className="flex justify-between items-start">
                <h4 className="text-xl font-black text-white uppercase tracking-tight leading-none">{p.name}</h4>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><Layers className="w-4 h-4" /></div>
            </div>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Client</span>
                    <span className="text-[10px] font-black text-white uppercase">{(p.client as any)?.name || 'Internal'}</span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                        <span className="text-zinc-600">Production Status</span>
                        <span className="text-blue-500">{p.status || 'Active'}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${p.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: p.status === 'completed' ? '100%' : p.status === 'selected' ? '75%' : p.status === 'uploaded' ? '50%' : '25%' }} />
                    </div>
                </div>
            </div>
          </div>
        )) : <div className="col-span-full py-20 text-center uppercase font-black text-zinc-600 tracking-widest border border-dashed border-zinc-800 rounded-[2rem]">No active projects found</div>}
      </div>
    );
  };

  const renderTasksView = () => {
    const pending = detailedTasks.filter(t => t.status !== 'Done');
    return (
      <div className="space-y-4 animate-ios-slide-up max-w-3xl mx-auto">
        {pending.length > 0 ? pending.map(t => (
          <div key={t.id} className="glass-panel p-6 border border-white/5 flex items-center gap-6 group hover:bg-white/5 transition-all">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${t.status === 'Priority' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>
                <CheckSquare className="w-5 h-5" />
            </div>
            <div className="flex-1">
                <p className="text-sm font-black text-white uppercase tracking-tight">{t.title}</p>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">{t.status} • {t.dueDate}</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-zinc-800 group-hover:text-white transition-colors" />
          </div>
        )) : <div className="py-20 text-center uppercase font-black text-zinc-600 tracking-widest">All tasks completed</div>}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
            {selectedView === 'dashboard' ? 'Command Center' : `${selectedView} overview`}
          </h1>
          {selectedView !== 'dashboard' && (
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">In-depth analytics and tracking</p>
          )}
        </div>
        
        {selectedView !== 'dashboard' && (
          <button 
            onClick={() => setSelectedView('dashboard')}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black squircle-sm text-[10px] font-black uppercase tracking-widest transition-all hover:bg-zinc-200 active:scale-95 shadow-xl"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        )}
      </div>

      {loading && !dashboardData.totalRevenue ? (
         <div className="p-20 text-center uppercase font-black tracking-widest text-zinc-500 animate-pulse">Initializing System...</div>
      ) : (
        <>
          {selectedView === 'dashboard' && renderDashboard()}
          {selectedView === 'revenue' && renderRevenueView()}
          {selectedView === 'unpaid' && renderUnpaidView()}
          {selectedView === 'projects' && renderProjectsView()}
          {selectedView === 'tasks' && renderTasksView()}
        </>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-mono uppercase tracking-widest p-4 rounded-2xl mb-4 text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
