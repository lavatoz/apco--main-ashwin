import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft, RefreshCw } from 'lucide-react';

const AnalyticsPage: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  
  const [data, setData] = useState<{name: string, value: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [brands, setBrands] = useState<{_id: string, name: string}[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/api/brands", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          const bData = await response.json();
          setBrands(bData);
          if (bData.length > 0) {
            setSelectedBrandId(bData[0]._id);
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load brands:", err);
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  useEffect(() => {
    const fetchFinance = async () => {
      if (!selectedBrandId) return;
      
      setLoading(true);
      setError(null);
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
        
        const summary = await response.json();
        
        setData([
          { name: "Revenue", value: summary.totalRevenue || 0 },
          { name: "Expenses", value: summary.totalExpenses || 0 },
          { name: "Profit", value: summary.profit || 0 }
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network check failed');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFinance();
  }, [selectedBrandId]);

  const getTitle = () => {
    switch (type) {
      case 'revenue': return 'Revenue Analytics';
      case 'profit': return 'Profit Analytics';
      case 'expenses': return 'Expenses Analytics';
      default: return 'Financial Analytics';
    }
  };

  const getColor = (name: string) => {
    switch (name) {
      case 'Revenue': return '#FFFFFF';
      case 'Expenses': return '#f43f5e';
      case 'Profit': return '#10b981';
      default: return '#3b82f6';
    }
  };

  const activeMetricValue = data.find(d => d.name.toLowerCase() === type)?.value || 0;

  return (
    <div className="space-y-8 animate-ios-slide-up pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-colors mb-6 border border-white/5 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">{getTitle()}</h1>
          <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] mt-2">Financial Data Visualization</p>
        </div>

        {brands.length > 0 && (
          <select
            value={selectedBrandId || ''}
            onChange={(e) => setSelectedBrandId(e.target.value)}
            className="bg-zinc-900 border border-white/10 text-white rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:border-white/30 transition-all cursor-pointer shadow-lg max-w-[150px] md:max-w-xs mt-12 md:mt-0"
          >
            {brands.map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-mono uppercase tracking-widest p-4 rounded-2xl mb-4 text-center animate-pulse">
          Connection Error: {error}
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center p-24 glass-panel rounded-[2rem] border border-dashed border-zinc-800 space-y-4">
          <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Gathering Data...</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="glass-panel p-8 squircle-lg flex flex-col justify-center items-start border border-white/5 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-48 h-48 blur-3xl opacity-20 rounded-full`} style={{ backgroundColor: getColor(type ? type.charAt(0).toUpperCase() + type.slice(1) : '') }} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 relative z-10">Total {type}</p>
            <h3 className="text-6xl font-black text-white tracking-tighter font-mono relative z-10">
              ₹{(activeMetricValue).toLocaleString('en-IN')}
            </h3>
          </div>

          <div className="glass-panel p-4 md:p-8 squircle-lg border border-white/5 h-[450px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                 <XAxis 
                   dataKey="name" 
                   stroke="#a1a1aa" 
                   fontSize={10} 
                   fontWeight="bold" 
                   tickLine={false}
                   axisLine={false}
                   tickMargin={10}
                 />
                 <YAxis 
                   stroke="#a1a1aa" 
                   fontSize={10} 
                   tickFormatter={(value) => `₹${value / 1000}k`}
                   tickLine={false}
                   axisLine={false}
                   tickMargin={10}
                 />
                 <Tooltip 
                   cursor={{ fill: '#ffffff05' }}
                   contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '1rem', color: '#fff' }}
                   itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                   formatter={(value: number | string | undefined) => [`₹${Number(value || 0).toLocaleString('en-IN')}`, 'Amount']}
                 />
                 <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
