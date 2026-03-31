import React, { useState, useEffect } from 'react';
import {
   LogOut, Image, Video, FileText, Calendar, Heart, ArrowRight,
   MessageSquare, FolderOpen, ExternalLink, X, Send
} from 'lucide-react';
import type { Client, CloudConfig, ClientRequirement } from '../types';
import { api } from '../services/api';

interface ClientExperienceProps {
   client: Client;
   loggedInPersonId?: string; // ID of the person who logged in
   onLogout: () => void;
   onUpdateClient: (updatedClient: Client) => void;
}

const ClientExperience: React.FC<ClientExperienceProps> = ({ client, loggedInPersonId, onLogout, onUpdateClient }) => {
   const [activeTab, setActiveTab] = useState<'work' | 'journey'>('work');
   const [isRequesting, setIsRequesting] = useState(false);
   const [requestText, setRequestText] = useState('');
   const [cloudConfig, setCloudConfig] = useState<CloudConfig | null>(null);

   const activePerson = client.people.find(p => p.id === loggedInPersonId) || client.people[0];

   useEffect(() => {
      api.getCloudConfig().then(setCloudConfig);
      // Fix: Added missing required actor properties for logging
      api.logActivity({
         action: `${activePerson.name} (${activePerson.role}) entered the ${client.projectName} portal`,
         type: 'Login',
         actorId: activePerson.id,
         actorName: activePerson.name,
         actorRole: 'Client',
         clientId: client.id,
         clientName: client.projectName
      });
   }, [client.id, client.projectName, activePerson.id, activePerson.name, activePerson.role]);

   const isWedding = client.brand === 'AAHA Kalyanam';
   const accentColor = isWedding ? 'text-yellow-500' : 'text-blue-500';
   const accentBg = isWedding ? 'bg-yellow-500/10' : 'bg-blue-500/10';
   const portal = client.portal || { timeline: [], deliverables: [] };

   const filteredDeliverables = portal.deliverables.filter(d => !d.assignedTo || d.assignedTo === activePerson.id);

   const handleSubmitRequest = () => {
      if (!requestText.trim()) return;
      const newReq: ClientRequirement = {
         id: Date.now().toString(),
         timestamp: new Date().toISOString(),
         text: `[From ${activePerson.name}]: ${requestText}`,
         status: 'Pending'
      };
      const updatedClient = {
         ...client,
         requirements: [...(client.requirements || []), newReq]
      };
      onUpdateClient(updatedClient);
      // Fix: Added missing required actor properties for logging
      api.logActivity({
         action: `${activePerson.name} submitted a requirement for ${client.projectName}`,
         type: 'RequirementAdded',
         actorId: activePerson.id,
         actorName: activePerson.name,
         actorRole: 'Client',
         clientId: client.id,
         clientName: client.projectName
      });
      setRequestText('');
      setIsRequesting(false);
   };

   const currentVault = cloudConfig?.vaults.find(v => v.id === client.vaultId);

   return (
      <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black overflow-x-hidden">
         <header className="fixed top-0 left-0 w-full p-8 z-50 flex justify-between items-center backdrop-blur-xl bg-black/40 border-b border-white/5">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white text-black squircle-sm flex items-center justify-center font-serif text-2xl font-black">A</div>
               <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] opacity-40">Project Hub • {client.id}</p>
                  <p className="text-lg font-black uppercase tracking-tight">{client.projectName}</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="hidden md:flex flex-col items-end mr-4">
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Logged in as</p>
                  <p className="text-xs font-bold text-white uppercase">{activePerson.name} ({activePerson.role})</p>
               </div>
               <button onClick={onLogout} className="p-3 rounded-2xl bg-white/5 text-zinc-500 hover:text-white transition-all active:scale-90"><LogOut className="w-5 h-5" /></button>
            </div>
         </header>

         <section className="pt-40 pb-20 px-8 max-w-[1200px] mx-auto animate-ios-slide-up">
            <div className="flex flex-col md:flex-row justify-between items-end gap-10">
               <div className="flex-1">
                  <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85] mb-6">
                     Hello,<br />{activePerson.name.split(' ')[0]}.
                  </h1>
                  <div className="flex flex-wrap gap-4">
                     <div className={`px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3 ${accentBg}`}>
                        <Calendar className={`w-4 h-4 ${accentColor}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{new Date(client.weddingDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                     </div>
                     {client.driveFolderId && (
                        <a
                           href={`https://drive.google.com/drive/folders/${client.driveFolderId}`}
                           target="_blank"
                           rel="noreferrer"
                           className="px-5 py-3 rounded-2xl border border-blue-500/20 flex items-center gap-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white ios-transition shadow-lg shadow-blue-500/10 group"
                        >
                           <FolderOpen className="w-4 h-4" />
                           <div className="text-left">
                              <span className="text-[10px] font-black uppercase tracking-widest block">Project Drive</span>
                              {currentVault && <span className="text-[8px] font-black uppercase opacity-50 block -mt-1">Vault: {currentVault.name}</span>}
                           </div>
                           <ExternalLink className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-100" />
                        </a>
                     )}
                  </div>
               </div>

               <button onClick={() => setIsRequesting(true)} className="glass-panel p-8 squircle-lg max-w-sm w-full text-left group hover:bg-white transition-all">
                  <div className="flex justify-between items-start mb-6">
                     <div className="p-4 rounded-2xl bg-white/5 group-hover:bg-black group-hover:text-white transition-all"><MessageSquare className="w-5 h-5" /></div>
                     <ArrowRight className="w-5 h-5 text-zinc-800 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-2 group-hover:text-zinc-400">Collaboration</p>
                  <h4 className="text-lg font-black uppercase group-hover:text-black">Post a Requirement</h4>
               </button>
            </div>
         </section>

         <div className="px-8 max-w-[1200px] mx-auto mb-12">
            <div className="bg-zinc-900/50 p-1.5 rounded-[1.5rem] border border-white/5 inline-flex gap-1">
               <button onClick={() => setActiveTab('work')} className={`px-8 py-3.5 text-[11px] font-black uppercase tracking-widest rounded-[1.1rem] transition-all ${activeTab === 'work' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white'}`}>Deliverables</button>
               <button onClick={() => setActiveTab('journey')} className={`px-8 py-3.5 text-[11px] font-black uppercase tracking-widest rounded-[1.1rem] transition-all ${activeTab === 'journey' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white'}`}>Milestones</button>
            </div>
         </div>

         <section className="px-8 max-w-[1200px] mx-auto pb-40">
            {activeTab === 'work' && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-ios-slide-up">
                  {filteredDeliverables.map((d) => (
                     <div key={d.id} className="glass-panel p-10 squircle-lg group hover:scale-[1.03] active:scale-[0.98] ios-transition relative overflow-hidden flex flex-col h-full">
                        <div className="mb-12 flex justify-between items-start">
                           <div className={`p-5 rounded-3xl ${accentBg} ${accentColor} ios-transition group-hover:bg-white group-hover:text-black shadow-lg`}>
                              {d.type === 'Video' ? <Video className="w-6 h-6" /> : d.type === 'Photos' ? <Image className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                           </div>
                           <a href={d.url} target="_blank" rel="noreferrer">
                              <ArrowRight className="w-5 h-5 text-zinc-800 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                           </a>
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight mb-1 group-hover:text-yellow-500 ios-transition">{d.title}</h3>
                        <div className="flex items-center justify-between mt-auto">
                           <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{d.type} Assets</p>
                           {d.assignedTo && <span className="text-[8px] font-black uppercase bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md border border-blue-500/20">Private for You</span>}
                        </div>
                     </div>
                  ))}
                  {filteredDeliverables.length === 0 && (
                     <div className="col-span-full py-20 text-center glass-panel border border-dashed rounded-[2rem]">
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-800">No assets tagged for you yet</p>
                     </div>
                  )}
               </div>
            )}

            {activeTab === 'journey' && (
               <div className="glass-panel p-12 squircle-lg animate-ios-slide-up max-w-2xl mx-auto">
                  <h2 className="text-2xl font-black uppercase tracking-widest mb-12 flex items-center gap-4"><Heart className="w-6 h-6 text-red-500 fill-red-500" /> Project Timeline</h2>
                  <div className="space-y-12 relative pl-8">
                     <div className="absolute left-[39px] top-2 bottom-2 w-px bg-white/5" />
                     {(portal.timeline || []).map((item) => (
                        <div key={item.id} className="relative flex gap-10 group">
                           <div className={`z-10 w-5 h-5 rounded-full mt-1.5 border-4 border-black transition-all ${item.status === 'Completed' ? 'bg-emerald-400' : 'bg-zinc-800'}`} />
                           <div>
                              <h4 className={`text-lg font-black uppercase tracking-tight ${item.status === 'Completed' ? 'text-emerald-400' : 'text-zinc-500'}`}>{item.title}</h4>
                              <p className="text-xs font-medium text-zinc-400 max-w-md leading-relaxed">{item.description}</p>
                              <span className="text-[9px] font-black text-zinc-700 mt-4 block uppercase tracking-[0.2em]">{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</span>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </section>

         {isRequesting && (
            <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-xl">
               <div className="bg-zinc-900 border border-white/10 squircle-lg w-full max-w-xl p-10 shadow-2xl animate-ios-slide-up">
                  <div className="flex justify-between items-center mb-10">
                     <h2 className="text-2xl font-black uppercase tracking-tight">Collaboration</h2>
                     <button onClick={() => setIsRequesting(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-6">
                     <textarea className="w-full bg-black border border-white/5 p-5 rounded-3xl text-sm font-medium text-white focus:border-blue-500/50 outline-none h-40 resize-none transition-colors" placeholder="Submit a request..." value={requestText} onChange={(e) => setRequestText(e.target.value)} />
                     <button onClick={handleSubmitRequest} disabled={!requestText.trim()} className="w-full py-4 bg-white text-black hover:bg-zinc-200 disabled:opacity-30 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl"><Send className="w-4 h-4" /> Submit</button>
                  </div>
               </div>
            </div>
         )}
         <footer className="py-20 text-center opacity-20"><p className="text-[10px] font-black uppercase tracking-[0.4em]">Handcrafted by Artisans Co. • 2025</p></footer>
      </div>
   );
};

export default ClientExperience;
