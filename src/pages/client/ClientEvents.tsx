import React from 'react';
import { Calendar, MapPin, Users } from 'lucide-react';
import type { Client } from '../../types';

interface ClientEventsProps {
  client: Client | null;
}

const ClientEvents: React.FC<ClientEventsProps> = ({ client }) => {
  if (!client) return null;

  const hasEvents = client.events && client.events.length > 0;

  return (
    <div className="p-8 md:p-12 animate-ios-slide-up max-w-[1400px] mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">My Events</h1>
        <p className="text-xl text-zinc-400 font-medium">Event Details & Logistics</p>
      </div>

      <div className="space-y-6">
        {hasEvents ? (
           client.events!.map((ev) => (
             <div key={ev.id} className="glass-panel p-8 squircle-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all mb-8">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Calendar className="w-48 h-48" /></div>
                
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-xs font-bold uppercase tracking-widest mb-6">
                      {ev.status || 'Scheduled'}
                    </div>
                    <h2 className="text-3xl font-black tracking-tight mb-4">{ev.name}</h2>
                    <div className="space-y-4 text-sm font-medium text-zinc-400">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-zinc-500" />
                        <span>{ev.date ? new Date(ev.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date TBD'}</span>
                      </div>
                      {(ev.venueLocation || ev.brideLocation || ev.groomLocation) && (
                         <div className="flex items-start gap-3 mt-6 pt-6 border-t border-white/5">
                            <MapPin className="w-5 h-5 text-zinc-500 mt-1 shrink-0" />
                            <div className="space-y-4 w-full">
                               {ev.brideLocation && <div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Bride Location</p><p className="text-sm font-medium text-white bg-black/30 p-3 rounded-lg border border-white/5">{ev.brideLocation}</p></div>}
                               {ev.groomLocation && <div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Groom Location</p><p className="text-sm font-medium text-white bg-black/30 p-3 rounded-lg border border-white/5">{ev.groomLocation}</p></div>}
                               {ev.venueLocation && <div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Venue Location</p><p className="text-sm font-medium text-white bg-black/30 p-3 rounded-lg border border-white/5">{ev.venueLocation}</p></div>}
                            </div>
                         </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-6 md:border-l md:border-white/5 md:pl-8">
                    {ev.notes && (
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Important Notes</h4>
                        <p className="text-sm text-zinc-300 leading-relaxed bg-black/30 p-4 rounded-xl border border-white/5">{ev.notes}</p>
                      </div>
                    )}
                    {!ev.notes && (
                       <div className="h-full flex items-center justify-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">No Notes Provided</p>
                       </div>
                    )}
                  </div>
                </div>
             </div>
           ))
        ) : (
           <>
              <div className="glass-panel p-8 squircle-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Calendar className="w-48 h-48" /></div>
                
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-xs font-bold uppercase tracking-widest mb-6">
                      Primary Event
                    </div>
                    <h2 className="text-3xl font-black tracking-tight mb-4">{client.projectName}</h2>
                    <div className="space-y-4 text-sm font-medium text-zinc-400">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-zinc-500" />
                        <span>{client.weddingDate ? new Date(client.weddingDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date TBD'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-zinc-500" />
                        <span>{client.mapLocation || 'Location TBD'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6 md:border-l md:border-white/5 md:pl-8">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Key Personnel</h4>
                      <div className="flex flex-wrap gap-2">
                        {client.people?.map(p => (
                          <span key={p.id} className="px-3 py-1.5 bg-white/5 rounded-xl text-xs font-bold text-white uppercase tracking-wider border border-white/5 flex items-center gap-2">
                            <Users className="w-3 h-3 text-zinc-500" />
                            {p.name} ({p.role})
                          </span>
                        ))}
                      </div>
                    </div>
                    {client.notes && (
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Important Notes</h4>
                        <p className="text-sm text-zinc-300 leading-relaxed bg-black/30 p-4 rounded-xl border border-white/5">{client.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {(client.brideHomeAddress || client.groomHomeAddress || client.venueAddress || client.eventLogistics) && (
                <div className="glass-panel p-8 squircle-lg relative overflow-hidden group hover:border-blue-500/30 transition-all mt-6">
                  <div className="absolute top-0 right-0 p-8 opacity-5"><MapPin className="w-48 h-48" /></div>
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-lg text-xs font-bold uppercase tracking-widest mb-6">
                      Event Logistics
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {(client.brideHomeAddress || client.eventLogistics?.brideAddress) && (
                          <div>
                             <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Bride Location</h3>
                             <p className="text-sm text-zinc-300 leading-relaxed bg-black/30 p-4 rounded-xl border border-white/5">{client.brideHomeAddress || client.eventLogistics?.brideAddress}</p>
                          </div>
                       )}
                       {(client.groomHomeAddress || client.eventLogistics?.groomAddress) && (
                          <div>
                             <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Groom Location</h3>
                             <p className="text-sm text-zinc-300 leading-relaxed bg-black/30 p-4 rounded-xl border border-white/5">{client.groomHomeAddress || client.eventLogistics?.groomAddress}</p>
                          </div>
                       )}
                       {(client.venueAddress || client.eventLogistics?.venueAddress) && (
                          <div className="md:col-span-2">
                             <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Venue Location</h3>
                             <p className="text-sm text-zinc-300 leading-relaxed bg-black/30 p-4 rounded-xl border border-white/5">{client.venueAddress || client.eventLogistics?.venueAddress}</p>
                          </div>
                       )}
                    </div>
                  </div>
                </div>
              )}
           </>
        )}
      </div>
    </div>
  );
};

export default ClientEvents;
