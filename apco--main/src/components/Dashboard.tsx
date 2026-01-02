
import React, { useState, useEffect } from 'react';
import { 
  Users, CalendarCheck, IndianRupee, Clock, Briefcase, 
  CheckCircle, AlertCircle, Trophy, User, ArrowUpRight, TrendingUp, Sparkles, Activity, MessageSquare, Database, HardDrive, ChevronRight, Heart, Gift, CheckSquare, Layers
} from 'lucide-react';
import { BookingStatus, InvoiceStatus, type ActivityLog, type Booking, type Client, type CloudConfig, type Company, type Invoice, type Task } from '../types';
import { api } from '../services/api';


interface DashboardProps {
  invoices: Invoice[];
  clients: Client[];
  bookings: Booking[];
  companies: Company[];
  tasks: Task[];
  selectedBrand: string | 'All';
  setSelectedBrand: (brand: string | 'All') => void;
  userRole: 'Admin' | 'Staff' | 'Client' | 'none';
}

const Dashboard: React.FC<DashboardProps> = ({ invoices, clients, bookings, companies, tasks, selectedBrand, setSelectedBrand, userRole }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [cloudConfig, setCloudConfig] = useState<CloudConfig | null>(null);

  useEffect(() => {
    api.getLogs().then(setLogs);
    api.getCloudConfig().then(setCloudConfig);
  }, []);

  const filteredInvoices = selectedBrand === 'All' ? invoices.filter(i => !i.isQuotation) : invoices.filter(i => i.brand === selectedBrand && !i.isQuotation);
  const filteredBookings = selectedBrand === 'All' ? bookings : bookings.filter(b => b.brand === selectedBrand);

  const upcomingBookings = filteredBookings.filter(b => b.status === BookingStatus.Confirmed && new Date(b.date) >= new Date());
  
  const cashInHand = filteredInvoices
    .filter(inv => inv.status === InvoiceStatus.Paid)
    .reduce((sum, inv) => sum + inv.items.reduce((s, i) => s + (i.price * i.quantity), 0), 0);

  const totalEarnings = filteredInvoices
    .reduce((sum, inv) => sum + inv.items.reduce((s, i) => s + (i.price * i.quantity), 0), 0);

  // Operational Metrics for Staff
  const myTasksCount = tasks.filter(t => t.status !== 'Done').length; // Assuming simpler count for now
  const activeProjectsCount = clients.length;

  const getCelebrations = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 14);

    const events: { client: Client, type: 'Birthday' | 'Anniversary', date: Date }[] = [];

    clients.forEach(c => {
      if (c.weddingDate) {
        const anniv = new Date(c.weddingDate);
        anniv.setFullYear(today.getFullYear());
        if (anniv >= today && anniv <= nextWeek) events.push({ client: c, type: 'Anniversary', date: anniv });
      }
      c.people.forEach(p => {
        if (p.dateOfBirth) {
          const bday = new Date(p.dateOfBirth);
          bday.setFullYear(today.getFullYear());
          if (bday >= today && bday <= nextWeek) {
            events.push({ client: c, type: 'Birthday', date: bday });
          }
        }
      });
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const upcomingCelebrations = getCelebrations();

  // Define metrics based on role
  let metrics = [];

  if (userRole === 'Staff') {
    metrics = [
       { id: 1, label: 'My Tasks', value: myTasksCount, hex: '#FFFFFF', icon: CheckSquare, bg: 'bg-zinc-900' },
       { id: 2, label: 'Active Jobs', value: activeProjectsCount, hex: '#10b981', icon: Layers, bg: 'bg-emerald-950/10' },
       { id: 3, label: 'Alerts', value: clients.reduce((s, c) => s + (c.requirements?.filter(r => r.status === 'Pending').length || 0), 0), hex: '#f59e0b', icon: MessageSquare, bg: 'bg-amber-950/10' },
       { id: 4, label: 'Events', value: upcomingBookings.length, hex: '#3b82f6', icon: CalendarCheck, bg: 'bg-blue-950/10' },
    ];
  } else {
    // Admin View
    metrics = [
      { id: 1, label: 'Sales', value: `₹${(totalEarnings/100000).toFixed(1)}L`, hex: '#FFFFFF', icon: Briefcase, bg: 'bg-zinc-900' },
      { id: 2, label: 'Cash', value: `₹${(cashInHand/100000).toFixed(1)}L`, hex: '#10b981', icon: IndianRupee, bg: 'bg-emerald-950/10' },
      { id: 3, label: 'Alerts', value: clients.reduce((s, c) => s + (c.requirements?.filter(r => r.status === 'Pending').length || 0), 0), hex: '#f59e0b', icon: MessageSquare, bg: 'bg-amber-950/10' },
      { id: 4, label: 'Events', value: upcomingBookings.length, hex: '#3b82f6', icon: CalendarCheck, bg: 'bg-blue-950/10' },
    ];
  }

  return (
    <div className="space-y-8 animate-ios-slide-up">
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Command Center</h1>
        <div className="bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 flex gap-1 overflow-x-auto no-scrollbar max-w-max">
           <button 
             onClick={() => setSelectedBrand('All')}
             className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${selectedBrand === 'All' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
           >
             Global
           </button>
           {companies.map(co => (
             <button 
               key={co.id}
               onClick={() => setSelectedBrand(co.name)}
               className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${selectedBrand === co.name ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
             >
               {co.name.split(' ')[0]}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.id} className={`${m.bg} border border-white/5 p-6 squircle-md flex flex-col justify-between h-40 group cursor-pointer active:scale-95 ios-transition`}>
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
        {/* Celebration Radar - CRM Focus */}
        <div className="lg:col-span-2 bg-pink-500/5 border border-pink-500/10 p-10 squircle-lg space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                <Heart className="w-5 h-5 text-pink-500 fill-pink-500/20" /> Relationship Nurture
              </h3>
              <div className="flex items-center gap-2">
                 <Sparkles className="w-4 h-4 text-pink-500" />
                 <span className="text-[8px] font-black uppercase text-pink-500 bg-pink-500/10 px-2 py-1 rounded-md">AI Insights</span>
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingCelebrations.slice(0, 4).map((celebration, idx) => (
                <div key={idx} className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between group hover:bg-white/10 ios-transition cursor-pointer">
                   <div className="flex items-center gap-4 overflow-hidden">
                      <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${celebration.type === 'Birthday' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'}`}>
                         {celebration.type === 'Birthday' ? <Gift className="w-6 h-6" /> : <Heart className="w-6 h-6" />}
                      </div>
                      <div className="overflow-hidden">
                         <p className="text-xs font-black text-white uppercase tracking-tight truncate">{celebration.client.projectName}</p>
                         <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest mt-1">{celebration.type} • {celebration.date.toLocaleDateString([], { day: 'numeric', month: 'short' })}</p>
                      </div>
                   </div>
                   <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-white group-hover:translate-x-1 ios-transition" />
                </div>
              ))}
              {upcomingCelebrations.length === 0 && (
                <p className="col-span-full text-center py-10 text-[10px] font-black uppercase text-zinc-700 tracking-widest">No life milestones detected this cycle</p>
              )}
           </div>
        </div>

        {/* Multi-Vault Monitor */}
        <div className="bg-zinc-900/30 p-10 squircle-lg border border-blue-500/10 space-y-8 flex flex-col justify-center">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                <Database className="w-5 h-5 text-blue-500" /> Storage Ecosystem
              </h3>
           </div>
           <div className="space-y-6">
              {cloudConfig?.vaults.map(v => (
                <div key={v.id} className="space-y-3">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-zinc-500">{v.name}</span>
                      <span className={`${v.usagePercent > 85 ? 'text-red-500 animate-pulse' : 'text-zinc-600'}`}>{v.usagePercent}% Cap</span>
                   </div>
                   <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ios-transition ${v.usagePercent > 85 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-blue-500'}`} style={{ width: `${v.usagePercent}%` }} />
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
