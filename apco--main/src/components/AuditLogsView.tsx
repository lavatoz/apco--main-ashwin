
import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, User, Clock, Search, Filter, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import type { ActivityLog } from '../types';
import { api } from '../services/api';

const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    const data = await api.getLogs();
    setLogs(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.actorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLogTypeColor = (type: ActivityLog['type']) => {
    switch(type) {
      case 'FinanceUpdate': return 'text-emerald-500 bg-emerald-500/10';
      case 'Login': return 'text-blue-500 bg-blue-500/10';
      case 'ClientUpdate': return 'text-amber-500 bg-amber-500/10';
      case 'TaskUpdate': return 'text-purple-500 bg-purple-500/10';
      case 'SystemUpdate': return 'text-red-500 bg-red-500/10';
      default: return 'text-zinc-500 bg-zinc-500/10';
    }
  };

  return (
    <div className="space-y-10 animate-ios-slide-up pb-20">
       <div className="flex justify-between items-center">
        <div>
           <h1 className="text-4xl font-black text-white tracking-tight">Blackbox</h1>
           <p className="text-zinc-500 font-medium tracking-tight uppercase text-[10px] tracking-[0.2em] mt-1">Global Audit Trail • Read-Only Registry</p>
        </div>
        <button onClick={fetchLogs} className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all shadow-xl active:scale-95">
           <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 w-5 h-5 group-focus-within:text-white ios-transition" />
        <input 
          type="text" 
          placeholder="Filter logs by actor, project or action..." 
          className="w-full pl-16 pr-6 py-6 bg-zinc-900/50 border border-white/5 squircle-lg text-sm font-bold text-white outline-none focus:bg-zinc-900 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-zinc-900/30 rounded-[2.5rem] border border-white/5 overflow-hidden">
         <div className="p-10 space-y-8">
            {filteredLogs.map((log, idx) => (
              <div key={log.id} className="flex gap-8 relative pb-8 border-b border-white/5 last:border-0 last:pb-0">
                 <div className="flex flex-col items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${getLogTypeColor(log.type)}`}>
                       <Layers className="w-5 h-5" />
                    </div>
                    <div className="flex-1 w-px bg-white/5" />
                 </div>
                 <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                       <h4 className="text-sm font-black text-white tracking-wide uppercase">{log.action}</h4>
                       <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest flex items-center gap-2">
                          <Clock className="w-3 h-3" /> {new Date(log.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                       </span>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          <User className="w-3.5 h-3.5" /> {log.actorName}
                       </div>
                       <div className="px-2 py-0.5 rounded bg-white/5 text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                          {log.actorRole} Role
                       </div>
                    </div>
                 </div>
              </div>
            ))}
            {filteredLogs.length === 0 && (
               <div className="py-20 text-center">
                  <AlertCircle className="w-12 h-12 text-zinc-800 mx-auto mb-6" />
                  <p className="text-[11px] font-black uppercase tracking-widest text-zinc-800">No telemetry data recorded in this session</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default AuditLogsView;
