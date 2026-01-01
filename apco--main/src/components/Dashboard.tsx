
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, CalendarCheck, AlertCircle, RefreshCcw, IndianRupee, Clock, Briefcase } from 'lucide-react';
import type { Invoice, Client, Booking, Brand } from '../types';
import { InvoiceStatus, BookingStatus } from '../types';
import { analyzeBusinessTrends } from '../services/geminiService';

interface DashboardProps {
  invoices: Invoice[];
  clients: Client[];
  bookings: Booking[];
  selectedBrand: Brand | 'All';
  setSelectedBrand: (brand: Brand | 'All') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ invoices, clients, bookings, selectedBrand, setSelectedBrand }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Filter Data based on Brand
  const filteredInvoices = selectedBrand === 'All' ? invoices : invoices.filter(i => i.brand === selectedBrand);
  const filteredClients = selectedBrand === 'All' ? clients : clients.filter(c => c.brand === selectedBrand);
  const filteredBookings = selectedBrand === 'All' ? bookings : bookings.filter(b => b.brand === selectedBrand);

  // Calculate Metrics
  const totalRevenue = filteredInvoices
    .filter(inv => inv.status === InvoiceStatus.Paid)
    .reduce((sum, inv) => sum + inv.items.reduce((s, i) => s + (i.price * i.quantity), 0), 0);

  const pendingRevenue = filteredInvoices
    .filter(inv => inv.status === InvoiceStatus.Unpaid || inv.status === InvoiceStatus.Overdue)
    .reduce((sum, inv) => sum + inv.items.reduce((s, i) => s + (i.price * i.quantity), 0), 0);
  
  // Upcoming Events logic (Next 5 events)
  const upcomingWork = filteredBookings
    .filter(b => b.status === BookingStatus.Confirmed && new Date(b.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const upcomingEventsCount = upcomingWork.length;

  const data = [
    { name: 'Jan', value: 400000 },
    { name: 'Feb', value: 300000 },
    { name: 'Mar', value: 200000 },
    { name: 'Apr', value: 278000 },
    { name: 'May', value: 189000 },
    { name: 'Jun', value: 239000 },
    { name: 'Jul', value: 349000 },
  ]; 

  const handleAnalyze = async () => {
    setLoadingAnalysis(true);
    const result = await analyzeBusinessTrends(data);
    setAiAnalysis(result);
    setLoadingAnalysis(false);
  };

  // Branding Helpers
  const isWedding = selectedBrand === 'Aaha Kalayanam';
  const isBaby = selectedBrand === 'Tiny Toes';
  const isAll = selectedBrand === 'All';

  // Dynamic Styles (High Contrast)
  const textPrimary = isBaby ? 'text-slate-900' : 'text-zinc-100';
  const textSecondary = isBaby ? 'text-slate-600' : 'text-zinc-400';
  const cardBg = isBaby ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-700';
  const buttonActive = isBaby ? 'bg-blue-600 text-white shadow-md' : (isWedding ? 'bg-yellow-600 text-black shadow-md' : 'bg-zinc-100 text-black');
  const buttonInactive = isBaby ? 'text-slate-600 hover:bg-slate-100' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white';

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-10">
      {/* Brand Selector Header */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 ${isBaby ? 'border-slate-200' : 'border-zinc-800'}`}>
        <div>
          <h1 className={`text-3xl font-bold ${textPrimary} font-serif tracking-tight`}>AP Co. Dashboard</h1>
          <p className={textSecondary}>Overview of Aaha Kalayanam & Tiny Toes performance.</p>
        </div>
        
        <div className={`flex items-center gap-2 p-1 rounded-lg border ${cardBg}`}>
           <button 
             onClick={() => setSelectedBrand('All')}
             className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all ${isAll ? 'bg-zinc-700 text-white' : buttonInactive}`}
           >
             All
           </button>
           <button 
             onClick={() => setSelectedBrand('Aaha Kalayanam')}
             className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all ${selectedBrand === 'Aaha Kalayanam' ? 'bg-yellow-600 text-black' : buttonInactive}`}
           >
             Aaha Kalayanam
           </button>
           <button 
             onClick={() => setSelectedBrand('Tiny Toes')}
             className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all ${selectedBrand === 'Tiny Toes' ? 'bg-blue-600 text-white' : buttonInactive}`}
           >
             Tiny Toes
           </button>
        </div>
      </div>

      <div className="flex justify-end">
         <button 
          onClick={handleAnalyze}
          disabled={loadingAnalysis}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium border ${isBaby ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white hover:bg-zinc-700'}`}
        >
          {loadingAnalysis ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
          Get AI Insights
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Total Revenue" 
          value={`₹${totalRevenue.toLocaleString('en-IN')}`} 
          icon={IndianRupee} 
          theme={selectedBrand}
        />
        <KpiCard 
          title="Pending Payments" 
          value={`₹${pendingRevenue.toLocaleString('en-IN')}`} 
          icon={AlertCircle} 
           theme={selectedBrand}
        />
        <KpiCard 
          title="Active Clients" 
          value={filteredClients.length.toString()} 
          icon={Users} 
          theme={selectedBrand}
        />
        <KpiCard 
          title="Upcoming Events" 
          value={upcomingEventsCount.toString()} 
          icon={CalendarCheck} 
           theme={selectedBrand}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Work Reminders */}
        <div className={`lg:col-span-1 p-6 rounded-xl shadow-sm border ${cardBg}`}>
           <div className="flex items-center gap-2 mb-6">
              <div className={`p-2 rounded-lg ${isBaby ? 'bg-blue-100 text-blue-600' : 'bg-yellow-900/20 text-yellow-500'}`}>
                <Clock className="w-5 h-5" />
              </div>
              <h3 className={`text-lg font-bold ${textPrimary}`}>Upcoming Schedule</h3>
           </div>
           
           <div className="space-y-4">
             {upcomingWork.length === 0 && (
               <p className={`text-sm ${textSecondary}`}>No upcoming work scheduled.</p>
             )}
             {upcomingWork.map((booking) => (
               <div key={booking.id} className={`flex items-start gap-3 p-3 rounded-lg border ${isBaby ? 'bg-slate-50 border-slate-100' : 'bg-black border-zinc-800'}`}>
                  <div className={`w-12 text-center rounded py-1 ${booking.brand === 'Aaha Kalayanam' ? 'bg-zinc-800 text-yellow-500' : 'bg-white text-blue-600 border border-blue-100'}`}>
                    <span className="block text-[10px] uppercase font-bold">{new Date(booking.date).toLocaleString('default', { month: 'short' })}</span>
                    <span className="block text-xl font-bold leading-none">{new Date(booking.date).getDate()}</span>
                  </div>
                  <div>
                    <h4 className={`font-semibold text-sm ${textPrimary}`}>{booking.title}</h4>
                    <p className={`text-xs ${textSecondary} mt-0.5`}>
                      {new Date(booking.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {booking.type}
                    </p>
                    <span className={`text-[10px] uppercase tracking-wider font-bold mt-1 inline-block ${booking.brand === 'Aaha Kalayanam' ? 'text-yellow-600' : 'text-blue-500'}`}>
                      {booking.brand}
                    </span>
                  </div>
               </div>
             ))}
           </div>
        </div>

        {/* Revenue Chart */}
        <div className={`lg:col-span-2 p-6 rounded-xl shadow-sm border ${cardBg}`}>
          <h3 className={`text-lg font-bold mb-6 ${textPrimary}`}>Revenue Overview (INR)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isBaby ? "#e2e8f0" : "#333"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isBaby ? '#64748b' : '#999', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: isBaby ? '#64748b' : '#999', fontSize: 12}} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip 
                  cursor={{fill: isBaby ? '#f1f5f9' : '#333'}}
                  formatter={(value: number | undefined) => [`₹${value ? value.toLocaleString('en-IN') : '0'}`, 'Revenue']}
                  contentStyle={{ 
                    backgroundColor: isBaby ? '#fff' : '#000', 
                    borderRadius: '8px', 
                    border: isBaby ? 'none' : '1px solid #333',
                    color: isBaby ? '#000' : '#fff'
                  }}
                />
                <Bar dataKey="value" fill={isBaby ? "#3b82f6" : "#ca8a04"} radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Analysis Box */}
      {aiAnalysis && (
        <div className={`p-4 rounded-xl text-sm leading-relaxed border ${isBaby ? 'bg-blue-50 text-blue-900 border-blue-100' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}>
          <span className={`font-bold block mb-1 ${isBaby ? 'text-blue-700' : 'text-yellow-500'}`}>AP Co. Intelligence:</span>
          {aiAnalysis}
        </div>
      )}
    </div>
  );
};

const KpiCard: React.FC<{ title: string; value: string; icon: React.ElementType; theme: string }> = ({ title, value, icon: Icon, theme }) => {
  const isBaby = theme === 'Tiny Toes';
  const isWedding = theme === 'Aaha Kalayanam';

  let bgClass = 'bg-zinc-900 border-zinc-700'; // Increased contrast border
  let titleClass = 'text-zinc-400';
  let valueClass = 'text-white';
  let iconBg = 'bg-zinc-800 text-zinc-100';

  if (isBaby) {
    bgClass = 'bg-white border-slate-200';
    titleClass = 'text-slate-500';
    valueClass = 'text-slate-900';
    iconBg = 'bg-blue-50 text-blue-600';
  } else if (isWedding) {
    iconBg = 'bg-yellow-900/20 text-yellow-500';
    valueClass = 'text-yellow-500';
  }

  return (
    <div className={`p-6 rounded-xl shadow-sm border flex items-center justify-between ${bgClass}`}>
      <div>
        <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${titleClass}`}>{title}</p>
        <h3 className={`text-2xl font-bold ${valueClass}`}>{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${iconBg}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};

export default Dashboard;
