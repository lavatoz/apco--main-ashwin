import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, BarChart2 } from 'lucide-react';

interface Entry {
  id: string | number;
  total?: number;
  date?: string;
  createdAt?: string;
  type?: string;
}

interface Expense {
  id: string | number;
  amount: number;
  date?: string;
  createdAt?: string;
}

const AnalyticsDashboard: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    try {
      const storedEntries = localStorage.getItem('entries');
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
      }
      const storedExpenses = localStorage.getItem('expenses');
      if (storedExpenses) {
        setExpenses(JSON.parse(storedExpenses));
      }
    } catch (error) {
      console.warn('Failed to parse localStorage data', error);
    }
  }, []);

  const chartData = useMemo(() => {
    const dataMap: Record<string, { dateStr: string; revenue: number; expenses: number }> = {};

    // Process Entries (Revenue)
    entries.forEach((entry) => {
      if (entry.type !== 'invoice') return;
      const dateVal = entry.date || entry.createdAt;
      if (!dateVal) return;
      const dateObj = new Date(dateVal);
      if (isNaN(dateObj.getTime())) return;
      
      const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      
      if (!dataMap[dateStr]) {
        dataMap[dateStr] = { dateStr, revenue: 0, expenses: 0 };
      }
      dataMap[dateStr].revenue += Number(entry.total || 0);
    });

    // Process Expenses
    expenses.forEach((expense) => {
      const dateVal = expense.date || expense.createdAt;
      if (!dateVal) return;
      const dateObj = new Date(dateVal);
      if (isNaN(dateObj.getTime())) return;
      
      const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      
      if (!dataMap[dateStr]) {
        dataMap[dateStr] = { dateStr, revenue: 0, expenses: 0 };
      }
      dataMap[dateStr].expenses += Number(expense.amount || 0);
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
  }, [entries, expenses]);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 animate-ios-slide-up h-full min-h-[50vh]">
        <BarChart2 className="w-16 h-16 text-zinc-800 mb-6" />
        <h2 className="text-2xl font-black text-white uppercase tracking-widest">No financial data available</h2>
        <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Create invoices or log expenses to populate metrics.</p>
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
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none flex items-center gap-4">
            Revenue Analytics <TrendingUp className="w-8 h-8 text-blue-500" />
          </h1>
          <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] mt-2">Cash Flow Modeling & Performance</p>
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
           <h3 className="text-3xl font-black text-emerald-500 font-mono">
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
