
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck, IndianRupee, Briefcase,
  ArrowUpRight, Sparkles, MessageSquare, Layers, CheckSquare,
  AlertTriangle, AlertCircle, Calendar, TrendingUp, TrendingDown
} from 'lucide-react';
import { type Booking, type Client, type Invoice, type Task, type Division } from '../types';



interface DashboardProps {
  divisions: Division[];
  invoices: Invoice[];
  clients: Client[];
  bookings: Booking[];
  tasks: Task[];
  selectedBrand: string | 'All';
  setSelectedBrand: (brand: string | 'All') => void;
  userRole: 'Admin' | 'Staff' | 'Client' | 'none';
}

const Dashboard: React.FC<DashboardProps> = ({ divisions, invoices, clients, tasks, selectedBrand, setSelectedBrand, userRole }) => {
  const navigate = useNavigate();


  const [localEntries] = useState<any[]>(() => { try { const e = localStorage.getItem('entries'); return e ? JSON.parse(e) : []; } catch { return []; } });
  const [localExpenses] = useState<any[]>(() => { try { const e = localStorage.getItem('expenses'); return e ? JSON.parse(e) : []; } catch { return []; } });


  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  const safeClients = Array.isArray(clients) ? clients : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const filteredInvoices = selectedBrand === 'All' ? safeInvoices.filter(i => i && !i.isQuotation) : safeInvoices.filter(i => i && i.brand === selectedBrand && !i.isQuotation);
  const filteredLocalEntries = selectedBrand === 'All' ? localEntries : localEntries.filter(e => e && e.brand === selectedBrand);
  const filteredLocalExpenses = selectedBrand === 'All' ? localExpenses : localExpenses.filter(e => e && e.brand === selectedBrand);
  const filteredClients = selectedBrand === 'All' ? safeClients : safeClients.filter(c => c && c.brand === selectedBrand);
  const filteredTasks = selectedBrand === 'All' ? safeTasks : safeTasks.filter(t => t && t.brand === selectedBrand);

  // Financials
  const apiRevenue = filteredInvoices.reduce((sum, inv) => sum + (Array.isArray(inv.items) ? inv.items.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 0)), 0) : 0), 0);
  const localRevenue = filteredLocalEntries.filter(e => e && e.type === 'invoice').reduce((s, e) => s + (e.total || 0), 0);
  const totalRevenue = apiRevenue + localRevenue;
  const totalExpenses = filteredLocalExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const cashFlow = totalRevenue - totalExpenses;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Alerts System
  const generateAlerts = React.useCallback(() => {
    const activeAlerts: { text: string; type: 'warning' | 'critical' | 'event'; priority: number; icon: any; action?: () => void }[] = [];

    const unpaidApi = filteredInvoices.filter(i => !i.status || i.status.toLowerCase() !== 'paid');
    const unpaidLocal = filteredLocalEntries.filter(e => e && e.type === 'invoice' && (!e.status || e.status.toLowerCase() !== 'paid'));
    
    const unpaidInvoices = [...unpaidApi, ...unpaidLocal];
    const unpaidCount = unpaidInvoices.length;
    const unpaidAmount = unpaidInvoices.reduce((sum, inv) => {
      const total = inv.total || (Array.isArray(inv.items) ? inv.items.reduce((s: number, item: any) => s + ((item.price || 0) * (item.quantity || 0)), 0) : 0);
      return sum + total;
    }, 0);
    
    if (unpaidCount > 0) {
      activeAlerts.push({ 
        text: `${unpaidCount} unpaid invoice${unpaidCount > 1 ? 's' : ''} (₹${unpaidAmount.toLocaleString('en-IN')} pending)`, 
        type: 'warning',
        priority: 3,
        icon: AlertTriangle,
        action: () => navigate('/revenue', { state: { tab: 'unpaid' } })
      });
    }
    


    unpaidInvoices.forEach(inv => {
      const invDateStr = inv.dueDate || (inv as any).date || inv.issueDate || inv.createdAt;
      if (invDateStr) {
        const invDate = new Date(invDateStr);
        if (invDate < today) {
          let name = 'Client';
          if (inv.clientId) {
             const c = safeClients.find(client => String(client.id) === String(inv.clientId));
             if (c) name = c.projectName || c.name || 'Client';
          } else if (inv.clientName) {
             name = inv.clientName;
          }
          activeAlerts.push({ 
            text: `${name} invoice overdue`, 
            type: 'critical',
            priority: 1,
            icon: AlertCircle,
            action: () => navigate('/revenue', { state: { scrollId: inv.id } })
          });
        }
      }
    });

    // Event Alerts
    filteredClients.forEach(c => {
      const eventDateStr = c.eventDate || c.weddingDate;
      if (eventDateStr) {
        const eventDate = new Date(eventDateStr);
        const diffTime = eventDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 3) {
          activeAlerts.push({ 
            text: `${c.projectName || c.name || 'Client'} event in ${diffDays === 0 ? 'today' : diffDays + (diffDays === 1 ? ' day' : ' days')}`, 
            type: 'event',
            priority: 2,
            icon: Calendar
          });
        }
      }
    });

    if (totalRevenue > 0 && totalExpenses > (totalRevenue * 0.7)) {
      activeAlerts.push({ 
        text: "High burn rate: Expenses exceed 70% of revenue", 
        type: 'critical',
        priority: 1,
        icon: AlertCircle 
      });
    }

    filteredClients.forEach(c => {
      const mainContact = c.people?.[0];
      if (c && (!mainContact?.email || !mainContact?.phone)) {
        activeAlerts.push({ 
          text: `${c.projectName || c.name || 'Client'} missing contact info`, 
          type: 'warning',
          priority: 3,
          icon: AlertTriangle 
        });
      }
    });

    return activeAlerts.sort((a, b) => a.priority - b.priority);
  }, [filteredInvoices, filteredLocalEntries, filteredClients, totalRevenue, totalExpenses, navigate, today]);

  // Client Profit Data
  const clientProfitData = React.useMemo(() => {
    const map: Record<string, { revenue: number; expenses: number }> = {};
    
    // API Invoices
    safeInvoices.filter(i => i && !i.isQuotation).forEach(inv => {
      let cName = 'Unknown Client';
      if (inv.client) cName = inv.client.name || inv.client.projectName || cName;
      else if (inv.clientId) {
        const c = safeClients.find(cl => String(cl.id) === String(inv.clientId));
        if (c) cName = c.projectName || c.name || cName;
      } else if ((inv as any).clientName) {
        cName = (inv as any).clientName;
      }
      
      const amt = Array.isArray(inv.items) ? inv.items.reduce((s: number, it: any) => s + ((it.price || 0) * (it.quantity || 0)), 0) : 0;
      if (!map[cName]) map[cName] = { revenue: 0, expenses: 0 };
      map[cName].revenue += amt;
    });

    // Local Invoices
    filteredLocalEntries.filter(e => e && e.type === 'invoice').forEach(inv => {
      const cName = inv.clientName || 'Unknown Client';
      if (!map[cName]) map[cName] = { revenue: 0, expenses: 0 };
      map[cName].revenue += (inv.total || 0);
    });

    // Local Expenses
    filteredLocalExpenses.forEach(exp => {
      const cName = exp.client || 'General';
      if (!map[cName]) map[cName] = { revenue: 0, expenses: 0 };
      map[cName].expenses += (Number(exp.amount) || 0);
    });

    const result = Object.entries(map).map(([name, data]) => ({
      name,
      revenue: data.revenue,
      expenses: data.expenses,
      profit: data.revenue - data.expenses
    }));

    return result.sort((a,b) => b.profit - a.profit);
  }, [safeInvoices, filteredLocalEntries, filteredLocalExpenses, safeClients, filteredClients]);

  const alerts = React.useMemo(() => generateAlerts(), [generateAlerts]);

  // Events Tracker
  const upcomingEvents = filteredClients.filter(c => {
    const d = c.eventDate || c.weddingDate;
    return d && new Date(d) >= today;
  }).sort((a,b) => new Date(a.eventDate || a.weddingDate!).getTime() - new Date(b.eventDate || b.weddingDate!).getTime());
  const eventsCount = upcomingEvents.length;

  const myTasksCount = filteredTasks.filter(t => t && t.status !== 'Done').length; 
  const activeProjectsCount = filteredClients.length;

  let metrics: any[] = [];
  if (userRole === 'Staff') {
    metrics = [
      { id: 1, label: 'My Tasks', value: myTasksCount, hex: '#FFFFFF', icon: CheckSquare, bg: 'bg-zinc-900' },
      { id: 2, label: 'Active Jobs', value: activeProjectsCount, hex: '#10b981', icon: Layers, bg: 'bg-emerald-950/10' },
      { id: 3, label: 'Alerts', value: alerts.length, hex: '#f59e0b', icon: MessageSquare, bg: 'bg-amber-950/10' },
      { id: 4, label: 'Events', value: eventsCount, hex: '#3b82f6', icon: CalendarCheck, bg: 'bg-blue-950/10' },
    ];
  } else {
    metrics = [
      { id: 1, label: 'Total Revenue', value: `₹${(totalRevenue / 100000).toFixed(1)}L`, hex: '#FFFFFF', icon: Briefcase, bg: 'bg-zinc-900', targetPath: '/analytics' },
      { id: 2, label: 'Cash Flow', value: `₹${(cashFlow / 100000).toFixed(1)}L`, hex: '#10b981', icon: IndianRupee, bg: 'bg-emerald-950/10' },
      { id: 3, label: 'Alerts', value: alerts.length, hex: '#f59e0b', icon: MessageSquare, bg: 'bg-amber-950/10' },
      { id: 4, label: 'Events', value: eventsCount, hex: '#3b82f6', icon: CalendarCheck, bg: 'bg-blue-950/10' },
    ];
  }

  return (
    <div className="space-y-12 animate-ios-slide-up">
      <div className="space-y-6">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase leading-none">Command Center</h1>
        <div className="bg-zinc-900/50 p-2 rounded-2xl border border-white/5 flex gap-2 overflow-x-auto no-scrollbar max-w-max">
          <button
            onClick={() => setSelectedBrand('All')}
            className={`px-10 py-3.5 text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all whitespace-nowrap ${selectedBrand === 'All' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            Global
          </button>
          
          {divisions.map(div => (
            <button
              key={div.id}
              onClick={() => setSelectedBrand(div.name)}
              className={`px-10 py-3.5 text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all whitespace-nowrap ${selectedBrand === div.name ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
            >
              {div.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.id} onClick={() => m.targetPath && navigate(m.targetPath)} className={`${m.bg} border border-white/5 p-8 squircle-lg flex flex-col justify-between h-48 group cursor-pointer active:scale-95 ios-transition`}>
              <div className="flex justify-between items-start">
                <div className="p-4 rounded-2xl bg-white/5 text-white shadow-xl group-hover:bg-white group-hover:text-black transition-all">
                  <Icon className="w-6 h-6" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-zinc-700" />
              </div>
              <div>
                <p className="text-zinc-600 text-xs font-black uppercase tracking-widest mb-1">{m.label}</p>
                <h3 className="text-3xl font-black text-white tracking-tight">{m.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alerts Section */}
        <div className="lg:col-span-2 bg-amber-500/5 border border-amber-500/10 p-12 squircle-xl space-y-10">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white uppercase tracking-widest flex items-center gap-4">
              <MessageSquare className="w-6 h-6 text-amber-500 fill-amber-500/20" /> Alerts
            </h3>
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-md">Automated Warnings</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.slice(0, 6).map((alert, idx) => {
              const AlertIcon = alert.icon;
              return (
                <div 
                  key={idx} 
                  onClick={() => alert.action && alert.action()}
                  className={`p-6 bg-white/5 rounded-3xl border flex items-center gap-4 group hover:bg-white/10 ios-transition cursor-pointer ${alert.type === 'critical' ? 'border-red-500/20 bg-red-500/5' : alert.type === 'event' ? 'border-blue-500/20 bg-blue-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}
                >
                  <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${alert.type === 'critical' ? 'bg-red-500/20 text-red-500 border border-red-500/20' : alert.type === 'event' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/20' : 'bg-amber-500/20 text-amber-500 border border-amber-500/20'}`}>
                    <AlertIcon className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className={`text-xs font-black uppercase tracking-tight truncate ${alert.type === 'critical' ? 'text-red-400' : alert.type === 'event' ? 'text-blue-400' : 'text-amber-400'}`}>{alert.text}</p>
                  </div>
                </div>
              );
            })}
            {alerts.length === 0 && (
              <p className="col-span-full text-center py-10 text-[10px] font-black uppercase text-zinc-700 tracking-widest">No issues detected</p>
            )}
          </div>
        </div>

        {/* Events Section */}
        <div className="bg-blue-500/5 p-12 squircle-xl border border-blue-500/10 space-y-10 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white uppercase tracking-widest flex items-center gap-4">
              <CalendarCheck className="w-6 h-6 text-blue-500" /> Upcoming Events
            </h3>
          </div>
          <div className="space-y-4">
            {upcomingEvents.slice(0, 5).map((ev, idx) => {
              const eventDateStr = ev.eventDate || ev.weddingDate as string;
              return (
              <div 
                key={ev.id || idx} 
                onClick={() => ev.id && navigate(`/project/${ev.id}`)}
                className="p-4 bg-white/5 rounded-2xl flex items-center gap-4 border border-white/5 cursor-pointer hover:bg-white/10 transition-all active:scale-[0.98] group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:text-black transition-all">
                   <CalendarCheck className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-white tracking-widest uppercase group-hover:text-blue-400 transition-all">{ev.projectName || ev.name || 'Unknown Project'} • {ev.projectType || 'Event'}</p>
                  <p className="text-[10px] uppercase text-zinc-500 font-black tracking-widest mt-1">
                    {new Date(eventDateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-700 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            )})}
            {eventsCount === 0 && (
               <p className="text-center py-10 text-[10px] font-black uppercase text-zinc-700 tracking-widest">No upcoming events</p>
            )}
          </div>
        </div>
      </div>

      {/* Client Performance Section */}
      <div className="space-y-8">
        <h3 className="text-base font-black text-white uppercase tracking-widest flex items-center gap-4">
          <TrendingUp className="w-6 h-6 text-emerald-500" /> Client Profitability
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {clientProfitData.map((client, idx) => {
            const isLoss = client.profit < 0;
            const isLow = client.profit > 0 && client.profit < 10000;
            return (
              <div key={idx} className="glass-panel p-8 border border-white/5 squircle-xl space-y-5 hover:bg-white/5 transition-all group relative overflow-hidden bg-white/[0.02]">
                <div className={`absolute top-0 right-0 w-1 h-full ${isLoss ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tight truncate">{client.name}</h4>
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mt-1.5">Project Performance</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                    <span className="text-zinc-500">Revenue</span>
                    <span className="text-white">₹{client.revenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                    <span className="text-zinc-500">Expenses</span>
                    <span className="text-zinc-400">₹{client.expenses.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                    <div className="flex-1">
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Net Profit</p>
                        <p className={`text-2xl font-black font-mono ${isLoss ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-emerald-500'}`}>
                           ₹{client.profit.toLocaleString('en-IN')}
                        </p>
                    </div>
                    <div className={`p-3 rounded-xl ${isLoss ? 'bg-red-500/10 text-red-500' : isLow ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {isLoss ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {clientProfitData.length === 0 && (
            <p className="col-span-full text-center py-20 text-[10px] font-black uppercase text-zinc-700 tracking-widest">No client data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
