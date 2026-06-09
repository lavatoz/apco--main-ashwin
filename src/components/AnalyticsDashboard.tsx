import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { api } from '../services/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, BarChart2 } from 'lucide-react';



const AnalyticsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { companies, selectedCompanyId, setSelectedCompanyId } = useCompanySettings();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const data = await api.getFinanceSummary(selectedCompanyId, selectedCompanyId === 'All' ? 'global' : 'project');
        setSummary(data);
      } catch (err) {
        console.error("Analytics Finance Sync Failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [selectedCompanyId]);

  const chartData = useMemo(() => {
    if (!summary) return [];
    
    const dataMap: Record<string, { dateStr: string; revenue: number; expenses: number }> = {};

    // Process Invoices
    summary.invoices?.forEach((inv: any) => {
      const dateVal = inv.issueDate || inv.date || inv.createdAt;
      if (!dateVal) return;
      const dateObj = new Date(dateVal);
      if (isNaN(dateObj.getTime())) return;
      
      const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      
      if (!dataMap[dateStr]) {
        dataMap[dateStr] = { dateStr, revenue: 0, expenses: 0 };
      }
      dataMap[dateStr].revenue += Number(inv.total || inv.totalAmount || (inv.items?.reduce((s: any, it: any) => s + (it.price * it.quantity), 0) || 0));
    });

    // Process Expenses
    summary.expenses?.forEach((exp: any) => {
      const dateVal = exp.date || exp.createdAt;
      if (!dateVal) return;
      const dateObj = new Date(dateVal);
      if (isNaN(dateObj.getTime())) return;
      
      const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      
      if (!dataMap[dateStr]) {
        dataMap[dateStr] = { dateStr, revenue: 0, expenses: 0 };
      }
      dataMap[dateStr].expenses += Number(exp.amount || 0);
    });

    // Finalize Array & Sort
    const finalData = Object.values(dataMap).map((d) => ({
      ...d,
      profit: d.revenue - d.expenses
    }));
    
    finalData.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    
    // Format Date for Display
    return finalData.map(d => {
      const parts = d.dateStr.split('-');
      const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return {
        ...d,
        displayDate: dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' })
      };
    });
  }, [summary]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 animate-ios-slide-up h-[70vh]">
        <div className="w-12 h-12 border-4 border-zinc-900 border-t-white rounded-full animate-spin mb-6" />
        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em]">Synchronizing Financial Models...</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 animate-ios-slide-up min-h-[70vh] bg-zinc-950/20 rounded-[3rem] border border-dashed border-white/5">
        <BarChart2 className="w-20 h-20 text-zinc-800 mb-8" />
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">No financial data for this project yet</h2>
        <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-4 mb-10 max-w-md text-center leading-relaxed">
          Operational metrics are empty. You haven't issued any invoices or logged outflow for {selectedCompanyId === 'All' ? 'any entity' : selectedCompanyId}.
        </p>
        <div className="flex gap-4">
          <button onClick={() => navigate('/revenue')} className="px-8 py-3.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 shadow-xl shadow-white/5">
            Create Invoice
          </button>
          <button onClick={() => navigate('/ledger')} className="px-8 py-3.5 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all active:scale-95 border border-white/10">
            Go to Ledger
          </button>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl">
          <p className="text-white font-black uppercase text-[10px] tracking-widest mb-3 border-b border-white/10 pb-2">{label}</p>
          {payload.map((p: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-6 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: p.color }}>{p.name}</span>
              <span className="text-sm font-mono font-black text-white">₹{Number(p.value).toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-10 animate-ios-slide-up pb-24">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none flex items-center gap-4">
            Analytics <TrendingUp className="w-10 h-10 text-primary" />
          </h1>
          <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] mt-3">Comprehensive Financial Intelligence</p>
        </div>

        <div className="bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 flex gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCompanyId('All')}
            className={`px-8 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${selectedCompanyId === 'All' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            Global
          </button>
          {companies.map(div => (
            <button
              key={div.id}
              onClick={() => setSelectedCompanyId(div.id)}
              className={`px-8 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${selectedCompanyId === div.id ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
            >
              {div.companyName}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-8 squircle-lg border border-white/5 bg-zinc-900/40">
           <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">Lifetime Revenue</p>
           <h3 className="text-3xl font-black text-white font-mono">₹{chartData.reduce((s,d) => s+d.revenue, 0).toLocaleString('en-IN')}</h3>
        </div>
        <div className="glass-panel p-8 squircle-lg border border-white/5 bg-zinc-900/40">
           <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">Total Burn</p>
           <h3 className="text-3xl font-black text-red-500 font-mono">₹{chartData.reduce((s,d) => s+d.expenses, 0).toLocaleString('en-IN')}</h3>
        </div>
        <div className="glass-panel p-8 squircle-lg border border-white/5 bg-zinc-900/40">
           <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">Operating Margin</p>
           <h3 className="text-3xl font-black text-primary font-mono">
             {((chartData.reduce((s,d) => s+d.profit, 0) / (chartData.reduce((s,d) => s+d.revenue, 0) || 1)) * 100).toFixed(1)}%
           </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Trend Line Chart */}
        <div className="glass-panel p-6 squircle-lg bg-zinc-900/30 border border-white/5 space-y-6 lg:col-span-2">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
            Profit Margin Tracking
          </h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="displayDate" 
                  stroke="#71717a" 
                  tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#71717a" 
                  tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Comparative Bar Chart */}
        <div className="glass-panel p-6 squircle-lg bg-zinc-900/30 border border-white/5 space-y-6 lg:col-span-2">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
            Income vs Outflow Activity
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="displayDate" 
                  stroke="#71717a" 
                  tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#71717a" 
                  tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }} />
                <Bar dataKey="revenue" name="Revenue Volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expense Load" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;

