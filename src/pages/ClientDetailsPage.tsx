import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Phone, Calendar, Briefcase, Plus, ArrowLeft } from 'lucide-react';
import type { Client } from '../types';

const ClientDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Client ID:", id);
    const storedClients = localStorage.getItem('clients');
    if (storedClients) {
      const clients: Client[] = JSON.parse(storedClients);
      console.log("Clients Registry:", clients);
      const found = clients.find(c => c.id === id);
      setClient(found || null);
    }
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 text-center animate-ios-slide-up">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/10">
          <span className="text-red-500 text-4xl font-black">!</span>
        </div>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Client Not Found</h1>
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.2em] mb-10">Historical Record Missing from Registry</p>
        <button 
          onClick={() => navigate('/directory')}
          className="px-10 py-4 bg-white text-black text-[11px] font-black uppercase rounded-2xl tracking-widest active:scale-95 transition-all"
        >
          Return to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="animate-ios-slide-up space-y-10 pb-32">
      <div className="flex items-center gap-6">
        <button 
          onClick={() => navigate('/directory')}
          className="p-4 bg-white/5 border border-white/10 rounded-2xl text-zinc-500 hover:text-white transition-all active:scale-90"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase leading-none">Client Dossier</h1>
          <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] mt-2">Personal Identity & Project Profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-10 squircle-lg border border-white/5 space-y-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-white/10" />
            
            <div className="flex items-center gap-8">
              <div className="w-24 h-24 rounded-3xl bg-white text-black flex items-center justify-center text-4xl font-black shadow-2xl">
                {(client.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter">{client.name || 'Anonymous Client'}</h2>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase rounded-lg tracking-widest">Active Profile</span>
                  <span className="px-3 py-1 bg-white/5 text-zinc-500 text-[10px] font-black uppercase rounded-lg tracking-widest">{client.projectType || 'General'} Projection</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="flex items-center gap-4 group">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:bg-white/10 transition-all"><Mail className="w-5 h-5 text-zinc-500" /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest leading-none mb-1.5">Email Address</p>
                    <p className="text-sm font-bold text-white uppercase break-all">{client.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:bg-white/10 transition-all"><Phone className="w-5 h-5 text-zinc-500" /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest leading-none mb-1.5">Direct Line</p>
                    <p className="text-sm font-bold text-white uppercase">{client.phone}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 group">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:bg-white/10 transition-all"><Calendar className="w-5 h-5 text-zinc-500" /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest leading-none mb-1.5">Filing Date</p>
                    <p className="text-sm font-bold text-white uppercase">{client.eventDate || client.weddingDate || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:bg-white/10 transition-all"><Briefcase className="w-5 h-5 text-zinc-500" /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest leading-none mb-1.5">Project Scope</p>
                    <p className="text-sm font-bold text-white uppercase">{client.projectType || 'Standard'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 space-y-8 bg-white text-black shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Operational Actions</h3>
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Execute Profile Commands</p>
            </div>
            
            <button 
              onClick={() => navigate('/directory')}
              className="w-full py-5 bg-black text-white rounded-2xl flex items-center justify-center gap-4 hover:bg-zinc-800 transition-all active:scale-95 group shadow-2xl"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-all" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">Initiate Project</span>
            </button>

            <div className="pt-4 border-t border-black/5">
              <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest text-center">Session Synchronized via OS v5.5</p>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-[2rem] border border-white/5 flex items-center justify-center opacity-30">
             <p className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-500">End of Record</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailsPage;
