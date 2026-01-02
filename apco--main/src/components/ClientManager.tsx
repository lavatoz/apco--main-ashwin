
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Phone, Mail, Calendar, FolderOpen, UserPlus, X, Sparkles, 
  ChevronRight, Users, ShieldCheck, Key, Database, HardDrive, MapPin, Map, Gift, User, Trash2
} from 'lucide-react';
import type { Client, Company, CloudConfig, Person } from '../types';
import { api } from '../services/api';

interface ClientManagerProps {
  clients: Client[];
  companies: Company[];
  addClient: (client: Client) => void;
  selectedBrand: string | 'All';
  onOpenPortal: (client: Client) => void;
}

const ClientManager: React.FC<ClientManagerProps> = ({ clients, companies, addClient, selectedBrand, onOpenPortal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [cloudConfig, setCloudConfig] = useState<CloudConfig | null>(null);
  
  const [newProject, setNewProject] = useState<Partial<Client>>({ 
    brand: companies[0]?.name || '',
    vaultId: '',
    people: []
  });

  const [tempPerson, setTempPerson] = useState<Partial<Person>>({ role: 'Groom' });

  useEffect(() => {
    api.getCloudConfig().then(setCloudConfig);
  }, [isAdding]);

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.projectName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.people.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone.includes(searchTerm));
    const matchesBrand = selectedBrand === 'All' || c.brand === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  const addPersonToProject = () => {
    if (!tempPerson.name || !tempPerson.loginId) return;
    const person: Person = {
      id: `UID-${Math.floor(1000 + Math.random() * 9000)}`,
      name: tempPerson.name,
      role: tempPerson.role as any || 'Other',
      email: tempPerson.email || '',
      phone: tempPerson.phone || '',
      alternatePhone: tempPerson.alternatePhone || '',
      loginId: tempPerson.loginId,
      password: tempPerson.password || 'welcome123',
      dateOfBirth: tempPerson.dateOfBirth
    };
    setNewProject({
      ...newProject,
      people: [...(newProject.people || []), person]
    });
    setTempPerson({ role: 'Groom', name: '', loginId: '', password: '' });
  };

  const removePersonFromProject = (idx: number) => {
    const updated = [...(newProject.people || [])];
    updated.splice(idx, 1);
    setNewProject({ ...newProject, people: updated });
  };

  const generateProjectName = () => {
    if (newProject.people && newProject.people.length >= 2) {
      setNewProject({ ...newProject, projectName: `${newProject.people[0].name} & ${newProject.people[1].name}` });
    } else if (newProject.people && newProject.people.length === 1) {
       setNewProject({ ...newProject, projectName: `${newProject.people[0].name}'s Event` });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProject.projectName && newProject.brand && newProject.people?.length) {
      addClient({
        id: `ART-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        projectName: newProject.projectName,
        people: newProject.people,
        address: newProject.address,
        mapLocation: newProject.mapLocation,
        weddingDate: newProject.weddingDate || '',
        budget: newProject.budget || 0,
        notes: newProject.notes || '',
        brand: newProject.brand,
        vaultId: newProject.vaultId,
        driveFolderId: newProject.driveFolderId,
        portal: { timeline: [], deliverables: [], internalSpends: [] }
      });
      setIsAdding(false);
      setNewProject({ brand: companies[0]?.name || '', vaultId: '', people: [] });
    }
  };

  return (
    <div className="space-y-8 pb-24 animate-ios-slide-up">
       <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
           <h1 className="text-4xl font-black text-white tracking-tight uppercase">Directory</h1>
           <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Client Database & Project Hub</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-white text-black px-8 py-3.5 rounded-2xl flex items-center gap-3 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 ios-transition shadow-2xl active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          Onboard Project
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 w-5 h-5 group-focus-within:text-white ios-transition" />
        <input 
          type="text" 
          placeholder="Search by name, ID or phone..." 
          className="w-full pl-16 pr-6 py-5 bg-zinc-900/80 border border-white/5 squircle-lg text-sm font-bold text-white focus:bg-zinc-900 outline-none ios-transition"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => {
          const co = companies.find(c => c.name === client.brand);
          return (
            <div key={client.id} className="glass-panel p-10 squircle-lg ios-transition hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden flex flex-col cursor-pointer h-full border border-white/5" onClick={() => onOpenPortal(client)}>
              <div className="absolute top-0 right-0 w-1.5 h-full opacity-60 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: co?.color || '#333' }} />
              
              <div className="flex justify-between items-start mb-8">
                <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[9px] font-black text-zinc-500 tracking-widest uppercase font-mono">
                  {client.id}
                </div>
                {client.mapLocation && (
                  <a href={client.mapLocation} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all">
                    <MapPin className="w-4 h-4" />
                  </a>
                )}
              </div>
              
              <h3 className="font-black text-2xl text-white tracking-tight mb-2 uppercase leading-none truncate">{client.projectName}</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-8">{client.brand}</p>

              <div className="flex -space-x-3 mb-8">
                 {client.people.map((p, i) => (
                   <div key={p.id} className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-[10px] font-black text-white shadow-lg" title={p.name}>
                      {p.name.charAt(0)}
                   </div>
                 ))}
                 <div className="w-10 h-10 rounded-full bg-white text-black border border-white/10 flex items-center justify-center text-[9px] font-black z-10">
                    {client.people.length}
                 </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5 mt-auto">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                  <span className="flex items-center gap-3"><Calendar className="w-4 h-4" /> {new Date(client.weddingDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 ios-transition text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-xl">
          <div className="bg-zinc-900 border border-white/10 squircle-lg w-full max-w-2xl p-10 shadow-2xl animate-ios-slide-up max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-10">
               <div>
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase">New Project</h2>
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mt-1">Client Onboarding Wizard</p>
               </div>
               <button onClick={() => setIsAdding(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Project Name (Display)</label>
                   <div className="flex gap-2">
                     <input required className="flex-1 bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none" placeholder="e.g. Rahul & Priya Wedding" value={newProject.projectName || ''} onChange={e => setNewProject({...newProject, projectName: e.target.value})} />
                     <button type="button" onClick={generateProjectName} className="px-4 bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all"><Sparkles className="w-5 h-5" /></button>
                   </div>
                </div>

                <div className="space-y-4 p-6 bg-black/40 rounded-3xl border border-white/5">
                   <h4 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> Account Members (Min 1)</h4>
                   
                   <div className="space-y-3 mb-6">
                      {(newProject.people || []).map((p, idx) => (
                        <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                           <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-white">{p.role.charAt(0)}</div>
                              <div>
                                 <p className="text-xs font-bold text-white">{p.name}</p>
                                 <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest font-mono">ID: {p.loginId}</p>
                              </div>
                           </div>
                           <button type="button" onClick={() => removePersonFromProject(idx)} className="text-zinc-800 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <input className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none" placeholder="Full Name" value={tempPerson.name || ''} onChange={e => setTempPerson({...tempPerson, name: e.target.value})} />
                      <select className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none" value={tempPerson.role} onChange={e => setTempPerson({...tempPerson, role: e.target.value as any})}>
                        <option value="Bride" className="bg-zinc-900">Bride</option>
                        <option value="Groom" className="bg-zinc-900">Groom</option>
                        <option value="Parent" className="bg-zinc-900">Parent</option>
                        <option value="Other" className="bg-zinc-900">Other</option>
                      </select>
                      <input className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none" placeholder="Login ID" value={tempPerson.loginId || ''} onChange={e => setTempPerson({...tempPerson, loginId: e.target.value})} />
                      <input className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none" placeholder="Password" value={tempPerson.password || ''} onChange={e => setTempPerson({...tempPerson, password: e.target.value})} />
                   </div>
                   <button type="button" onClick={addPersonToProject} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase text-zinc-400 tracking-widest mt-3 flex items-center justify-center gap-2 transition-all">
                      <Plus className="w-3.5 h-3.5" /> Add Member
                   </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Brand Division</label>
                      <select className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white outline-none" value={newProject.brand} onChange={e => setNewProject({...newProject, brand: e.target.value})}>
                         {companies.map(co => <option key={co.id} value={co.name} className="bg-zinc-900">{co.name}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Event Date</label>
                      <input type="date" required className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white outline-none" value={newProject.weddingDate || ''} onChange={e => setNewProject({...newProject, weddingDate: e.target.value})} />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Physical Address</label>
                   <textarea rows={2} className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white outline-none resize-none" placeholder="Primary delivery/event address" value={newProject.address || ''} onChange={e => setNewProject({...newProject, address: e.target.value})} />
                </div>
              </div>
              
              <div className="flex gap-4 pt-8 border-t border-white/5">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 bg-white/5 text-zinc-500 hover:text-white squircle-sm font-black uppercase text-[11px] tracking-widest transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-white text-black hover:bg-zinc-200 squircle-sm font-black uppercase text-[11px] tracking-widest shadow-xl transition-all">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManager;
