import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, MapPin, ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';
import { type Client, type ClientEvent } from '../types';
import { calculateEventStatusAndProgress } from '../utils/eventUtils';

const CoordinationPage: React.FC = () => {
  const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeCounter, setTimeCounter] = useState(0);

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

    // Setup interval to dynamically update event status buckets based on real-time
    const interval = setInterval(() => {
       setTimeCounter(c => c + 1);
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  const eventBuckets = useMemo(() => {
    // We use timeCounter here to force re-evaluation
    void timeCounter;

    type MappedEvent = ClientEvent & { clientId: string, clientName: string, clientBrand?: string, calcStatus: string, calcProgress: number };
    const allEvents: MappedEvent[] = [];
    
    clients.forEach(c => {
       if (c.events && c.events.length > 0) {
          c.events.forEach(ev => {
             const { status, progress } = calculateEventStatusAndProgress(ev);
             allEvents.push({ ...ev, clientId: c.id || c._id || '', clientName: c.name || 'Unknown Client', clientBrand: c.brand, calcStatus: status, calcProgress: progress });
          });
       } else if (c.eventDate || c.weddingDate) {
          // Legacy support for clients without explicit events array but have a date
          const legacyEvent: ClientEvent = {
             id: (c.id || c._id || '') + '_legacy',
             name: c.projectName || 'Legacy Event',
             date: c.eventDate || c.weddingDate || '',
             status: 'Scheduled'
          };
          const { status, progress } = calculateEventStatusAndProgress(legacyEvent);
          
          allEvents.push({
             ...legacyEvent,
             venueLocation: c.eventLogistics?.venueAddress || '',
             brideLocation: c.eventLogistics?.brideAddress || '',
             groomLocation: c.eventLogistics?.groomAddress || '',
             clientId: c.id || c._id || '',
             clientName: c.name || 'Unknown Client',
             clientBrand: c.brand,
             calcStatus: status,
             calcProgress: progress
          });
       }
    });

    return {
      scheduled: allEvents.filter(ev => ev.calcStatus === 'Scheduled' || ev.calcStatus === 'In Preparation').sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      inProgress: allEvents.filter(ev => ev.calcStatus === 'In Progress').sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      completed: allEvents.filter(ev => ev.calcStatus === 'Completed' || ev.calcStatus === 'Cancelled').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }, [clients, timeCounter]);

  if (loading) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[60vh] animate-ios-slide-up">
          <div className="w-10 h-10 border-4 border-zinc-900 border-t-white rounded-full animate-spin mb-6" />
          <p className="text-xs font-bold uppercase text-zinc-400 tracking-[0.4em]">Synchronizing Event Logistics...</p>
       </div>
    );
  }

  const renderEventCard = (ev: any) => (
      <div 
         key={ev.id}
         onClick={() => navigate(`/client/${ev.clientId}`)}
         className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 hover:bg-white/[0.02] hover:border-white/20 transition-all cursor-pointer relative overflow-hidden flex flex-col gap-4 group"
      >
         {/* Dynamic Progress Bar */}
         {ev.startTime && ev.endTime && (
            <div className="absolute top-0 left-0 h-1 bg-white/5 w-full overflow-hidden">
               <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${ev.calcProgress}%` }} />
            </div>
         )}
         
         <div className="flex justify-between items-start">
            <div>
               <span className="px-3 py-1 bg-white/5 rounded-md text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-3 inline-block">{ev.clientName}</span>
               <h3 className="text-lg font-black text-white tracking-tight uppercase group-hover:text-blue-400 transition-colors">{ev.name}</h3>
            </div>
            <div className="text-right shrink-0">
               <span className="text-[10px] font-bold uppercase tracking-widest block text-zinc-500 mb-1">{new Date(ev.date).toLocaleDateString('en-US', { month: 'short' })}</span>
               <span className="text-2xl font-black leading-none">{new Date(ev.date).toLocaleDateString('en-US', { day: 'numeric' })}</span>
            </div>
         </div>

         {(ev.startTime || ev.endTime) && (
            <div className="flex gap-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
               {ev.startTime && <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-emerald-500" /> Start: {ev.startTime}</span>}
               {ev.endTime && <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-red-500" /> End: {ev.endTime}</span>}
            </div>
         )}

         {(ev.brideLocation || ev.groomLocation || ev.venueLocation) && (
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-2 text-left mt-2">
               {ev.brideLocation && (
                  <div className="flex items-start gap-2">
                     <MapPin className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                     <p className="text-[10px] font-medium text-zinc-400 truncate"><span className="font-black uppercase tracking-widest text-zinc-600 mr-2">Bride</span>{ev.brideLocation}</p>
                  </div>
               )}
               {ev.groomLocation && (
                  <div className="flex items-start gap-2">
                     <MapPin className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                     <p className="text-[10px] font-medium text-zinc-400 truncate"><span className="font-black uppercase tracking-widest text-zinc-600 mr-2">Groom</span>{ev.groomLocation}</p>
                  </div>
               )}
               {ev.venueLocation && (
                  <div className="flex items-start gap-2 pt-2 border-t border-white/5">
                     <MapPin className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                     <p className="text-[10px] font-medium text-zinc-400 truncate"><span className="font-black uppercase tracking-widest text-zinc-600 mr-2">Venue</span>{ev.venueLocation}</p>
                  </div>
               )}
            </div>
         )}
      </div>
  );

  return (
    <div className="space-y-12 animate-ios-slide-up pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-4 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Command Center</span>
          </button>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
            Live Execution Board
          </h1>
          <p className="text-xs font-bold uppercase text-zinc-400 tracking-[0.3em] mt-4">Automated Lifecycle Tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {/* TO DO COLUMN */}
         <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
               <h2 className="text-xs font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-500" /> Scheduled
               </h2>
               <span className="bg-white/5 text-zinc-300 text-[10px] font-bold px-2 py-1 rounded">{eventBuckets.scheduled.length}</span>
            </div>
            <div className="space-y-4">
               {eventBuckets.scheduled.map(renderEventCard)}
               {eventBuckets.scheduled.length === 0 && <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center py-8">No Scheduled Events</p>}
            </div>
         </div>

         {/* IN PROGRESS COLUMN */}
         <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-blue-500/20 pb-4">
               <h2 className="text-xs font-black uppercase text-blue-400 tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> In Progress
               </h2>
               <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-1 rounded">{eventBuckets.inProgress.length}</span>
            </div>
            <div className="space-y-4">
               {eventBuckets.inProgress.map(renderEventCard)}
               {eventBuckets.inProgress.length === 0 && <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center py-8">No Active Events</p>}
            </div>
         </div>

         {/* COMPLETED COLUMN */}
         <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
               <h2 className="text-xs font-black uppercase text-emerald-500 tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed
               </h2>
               <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded">{eventBuckets.completed.length}</span>
            </div>
            <div className="space-y-4">
               {eventBuckets.completed.map(renderEventCard)}
               {eventBuckets.completed.length === 0 && <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center py-8">No Completed Events</p>}
            </div>
         </div>
      </div>
    </div>
  );
};

export default CoordinationPage;
