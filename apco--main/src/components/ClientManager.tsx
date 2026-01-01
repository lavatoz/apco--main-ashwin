import React, { useState } from 'react';
import { Plus, Search, Phone, Mail, Calendar, Sparkles, FolderOpen } from 'lucide-react';
import { generateEmailDraft } from '../services/geminiService';
import type { Brand, Client } from '../types';

interface ClientManagerProps {
  clients: Client[];
  addClient: (client: Client) => void;
  selectedBrand: Brand | 'All';
  onOpenPortal: (client: Client) => void;
}

const ClientManager: React.FC<ClientManagerProps> = ({ clients, addClient, selectedBrand, onOpenPortal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client>>({ brand: 'Aaha Kalayanam' });
  const [generatedWelcome, setGeneratedWelcome] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = selectedBrand === 'All' || c.brand === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newClient.name && newClient.email && newClient.brand) {
      const client: Client = {
        id: Date.now().toString(),
        name: newClient.name!,
        email: newClient.email!,
        phone: newClient.phone || '+91 ',
        weddingDate: newClient.weddingDate || '',
        budget: newClient.budget || 0,
        notes: newClient.notes || '',
        brand: newClient.brand,
        portal: { timeline: [], deliverables: [], feedback: [] }
      };
      
      addClient(client);
      setLoadingAi(true);
      const email = await generateEmailDraft('welcome', client);
      setGeneratedWelcome(email);
      setLoadingAi(false);
      setIsAdding(false);
      setNewClient({ brand: 'Aaha Kalayanam' });
    }
  };

  // Theming
  const isBaby = selectedBrand === 'Tiny Toes';
  const textPrimary = isBaby ? 'text-slate-900' : 'text-zinc-100';
  const textSecondary = isBaby ? 'text-slate-500' : 'text-zinc-500';
  const inputBg = isBaby ? 'bg-white border-slate-200' : 'bg-black border-zinc-800 text-white';
  const cardBg = isBaby ? 'bg-white border-slate-100 hover:border-blue-200' : 'bg-zinc-900 border-zinc-800 hover:border-yellow-600/50';
  const accentColor = isBaby ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-yellow-600 hover:bg-yellow-700 text-black';

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h1 className={`text-2xl font-bold ${textPrimary}`}>Client Management</h1>
           <p className={textSecondary}>Manage clients for {selectedBrand === 'All' ? 'all brands' : selectedBrand}.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className={`${accentColor} px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors`}
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search clients..." 
          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-1 focus:ring-current focus:outline-none transition-shadow ${inputBg}`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map(client => (
          <div key={client.id} className={`${cardBg} p-6 rounded-xl shadow-sm border transition-all group relative overflow-hidden flex flex-col`}>
            {/* Brand indicator strip */}
            <div className={`absolute top-0 left-0 w-1 h-full ${client.brand === 'Aaha Kalayanam' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
            
            <div className="flex justify-between items-start mb-4 pl-2">
              <div>
                <h3 className={`font-bold text-lg ${textPrimary}`}>{client.name}</h3>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm ${client.brand === 'Aaha Kalayanam' ? 'bg-yellow-900/30 text-yellow-500' : 'bg-blue-50 text-blue-600'}`}>
                  {client.brand === 'Aaha Kalayanam' ? 'Wedding' : 'Baby'}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">Budget</p>
                <p className={`font-bold ${textPrimary}`}>₹{client.budget.toLocaleString('en-IN')}</p>
              </div>
            </div>
            
            <div className={`space-y-2 text-sm ${textSecondary} pl-2 flex-1`}>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 opacity-70" />
                <span>{client.weddingDate ? new Date(client.weddingDate).toLocaleDateString() : 'Date TBD'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 opacity-70" />
                <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a>
              </div>
               <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 opacity-70" />
                <span>{client.phone}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-dashed border-zinc-800 pl-2">
              <button 
                onClick={() => onOpenPortal(client)}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                  client.brand === 'Aaha Kalayanam' 
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                Open Project Portal
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Client Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 text-slate-900">
            <h2 className="text-xl font-bold mb-6">Add New Client</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 mb-4">
                 <label className="block text-xs font-medium text-slate-700 uppercase">Brand</label>
                 <div className="flex gap-4">
                    <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 has-[:checked]:border-yellow-500 has-[:checked]:bg-yellow-50">
                      <input 
                        type="radio" 
                        name="brand" 
                        value="Aaha Kalayanam" 
                        checked={newClient.brand === 'Aaha Kalayanam'}
                        onChange={e => setNewClient({...newClient, brand: e.target.value as Brand})}
                        className="text-yellow-600 focus:ring-yellow-500"
                      />
                      <div>
                        <span className="font-semibold block text-sm">Aaha Kalayanam</span>
                        <span className="text-xs text-slate-500">Weddings</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                      <input 
                        type="radio" 
                        name="brand" 
                        value="Tiny Toes" 
                        checked={newClient.brand === 'Tiny Toes'}
                        onChange={e => setNewClient({...newClient, brand: e.target.value as Brand})}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-semibold block text-sm">Tiny Toes</span>
                        <span className="text-xs text-slate-500">Kids Events</span>
                      </div>
                    </label>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-medium text-slate-700 uppercase mb-1">Name</label>
                   <input required className="w-full border p-2 rounded-lg" value={newClient.name || ''} onChange={e => setNewClient({...newClient, name: e.target.value})} />
                </div>
                <div>
                   <label className="block text-xs font-medium text-slate-700 uppercase mb-1">Budget (₹)</label>
                   <input type="number" className="w-full border p-2 rounded-lg" value={newClient.budget || ''} onChange={e => setNewClient({...newClient, budget: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                 <label className="block text-xs font-medium text-slate-700 uppercase mb-1">Email</label>
                 <input type="email" required className="w-full border p-2 rounded-lg" value={newClient.email || ''} onChange={e => setNewClient({...newClient, email: e.target.value})} />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-black text-white rounded-lg hover:bg-zinc-800 font-medium">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Welcome Email Modal */}
      {(generatedWelcome || loadingAi) && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
           <div className="bg-white rounded-xl w-full max-w-lg p-6 relative">
              {loadingAi ? (
                <div className="flex flex-col items-center py-8">
                  <Sparkles className="w-8 h-8 text-yellow-500 animate-spin mb-4" />
                  <p className="text-slate-600 font-medium">Generating Welcome Email...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4 text-yellow-600">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-bold">AI Suggested Welcome Email</h3>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap mb-4">
                    {generatedWelcome}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setGeneratedWelcome(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg">Close</button>
                    <button onClick={() => { navigator.clipboard.writeText(generatedWelcome || ''); setGeneratedWelcome(null); }} className="px-4 py-2 bg-black text-white rounded-lg hover:bg-zinc-800">Copy & Close</button>
                  </div>
                </>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default ClientManager;