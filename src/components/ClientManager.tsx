import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Calendar, UserPlus, Mail, Phone, User, Trash2, Edit2, ChevronDown, Briefcase, LayoutGrid, Loader2 } from 'lucide-react';

import { type Client, type Division } from '../types';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { getDisplayId } from '../utils/displayId';
import ClientModal from './ClientModal';

interface ClientManagerProps {
  clients: Client[];
  divisions: Division[];
  addClient: (client: Client) => Promise<any>;
  deleteClient: (id: string) => Promise<void>;
  selectedDivisionId: string | 'All';
  userDivisionIds?: string[];
  onOpenPortal: (client: Client) => void;
  userRole?: string;
  userId?: string;
}

const ClientManager: React.FC<ClientManagerProps> = ({ clients: allClients, divisions, addClient, deleteClient, selectedDivisionId: preselectedId, userDivisionIds, onOpenPortal, userRole, userId }) => {
  const { companies } = useCompanySettings();
  const [selectedDivId, setSelectedDivId] = useState<string>('All');

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Editing State
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form State
  const [isAdding, setIsAdding] = useState(false);

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
    if (preselectedId) setSelectedDivId(preselectedId);
    setLoading(false);
  }, [companies, preselectedId]);

  const handleStartEdit = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setEditingClient(client);
    setIsAdding(true);
  };

  // Unified client creation/editing is handled by ClientModal component

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
    if (selectedDivId !== 'All') {
      const selectedDivision = divisions.find(d => d.id === selectedDivId);
      const selectedCompany = companies.find(comp => comp.id === selectedDivId);
      const selectedName = (selectedDivision?.name || selectedCompany?.companyName)?.trim().toLowerCase();
      const clientCompany = (c.companyName || '').trim().toLowerCase();
      const clientBrand = (c.brand || '').trim().toLowerCase();

      const matchesDivision =
        c.divisionId === selectedDivId ||
        c.brandId === selectedDivId ||
        c.companyId === selectedDivId;

      const matchesName =
        (selectedName && clientCompany === selectedName) ||
        (selectedName && clientBrand === selectedName);

      if (!matchesDivision && !matchesName) {
        return false;
      }
    }
    return (
      (c.projectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone || '').includes(searchTerm) ||
      (c.clientCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.id || '').toLowerCase().includes(searchTerm.toLowerCase())
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
                <div className="absolute top-full mt-2 right-0 md:left-0 w-64 glass-panel rounded-2xl shadow-2xl z-[9999] overflow-hidden animate-ios-fade-in backdrop-blur-xl">
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
                          <div className={`w-2 h-2 rounded-full ${selectedDivId === d.id ? 'bg-black' : 'bg-primary'} opacity-50 shrink-0`} />
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
                setEditingClient(null);
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
          <div key={client.id} className={`glass-panel p-6 md:p-10 squircle-lg ios-transition hover:scale-[1.02] active:scale-[0.98] group relative flex flex-col h-full border border-white/5 cursor-pointer ${fadingId === client.id ? 'animate-fade-out' : ''}`} onMouseDown={() => onOpenPortal(client)}>
            <div className="flex justify-between items-start mb-6 md:mb-8">
              <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-xs font-black text-zinc-500 tracking-widest uppercase font-mono truncate max-w-[120px]">
                {getDisplayId(client.clientCode, client.id)}
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
              <p className="text-sm font-semibold uppercase tracking-wider text-zinc-600 mb-6 md:mb-8 border-l-2 border-blue-600 pl-3">{client.brand}</p>
            )}

            <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
              <div className="flex items-center gap-3 text-base text-gray-300 font-medium truncate">
                <Mail className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                <span className="truncate">{client.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-base text-gray-300 font-medium truncate">
                <Phone className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                <span>{client.phone || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4 pt-4 md:pt-6 border-t border-white/5 mt-auto">
              <div className="flex items-center justify-between text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 md:mb-6">
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

      <ClientModal
        isOpen={isAdding}
        onClose={() => { setIsAdding(false); setEditingClient(null); }}
        onSubmit={addClient}
        companies={companies}
        clients={allClients}
        initialClient={editingClient}
        preselectedBrandId={selectedDivId}
      />
      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && clientToDelete && createPortal(
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] animate-modal-overlay"
          onMouseDown={() => { setIsDeleteModalOpen(false); setClientToDelete(null); }}
        >
          <div
            className="bg-zinc-900 border border-white/10 rounded-3xl md:rounded-[3rem] w-full max-w-[400px] p-6 md:p-12 shadow-2xl text-center animate-modal-content m-4"
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


