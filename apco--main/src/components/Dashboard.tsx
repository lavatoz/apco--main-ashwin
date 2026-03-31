
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck, IndianRupee, Briefcase,
  ArrowUpRight, Sparkles, MessageSquare, Database, ChevronRight, Heart, Gift, Layers, CheckSquare
} from 'lucide-react';
import { BookingStatus, type Booking, type Client, type CloudConfig, type Company, type Invoice, type Task } from '../types';
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

const Dashboard: React.FC<DashboardProps> = ({ clients = [], bookings = [], companies = [], tasks = [], selectedBrand, setSelectedBrand, userRole }) => {
  const navigate = useNavigate();
  const [cloudConfig, setCloudConfig] = useState<CloudConfig | null>(null);

  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [profit, setProfit] = useState<number>(0);
  const [financeLoading, setFinanceLoading] = useState<boolean>(false);
  const [financeError, setFinanceError] = useState<string | null>(null);

  const [brands, setBrands] = useState<(Company & { _id: string })[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  useEffect(() => {
    api.getCloudConfig().then(setCloudConfig);

    const fetchBrands = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/api/brands", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setBrands(data);
          if (data.length > 0) {
            setSelectedBrandId(data[0]._id);
          }
        }
      } catch (err) {
        console.error("Failed to load brands:", err);
      }
    };
    
    if (userRole === 'Admin') {
      fetchBrands();
    }
  }, [userRole]);

  useEffect(() => {
    const fetchFinance = async () => {
      if (!selectedBrandId) return;
      
      setFinanceLoading(true);
      setFinanceError(null);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:5000/api/finance/summary?brandId=${selectedBrandId}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error("Failed connecting to finance service");
        }
        
        const data = await response.json();
        setTotalRevenue(data.totalRevenue || 0);
        setTotalExpenses(data.totalExpenses || 0);
        setProfit(data.profit || 0);
      } catch (err) {
        setFinanceError(err instanceof Error ? err.message : 'Network check failed');
      } finally {
        setFinanceLoading(false);
      }
    };
    
    if (userRole === 'Admin') {
      fetchFinance();
    }
  }, [userRole, selectedBrandId]);


  const filteredBookings = selectedBrand === 'All' ? bookings : bookings.filter(b => b.brand === selectedBrand);

  const upcomingBookings = filteredBookings.filter(b => b.status === BookingStatus.Confirmed && new Date(b.date) >= new Date());



  // Operational Metrics for Staff
  const myTasksCount = tasks.filter(t => t.status !== 'Done').length; // Assuming simpler count for now
  const activeProjectsCount = clients.length;

  const getCelebrations = () => {
    if (!Array.isArray(clients)) return [];

    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 14);

    const events: { client: Client, type: 'Birthday' | 'Anniversary', date: Date }[] = [];

    (clients || []).forEach(c => {
      // Use weddingDate (old schema) or eventDate (new schema) mapped properly
      const notableDate = c.weddingDate || c.eventDate;
      if (notableDate) {
        const anniv = new Date(notableDate);
        anniv.setFullYear(today.getFullYear());
        if (anniv >= today && anniv <= nextWeek) events.push({ client: c, type: 'Anniversary', date: anniv });
      }
      // For any clients using the legacy people[] mock schema array
      (c.people || []).forEach(p => {
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

  const formatCurrency = (amount: number) => {
    if (financeLoading) return '...';
    if (financeError) return 'ERR';
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

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
      { id: 1, label: 'Revenue', value: formatCurrency(totalRevenue), hex: '#FFFFFF', icon: Briefcase, bg: 'bg-zinc-900', path: '/analytics/revenue' },
      { id: 2, label: 'Profit', value: formatCurrency(profit), hex: '#10b981', icon: IndianRupee, bg: 'bg-emerald-950/10', path: '/analytics/profit' },
      { id: 3, label: 'Expenses', value: formatCurrency(totalExpenses), hex: '#f43f5e', icon: Layers, bg: 'bg-rose-950/10', path: '/analytics/expenses' },
      { id: 4, label: 'Events', value: upcomingBookings.length, hex: '#3b82f6', icon: CalendarCheck, bg: 'bg-blue-950/10' },
    ];
  }

  return (
    <div className="space-y-8 animate-ios-slide-up">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Command Center</h1>
          {userRole === 'Admin' && brands.length > 0 && (
            <select
              value={selectedBrandId || ''}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="bg-zinc-900 border border-white/10 text-white rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:border-white/30 transition-all cursor-pointer shadow-lg max-w-[150px] md:max-w-xs"
            >
              {brands.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          )}
        </div>
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

      {financeError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-mono uppercase tracking-widest p-4 rounded-2xl mb-4 text-center animate-pulse">
          Connection Error: {financeError}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.id} onClick={() => m.path && navigate(m.path)} className={`${m.bg} border border-white/5 p-6 squircle-md flex flex-col justify-between h-40 group cursor-pointer active:scale-95 ios-transition`}>
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
