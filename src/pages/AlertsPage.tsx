
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, AlertCircle, 
  ArrowLeft, CheckCircle2, Package, ChevronRight 
} from 'lucide-react';
import { api } from '../services/api';
import { type Client } from '../types';

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'finance' | 'client' | 'ops' | 'system';
  timestamp: string;
  actionPath?: string;
}

const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [c, s] = await Promise.all([
          api.getClients(),
          api.getFinanceSummary('All', 'global')
        ]);
        setClients(c);
        setSummary(s);
      } catch (err) {
        console.error("Alerts Sync Failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const alerts = useMemo(() => {
    const list: Alert[] = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    // 1. Critical: Overdue Invoices
    summary?.invoices?.forEach((inv: any) => {
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
      if (inv.status !== 'Paid' && dueDate && dueDate < today) {
        const client = clients.find(c => String(c.id) === String(inv.clientId))?.name || inv.clientName || 'Unknown Client';
        list.push({
          id: `alert-inv-${inv.id}`,
          title: 'Invoice Overdue',
          description: `Invoice ${inv.id} for ${client} is past due date.`,
          severity: 'critical',
          category: 'finance',
          timestamp: inv.dueDate,
          actionPath: '/ledger'
        });
      }
    });

    // 2. Warning: Missing Client Info
    clients.forEach(c => {
      const contact = c.people?.[0];
      if (!contact?.email || !contact?.phone) {
        list.push({
          id: `alert-client-info-${c.id}`,
          title: 'Incomplete Client Profile',
          description: `Client "${c.name || c.projectName}" is missing contact details.`,
          severity: 'warning',
          category: 'client',
          timestamp: new Date().toISOString(),
          actionPath: `/client/${c.id}`
        });
      }
    });

    // 3. Info: No Team Assigned (Ops)
    // In this simplified logic, we detect projects with 0 tasks


    // 4. Critical: High Burn Rate (example)
    if (summary && summary.totalExpenses > (summary.totalRevenue * 0.8)) {
       list.push({
          id: 'alert-system-burn',
          title: 'High Burn Rate detected',
          description: 'Monthly expenses have exceeded 80% of total revenue.',
          severity: 'critical',
          category: 'system',
          timestamp: new Date().toISOString()
       });
    }

    return list.sort((a,b) => {
      const priority = { critical: 0, warning: 1, info: 2 };
      return priority[a.severity] - priority[b.severity];
    });
  }, [summary, clients]);

  const filteredAlerts = alerts.filter(a => activeTab === 'all' || a.severity === activeTab);

  if (loading) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-ios-slide-up">
           <div className="w-10 h-10 border-4 border-zinc-900 border-t-white rounded-full animate-spin mb-6" />
           <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em]">Auditing System Integrity...</p>
        </div>
     );
  }

  return (
    <div className="space-y-12 animate-ios-slide-up pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-4 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Dashboard</span>
          </button>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none flex items-center gap-6">
            System Alerts <div className="bg-red-500 text-black px-4 py-1 rounded-full text-xl">{alerts.length}</div>
          </h1>
          <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] mt-4">Security & Operational Intelligence Feed</p>
        </div>

        <div className="bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 flex gap-1">
          {['all', 'critical', 'warning', 'info'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-white text-black shadow-xl shadow-white/10' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
             >
               {tab}
             </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-zinc-900/20 border border-dashed border-white/5 rounded-[3rem] p-32 text-center">
            <CheckCircle2 className="w-16 h-16 text-zinc-800 mx-auto mb-8" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Systems Nominal</h2>
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-2">No alerts detected in current sector</p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div 
              key={alert.id}
              onClick={() => alert.actionPath && navigate(alert.actionPath)}
              className={`group relative overflow-hidden bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 flex flex-col md:flex-row items-start md:items-center gap-8 transition-all hover:bg-white/[0.05] ${alert.actionPath ? 'cursor-pointer' : ''}`}
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
              
              <div className={`w-16 h-16 rounded-3xl shrink-0 flex items-center justify-center transition-all ${alert.severity === 'critical' ? 'bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-black' : alert.severity === 'warning' ? 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-black' : 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-black'}`}>
                {alert.severity === 'critical' ? <AlertCircle className="w-7 h-7" /> : alert.severity === 'warning' ? <AlertTriangle className="w-7 h-7" /> : <Package className="w-7 h-7" />}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md ${alert.severity === 'critical' ? 'bg-red-500/10 text-red-500' : alert.severity === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {alert.severity}
                  </span>
                  <span className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">
                    {alert.category} • {new Date(alert.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">{alert.title}</h3>
                <p className="text-zinc-500 font-bold text-sm mt-1">{alert.description}</p>
              </div>

              {alert.actionPath && (
                <div className="flex items-center gap-3 text-zinc-500 group-hover:text-white transition-colors">
                   <span className="text-[10px] font-black uppercase tracking-widest">Resolve</span>
                   <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
