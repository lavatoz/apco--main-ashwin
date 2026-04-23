
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, Users, ArrowLeft, 
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import { type Client } from '../types';

const CoordinationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialView = searchParams.get('view') || 'upcoming';

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialView);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const c = await api.getClients();
        setClients(c);
      } catch (err) {
        console.error("Coordination Sync Failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const eventData = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const upcoming = clients.filter(c => {
      const dateStr = c.eventDate || c.weddingDate;
      return dateStr && new Date(dateStr) >= today;
    }).sort((a,b) => new Date(a.eventDate || a.weddingDate!).getTime() - new Date(b.eventDate || b.weddingDate!).getTime());

    const past = clients.filter(c => {
      const dateStr = c.eventDate || c.weddingDate;
      return dateStr && new Date(dateStr) < today;
    }).sort((a,b) => new Date(b.eventDate || b.weddingDate!).getTime() - new Date(a.eventDate || a.weddingDate!).getTime());

    return { upcoming, past };
  }, [clients]);

  const displayedEvents = activeTab === 'upcoming' ? eventData.upcoming : eventData.past;

  if (loading) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[60vh] animate-ios-slide-up">
          <div className="w-10 h-10 border-4 border-zinc-900 border-t-white rounded-full animate-spin mb-6" />
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em]">Synchronizing Event Logistics...</p>
       </div>
    );
  }

  return (
    <div className="space-y-12 animate-ios-slide-up pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-4 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Command Center</span>
          </button>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
            Event Coordination
          </h1>
          <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] mt-4">Logistics Timeline & Site Management</p>
        </div>

        <div className="bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 flex gap-1">
          {['upcoming', 'past'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-white text-black shadow-xl shadow-white/10' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
             >
               {tab} Events
             </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
           {displayedEvents.length === 0 ? (
              <div className="bg-zinc-900/20 border border-dashed border-white/5 rounded-[3rem] p-32 text-center">
                <Calendar className="w-16 h-16 text-zinc-800 mx-auto mb-8" />
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">No Events Scheduled</h2>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-2 px-10 leading-relaxed">The timeline is currently clear. Add events in the Directory to see them here.</p>
              </div>
           ) : (
             displayedEvents.map((ev, idx) => (
                <div 
                  key={ev.id || idx}
                  onClick={() => navigate(`/client/${ev.id}`)}
                  className="group bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10 hover:bg-white/[0.05] transition-all cursor-pointer relative overflow-hidden"
                >
                   <div className="flex flex-col items-center justify-center w-24 h-24 bg-white/5 rounded-[1.5rem] shrink-0 group-hover:bg-white group-hover:text-black transition-all">
                      <span className="text-[10px] font-black uppercase tracking-widest mb-1">{new Date(ev.eventDate || ev.weddingDate!).toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-4xl font-black leading-none">{new Date(ev.eventDate || ev.weddingDate!).toLocaleDateString('en-US', { day: 'numeric' })}</span>
                   </div>

                   <div className="flex-1 text-center md:text-left">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
                         <span className="px-4 py-1 bg-white/5 rounded-md text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-black group-hover:bg-white/10 transition-all">{ev.projectType || 'Event'}</span>
                         <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-3 h-3" /> 09:00 AM Onwards
                         </span>
                      </div>
                      <h3 className="text-3xl font-black text-white tracking-tighter uppercase group-hover:text-blue-400 transition-colors">{ev.projectName || ev.name}</h3>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mt-4 text-zinc-500 font-bold text-xs uppercase tracking-widest">
                         <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-500" /> {ev.brand || 'Artisans'}</span>
                         <span className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Crew Confirmed</span>
                      </div>
                   </div>

                   <div className="shrink-0 flex items-center gap-6">
                      <div className="hidden md:block text-right">
                         <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">Status</p>
                         <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Confirmed</p>
                      </div>
                      <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                         <ArrowUpRight className="w-6 h-6" />
                      </div>
                   </div>
                </div>
             ))
           )}
        </div>

        <div className="space-y-8">
           <div className="glass-panel p-8 squircle-xl border border-white/5 space-y-6 bg-zinc-900/40">
              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-3">
                 <Clock className="w-4 h-4 text-blue-500" /> Stats Profile
              </h4>
              <div className="space-y-4 pt-4 border-t border-white/5">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Upcoming</span>
                    <span className="text-xl font-black text-white font-mono">{eventData.upcoming.length}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Past Year</span>
                    <span className="text-xl font-black text-zinc-400 font-mono">{eventData.past.length}</span>
                 </div>
              </div>
           </div>
           
           <div className="bg-blue-600/10 border border-blue-500/20 p-8 squircle-xl space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400">Quick Filters</h4>
              <div className="space-y-3 font-black uppercase text-[9px] tracking-widest">
                 <button className="w-full text-left p-3 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-black transition-all">Next 7 Days</button>
                 <button className="w-full text-left p-3 rounded-lg bg-zinc-900/40 text-zinc-500 hover:text-white transition-all">This Month</button>
                 <button className="w-full text-left p-3 rounded-lg bg-zinc-900/40 text-zinc-500 hover:text-white transition-all">By Brand</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinationPage;
