import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, UserPlus, X, Mail, Phone, User, Trash2 } from 'lucide-react';

import { type Client, type Division } from '../types';

interface ClientManagerProps {
  clients: Client[];
  divisions: Division[];
  addClient: (client: Client) => Promise<void>;
  selectedDivisionId: string | 'All';
  userDivisionIds?: string[];
  onOpenPortal: (client: Client) => void;
}

const ClientManager: React.FC<ClientManagerProps> = ({ clients: allClients, divisions, addClient, selectedDivisionId: preselectedId, userDivisionIds, onOpenPortal }) => {
  const navigate = useNavigate();
  const [selectedDivId, setSelectedDivId] = useState<string>('All');
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to absolute delete this client record? This action is irreversible.')) {
      const currentClients = JSON.parse(localStorage.getItem('clients') || '[]');
      const updated = currentClients.filter((c: any) => c.id !== id);
      localStorage.setItem('clients', JSON.stringify(updated));
      // Force UI update by reloading from storage or using any provided refresh mechanism
      window.location.reload(); 
    }
  };
  const [eventDate, setEventDate] = useState('');
  const [projectType, setProjectType] = useState('Wedding');

  useEffect(() => {
    if (preselectedId) setSelectedDivId(preselectedId);
    else if (divisions.length > 0) setSelectedDivId(divisions[0].id);
    setLoading(false);
  }, [divisions, preselectedId]);

  // Clients are now handled via allClients prop filtered by selectedBrandId if needed

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDivId || selectedDivId === 'All') {
      setFormError("Please select a specific Operational Division");
      return;
    }
    if (!name) {
      setFormError("Name is required");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const targetDiv = divisions.find(d => d.id === selectedDivId);

    const newClient: Client = {
      id: String(Date.now()),
      _id: `client-${Date.now()}`,
      projectName: name,
      name,
      email,
      phone,
      eventDate,
      projectType,
      brand: targetDiv?.name || 'Unknown',
      divisionId: selectedDivId,
      notes: '',
      people: [],
      status: 'pending'
    };

    try {
      await addClient(newClient);

      // Clear form and close modal
      setName('');
      setEmail('');
      setPhone('');
      setEventDate('');
      setProjectType('Wedding');
      setIsAdding(false);
    } catch (err) {
      setFormError("Failed to save data. Insufficient storage or permission issues.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = allClients.filter(c => {
    // 1. Division Access Control (Prop based)
    if (userDivisionIds && userDivisionIds.length > 0) {
      if (!userDivisionIds.includes(c.divisionId || '')) return false;
    }

    // 2. Local Filtering (Dropdown based)
    if (selectedDivId !== 'All' && c.divisionId !== selectedDivId && c.brandId !== selectedDivId) return false;

    // 3. Search Term
    return (
      (c.projectName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone || '').includes(searchTerm)
    );
  });

  return (
    <div className="space-y-8 pb-24 animate-ios-slide-up">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">Directory</h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Client Database & Project Hub</p>
        </div>

        <div className="flex items-center gap-4">
          {divisions.length > 0 && (
            <select
              value={selectedDivId}
              onChange={(e) => setSelectedDivId(e.target.value)}
              className="bg-zinc-900 border border-white/10 text-white rounded-xl px-4 py-3.5 text-[10px] font-black uppercase tracking-widest outline-none shadow-lg"
            >
              <option value="All">All Restricted Divisions</option>
              {divisions.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => {
               setFormError(null);
               setIsAdding(true);
            }}
            className="bg-white text-black px-8 py-3.5 rounded-2xl flex items-center gap-3 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 ios-transition shadow-lg active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
            Create Client
          </button>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 w-5 h-5 group-focus-within:text-white ios-transition" />
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          className="w-full pl-16 pr-6 py-5 bg-zinc-900/80 border border-white/5 squircle-lg text-sm font-bold text-white focus:bg-zinc-900 outline-none ios-transition"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && (
        <div className="text-zinc-400 text-center py-20 font-mono tracking-widest uppercase text-xs">
          Loading Clients...
        </div>
      )}


      {!loading && filteredClients.length === 0 && (
        <div className="text-zinc-500 text-center py-20 font-mono tracking-widest uppercase text-xs">
          Registry Empty • No Clients Mapping to Current Division
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className="glass-panel p-10 squircle-lg ios-transition hover:scale-[1.02] active:scale-[0.98] group relative flex flex-col h-full border border-white/5 cursor-pointer" onClick={() => navigate(`/client/${client.id}`)}>
            <div className="flex justify-between items-start mb-8">
              <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[9px] font-black text-zinc-500 tracking-widest uppercase font-mono truncate max-w-[120px]">
                {client.id}
              </div>
              <button 
                onClick={(e) => handleDelete(e, client.id)}
                className="p-2.5 bg-white/5 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl border border-white/5 transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <h3 className="font-black text-2xl text-white tracking-tight mb-2 uppercase leading-none truncate flex items-center gap-3">
              <User className="w-5 h-5 text-zinc-600" />
              {client.projectName || client.name}
            </h3>

            {client.brand && (
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-8 border-l-2 border-blue-600 pl-3">{client.brand}</p>
            )}

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-sm text-zinc-400 font-medium truncate">
                <Mail className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                <span className="truncate">{client.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-400 font-medium truncate">
                <Phone className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                <span>{client.phone || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/5 mt-auto">
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-6">
                <span className="flex items-center gap-3">
                  <Calendar className="w-4 h-4" /> 
                  {client.eventDate ? new Date(client.eventDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'No Event Date'}
                </span>
                <span className="text-white">{client.projectType}</span>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPortal(client);
                }}
                className="w-full py-3 bg-white/5 hover:bg-white text-zinc-400 hover:text-black rounded-xl border border-white/5 text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                + Create Project
              </button>
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-xl">
          <div className="bg-zinc-900 border border-white/10 squircle-lg w-full max-w-xl p-10 shadow-2xl animate-ios-slide-up max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">New Project</h2>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mt-1">Client Onboarding</p>
              </div>
              <button disabled={isSubmitting} onClick={() => setIsAdding(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X className="w-6 h-6 text-zinc-400 hover:text-white" /></button>
            </div>

            {formError && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-[10px] uppercase tracking-widest font-mono text-center">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Establish Operational Division *</label>
                <select required className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white outline-none disabled:opacity-50" value={selectedDivId} onChange={e => setSelectedDivId(e.target.value)} disabled={isSubmitting}>
                  <option value="" disabled>Select Unit...</option>
                  {divisions.map(d => <option key={d.id} className="bg-zinc-900" value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Client Name *</label>
                <input required className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none disabled:opacity-50" placeholder="e.g. Rahul & Priya" value={name} onChange={e => setName(e.target.value)} disabled={isSubmitting} />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Email <span className="opacity-50">(Optional)</span></label>
                <input type="email" className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none disabled:opacity-50" placeholder="e.g. hello@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={isSubmitting} />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Project Type *</label>
                <select className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none disabled:opacity-50" value={projectType} onChange={e => setProjectType(e.target.value)} disabled={isSubmitting}>
                  <option value="Wedding" className="bg-zinc-900">Luxury Wedding</option>
                  <option value="Kids" className="bg-zinc-900">Kids & Maternity</option>
                  <option value="Corporate" className="bg-zinc-900">Corporate Production</option>
                  <option value="Fashion" className="bg-zinc-900">Fashion Editorial</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Phone <span className="opacity-50">(Optional)</span></label>
                  <input className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none disabled:opacity-50" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} disabled={isSubmitting} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Event Date <span className="opacity-50">(Optional)</span></label>
                  <input type="date" className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none disabled:opacity-50" value={eventDate} onChange={e => setEventDate(e.target.value)} disabled={isSubmitting} />
                </div>
              </div>

              <div className="flex gap-4 pt-8 border-t border-white/5">
                <button type="button" disabled={isSubmitting} onClick={() => setIsAdding(false)} className="flex-1 py-4 bg-white/5 text-zinc-500 hover:text-white squircle-sm font-black uppercase text-[11px] tracking-widest transition-all disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-white text-black hover:bg-zinc-200 squircle-sm font-black uppercase text-[11px] tracking-widest shadow-xl transition-all disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManager;
