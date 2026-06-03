import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Calendar, UserPlus, X, Mail, Phone, User, Trash2, Edit2, ChevronDown, Briefcase, LayoutGrid, Loader2 } from 'lucide-react';

import { type Client, type Division } from '../types';

interface ClientManagerProps {
  clients: Client[];
  divisions: Division[];
  addClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  selectedDivisionId: string | 'All';
  userDivisionIds?: string[];
  onOpenPortal: (client: Client) => void;
  userRole?: string;
  userId?: string;
}

const ClientManager: React.FC<ClientManagerProps> = ({ clients: allClients, divisions, addClient, deleteClient, selectedDivisionId: preselectedId, userDivisionIds, onOpenPortal, userRole, userId }) => {
  const [selectedDivId, setSelectedDivId] = useState<string>('All');
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventDate: '',
    projectType: 'Wedding',
    projectId: '',
    projectName: '',
    locationType: '' as 'Bride' | 'Groom' | '',
    brideAddress: '',
    groomAddress: '',
    venueAddress: ''
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fadingId, setFadingId] = useState<string | null>(null);

  const [isDivDropdownOpen, setIsDivDropdownOpen] = useState(false);
  const [divSearch, setDivSearch] = useState('');
  const divRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (divRef.current && !divRef.current.contains(event.target as Node)) {
        setIsDivDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAdding || isDeleteModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAdding, isDeleteModalOpen]);

  useEffect(() => {
    const targetDiv = divisions.find(d => d.id === preselectedId);
    setFormData(prev => ({
      ...prev,
      projectId: preselectedId !== 'All' ? preselectedId : '',
      projectName: targetDiv?.name || ''
    }));
    if (preselectedId) setSelectedDivId(preselectedId);
    setLoading(false);
  }, [divisions, preselectedId]);



  const handleStartEdit = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      eventDate: client.eventDate || '',
      projectType: client.projectType || 'Wedding',
      projectId: client.divisionId || '',
      projectName: client.brand || '',
      locationType: client.eventLogistics?.locationType || '',
      brideAddress: client.eventLogistics?.brideAddress || '',
      groomAddress: client.eventLogistics?.groomAddress || '',
      venueAddress: client.eventLogistics?.venueAddress || ''
    });
    setIsEditing(true);
    setIsAdding(true);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("[DEBUG] formData.projectId before submit:", formData.projectId);

    if (!formData.projectId || formData.projectId === 'All') {
      setFormError("Please select a specific Project Registry");
      return;
    }
    if (!formData.name) {
      setFormError("Name is required");
      return;
    }
    if (formData.email) {
      const emailExists = allClients.some(c => 
        c.email?.toLowerCase() === formData.email.toLowerCase() && 
        (!isEditing || c.id !== editingClient?.id)
      );
      if (emailExists) {
        setFormError("Client email must be unique");
        return;
      }
    }

    setIsSubmitting(true);
    setFormError(null);

    const targetDiv = divisions.find(d => d.id === formData.projectId);

    const clientData: Client = {
      id: isEditing && editingClient ? editingClient.id : String(Date.now()),
      _id: isEditing && editingClient ? editingClient._id : `client-${Date.now()}`,
      projectName: formData.name,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      eventDate: formData.eventDate,
      projectType: formData.projectType,
      brand: targetDiv?.name || formData.projectName || 'Unknown',
      divisionId: formData.projectId,
      notes: editingClient?.notes || '',
      people: editingClient?.people || [],
      status: editingClient?.status || 'pending',
      createdAt: isEditing && editingClient ? editingClient.createdAt : new Date().toISOString(),
      eventLogistics: {
        locationType: (formData.locationType as 'Bride' | 'Groom') || undefined,
        brideAddress: formData.brideAddress,
        groomAddress: formData.groomAddress,
        venueAddress: formData.venueAddress
      }
    };

    try {
      await addClient(clientData);

      // Clear form and close modal
      setFormData({
        name: '',
        email: '',
        phone: '',
        eventDate: '',
        projectType: 'Wedding',
        projectId: preselectedId !== 'All' ? preselectedId : '',
        projectName: divisions.find(d => d.id === preselectedId)?.name || '',
        locationType: '',
        brideAddress: '',
        groomAddress: '',
        venueAddress: ''
      });
      setIsAdding(false);
      setIsEditing(false);
      setEditingClient(null);
    } catch (err) {
      setFormError("Failed to save data. Insufficient storage or permission issues.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    const targetId = clientToDelete.id;

    setIsDeleting(true);
    await new Promise(r => setTimeout(r, 150));

    setFadingId(targetId);
    setIsDeleteModalOpen(false);
    
    // Wait for fade-out animation
    await new Promise(r => setTimeout(r, 300));
    
    try {
      await deleteClient(targetId);
    } catch (err) {
      console.error("Deletion failure", err);
    } finally {
      setIsDeleting(false);
      setClientToDelete(null);
      setFadingId(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, client: Client) => {
    e.preventDefault();
    e.stopPropagation();
    setClientToDelete(client);
    setIsDeleteModalOpen(true);
  };

  const filteredClients = allClients.filter(c => {
    // SECURITY: If user is a Client, they can ONLY see their own card
    if (userRole === 'Client') {
      return String(c.id) === String(userId) || c.people?.some((p: any) => String(p.id) === String(userId));
    }

    if (userDivisionIds && userDivisionIds.length > 0) {
      if (!userDivisionIds.includes(c.divisionId || '')) return false;
    }
    if (selectedDivId !== 'All' && c.divisionId !== selectedDivId && c.brandId !== selectedDivId) return false;
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
          {userRole !== 'Client' && divisions.length > 0 && (
            <div className="relative" ref={divRef}>
              <button
                onMouseDown={(e) => { e.preventDefault(); setIsDivDropdownOpen(!isDivDropdownOpen); }}
                className="bg-zinc-900 border border-white/10 text-white rounded-xl px-5 py-3.5 text-[10px] font-black uppercase tracking-widest outline-none shadow-lg flex items-center gap-3 hover:bg-zinc-800 transition-all min-w-[200px]"
              >
                <Briefcase className="w-3 h-3 text-zinc-500" />
                <span className="flex-1 text-left">
                  {selectedDivId === 'All' ? 'All Projects' : (divisions.find(d => d.id === selectedDivId)?.name || 'Select Project')}
                </span>
                <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform duration-300 ${isDivDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDivDropdownOpen && (
                <div className="absolute top-full mt-2 right-0 md:left-0 w-64 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl z-[9999] overflow-hidden animate-ios-fade-in backdrop-blur-xl">
                   <div className="p-3 border-b border-white/5 bg-white/2">
                      <div className="relative">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600" />
                          <input 
                            type="text"
                            autoFocus
                            placeholder="Search registry..." 
                            className="w-full bg-black/50 border border-white/5 rounded-lg py-2 pl-9 pr-3 text-[10px] font-bold text-white outline-none focus:border-white/20"
                            value={divSearch}
                            onChange={(e) => setDivSearch(e.target.value)}
                          />
                      </div>
                   </div>
                   
                   <div className="max-h-60 overflow-y-auto p-1 no-scrollbar">
                      <div className="px-3 py-2 text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">Operational Projects</div>
                      
                      <button
                        onMouseDown={(e) => { e.preventDefault(); setSelectedDivId('All'); setIsDivDropdownOpen(false); setDivSearch(''); }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${selectedDivId === 'All' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-stone-400 hover:bg-white/5 hover:text-white'}`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        All Projects
                      </button>
                      
                      <div className="h-px bg-white/5 my-1 mx-2" />
                      
                      {divisions
                        .filter(d => d.name.toLowerCase().includes(divSearch.toLowerCase()))
                        .map(d => (
                          <button
                            key={d.id}
                            onMouseDown={(e) => { e.preventDefault(); setSelectedDivId(d.id); setIsDivDropdownOpen(false); setDivSearch(''); }}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${selectedDivId === d.id ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-stone-400 hover:bg-white/5 hover:text-white'}`}
                          >
                            <div className={`w-2 h-2 rounded-full ${selectedDivId === d.id ? 'bg-black' : 'bg-emerald-500'} opacity-50 shrink-0`} />
                            {d.name}
                          </button>
                        ))}

                      {divisions.filter(d => d.name.toLowerCase().includes(divSearch.toLowerCase())).length === 0 && (
                         <div className="p-4 text-center">
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">No Matches</p>
                         </div>
                      )}
                   </div>
                </div>
              )}
            </div>
          )}

          {userRole !== 'Client' && (
            <button
              onMouseDown={(e) => {
                 e.preventDefault();
                 setFormError(null);
                 setIsEditing(false);
                 setEditingClient(null);
                 setFormData({
                   name: '',
                   email: '',
                   phone: '',
                   eventDate: '',
                   projectType: 'Wedding',
                   projectId: preselectedId !== 'All' ? preselectedId : '',
                   projectName: divisions.find(d => d.id === preselectedId)?.name || '',
                   locationType: '',
                   brideAddress: '',
                   groomAddress: '',
                   venueAddress: ''
                 });
                 setIsAdding(true);
              }}
              className="bg-white text-black px-8 py-3.5 rounded-2xl flex items-center gap-3 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 ios-transition shadow-lg active:scale-95"
            >
              <UserPlus className="w-5 h-5" />
              Create Client
            </button>
          )}
        </div>
      </div>

      {userRole !== 'Client' && (
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 w-5 h-5 group-focus-within:text-white ios-transition" />
          <input
            type="text"
            placeholder="SEARCH CLIENTS, PROJECTS, OR IDS..."
            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-white focus:outline-none focus:border-white/10 transition-all placeholder:text-zinc-600 focus:bg-zinc-900 group-hover:border-white/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {loading && (
        <div className="text-zinc-400 text-center py-20 font-mono tracking-widest uppercase text-xs">
          Loading Clients...
        </div>
      )}

      {!loading && filteredClients.length === 0 && (
        <div className="text-zinc-500 text-center py-20 font-mono tracking-widest uppercase text-xs">
          Registry Empty • No Clients Mapping to Current Project
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className={`glass-panel p-10 squircle-lg ios-transition hover:scale-[1.02] active:scale-[0.98] group relative flex flex-col h-full border border-white/5 cursor-pointer ${fadingId === client.id ? 'animate-fade-out' : ''}`} onMouseDown={() => onOpenPortal(client)}>
            <div className="flex justify-between items-start mb-8">
              <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-xs font-black text-zinc-500 tracking-widest uppercase font-mono truncate max-w-[120px]">
                {client.id}
              </div>
              {userRole !== 'Client' && (
                <div className="flex gap-2">
                  <button 
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleStartEdit(e, client);
                     }}
                    className="p-2.5 bg-white/5 text-zinc-700 hover:text-white hover:bg-white/10 rounded-xl border border-white/5 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onMouseDown={(e) => handleDeleteClick(e, client)}
                    className="p-2.5 bg-white/5 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl border border-white/5 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <h3 className="font-bold text-2xl text-white tracking-tight mb-2 uppercase leading-none truncate flex items-center gap-3">
              <User className="w-5 h-5 text-zinc-600" />
              {client.projectName || client.name}
            </h3>

            {client.brand && (
              <p className="text-sm font-semibold uppercase tracking-wider text-zinc-600 mb-8 border-l-2 border-blue-600 pl-3">{client.brand}</p>
            )}

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-base text-gray-300 font-medium truncate">
                <Mail className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                <span className="truncate">{client.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-base text-gray-300 font-medium truncate">
                <Phone className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                <span>{client.phone || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/5 mt-auto">
              <div className="flex items-center justify-between text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">
                <span className="flex items-center gap-3">
                  <Calendar className="w-4 h-4" /> 
                  {client.eventDate ? new Date(client.eventDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'No Event Date'}
                </span>
                <span className="text-white font-semibold uppercase tracking-wider">{client.projectType}</span>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPortal(client);
                }}
                className="w-full py-3 bg-white/5 hover:bg-white text-zinc-400 hover:text-black rounded-xl border border-white/5 text-sm font-medium uppercase tracking-widest transition-all active:scale-95"
              >
                {userRole === 'Client' ? 'Open Workspace' : '+ Create Project'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {isAdding && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => {
            setIsAdding(false);
            setIsEditing(false);
            setEditingClient(null);
          }}
        >
          <div 
            className="w-full max-w-xl bg-zinc-900 border border-white/10 squircle-lg p-10 shadow-2xl animate-ios-slide-up max-h-[90vh] overflow-y-auto no-scrollbar relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">{isEditing ? 'Edit Client' : 'New Client'}</h2>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mt-1">{isEditing ? 'Profile Management' : 'Add New Client'}</p>
              </div>
              <button disabled={isSubmitting} onClick={() => {
                setIsAdding(false);
                setIsEditing(false);
                setEditingClient(null);
              }} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X className="w-6 h-6 text-zinc-400 hover:text-white" /></button>
            </div>

            {formError && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-[10px] uppercase tracking-widest font-mono text-center">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Assign to Project Registry *</label>
                {preselectedId !== 'All' ? (
                   <div className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-zinc-400 cursor-not-allowed">
                      {divisions.find(d => d.id === preselectedId)?.name || preselectedId}
                      <span className="ml-2 text-[8px] opacity-40">(Locked by Global Filter)</span>
                   </div>
                ) : (
                  <select 
                    className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white outline-none disabled:opacity-50" 
                    value={formData.projectId} 
                    onChange={e => {
                      const id = e.target.value;
                      const div = divisions.find(d => d.id === id);
                      setFormData(prev => ({ ...prev, projectId: id, projectName: div?.name || '' }));
                    }} 
                    disabled={isSubmitting}
                  >
                    <option value="" disabled>Select Unit...</option>
                    {divisions.map(d => <option key={d.id} className="bg-zinc-900" value={d.id}>{d.name}</option>)}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Client Name *</label>
                <input className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none disabled:opacity-50" placeholder="e.g. Rahul & Priya" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} disabled={isSubmitting} />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Email <span className="opacity-50">(Optional)</span></label>
                <input type="email" className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none disabled:opacity-50" placeholder="e.g. hello@example.com" value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} disabled={isSubmitting} />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Project Type *</label>
                <select className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none disabled:opacity-50" value={formData.projectType} onChange={e => setFormData(prev => ({ ...prev, projectType: e.target.value }))} disabled={isSubmitting}>
                  <option value="Wedding" className="bg-zinc-900">Luxury Wedding</option>
                  <option value="Kids" className="bg-zinc-900">Kids & Maternity</option>
                  <option value="Corporate" className="bg-zinc-900">Corporate Production</option>
                  <option value="Fashion" className="bg-zinc-900">Fashion Editorial</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Location Type <span className="opacity-50">(Optional)</span></label>
                <select className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none disabled:opacity-50" value={formData.locationType} onChange={e => setFormData(prev => ({ ...prev, locationType: e.target.value as any }))} disabled={isSubmitting}>
                  <option value="" className="bg-zinc-900">None</option>
                  <option value="Bride" className="bg-zinc-900">Bride</option>
                  <option value="Groom" className="bg-zinc-900">Groom</option>
                </select>
              </div>

              {formData.locationType === 'Bride' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Bride Home Address</label>
                    <textarea className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none disabled:opacity-50 min-h-[80px]" placeholder="Enter full address" value={formData.brideAddress} onChange={e => setFormData(prev => ({ ...prev, brideAddress: e.target.value }))} disabled={isSubmitting} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Venue Address</label>
                    <textarea className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none disabled:opacity-50 min-h-[80px]" placeholder="Enter venue address" value={formData.venueAddress} onChange={e => setFormData(prev => ({ ...prev, venueAddress: e.target.value }))} disabled={isSubmitting} />
                  </div>
                </>
              )}

              {formData.locationType === 'Groom' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Groom Home Address</label>
                    <textarea className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none disabled:opacity-50 min-h-[80px]" placeholder="Enter full address" value={formData.groomAddress} onChange={e => setFormData(prev => ({ ...prev, groomAddress: e.target.value }))} disabled={isSubmitting} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Venue Address</label>
                    <textarea className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none disabled:opacity-50 min-h-[80px]" placeholder="Enter venue address" value={formData.venueAddress} onChange={e => setFormData(prev => ({ ...prev, venueAddress: e.target.value }))} disabled={isSubmitting} />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Phone <span className="opacity-50">(Optional)</span></label>
                  <input className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none disabled:opacity-50" placeholder="+91 98765 43210" value={formData.phone} onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} disabled={isSubmitting} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Event Date <span className="opacity-50">(Optional)</span></label>
                  <input type="date" className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none disabled:opacity-50" value={formData.eventDate} onChange={e => setFormData(prev => ({ ...prev, eventDate: e.target.value }))} disabled={isSubmitting} />
                </div>
              </div>

              <div className="flex gap-4 pt-8 border-t border-white/5">
                <button type="button" disabled={isSubmitting} onClick={() => {
                  setIsAdding(false);
                  setIsEditing(false);
                  setEditingClient(null);
                }} className="flex-1 py-4 bg-white/5 text-zinc-500 hover:text-white squircle-sm font-black uppercase text-[11px] tracking-widest transition-all disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-white text-black hover:bg-zinc-200 squircle-sm font-black uppercase text-[11px] tracking-widest shadow-xl transition-all disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Client')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && clientToDelete && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] animate-modal-overlay"
          onMouseDown={() => { setIsDeleteModalOpen(false); setClientToDelete(null); }}
        >
          <div 
            className="bg-zinc-900 border border-white/10 rounded-[3rem] w-full max-w-[400px] p-12 shadow-2xl text-center animate-modal-content m-4"
            onMouseDown={e => e.stopPropagation()}
          >
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase mb-4">DELETE CLIENT?</h2>
            <p className="text-sm text-zinc-500 font-medium mb-10 pb-4 border-b border-white/5 leading-relaxed">
              Are you sure you want to delete <span className="text-white font-black">{clientToDelete.name}</span>? This cannot be undone.
            </p>

            <div className="flex gap-4">
              <button
                onMouseDown={() => {
                  setIsDeleteModalOpen(false);
                  setClientToDelete(null);
                }}
                className="flex-1 py-5 bg-white/5 text-zinc-500 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border border-white/5"
              >
                Cancel
              </button>
              <button
                onMouseDown={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-5 bg-red-600 text-white hover:bg-red-500 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                   <>
                     <Loader2 className="w-4 h-4 animate-spin-fast" />
                     Purging...
                   </>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ClientManager;
