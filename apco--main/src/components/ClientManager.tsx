import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, UserPlus, X, Mail, Phone, User } from 'lucide-react';

interface Brand {
  _id: string;
  name: string;
}

interface ClientManagerProps {
  onOpenPortal?: (client: any) => void;
  clients?: any[];
  companies?: any[];
  addClient?: (client: any) => void;
  selectedBrand?: string | 'All';
}

const ClientManager: React.FC<ClientManagerProps> = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState('Wedding');

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/brands", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        let finalData: Brand[] = [];
        
        if (res.ok) {
           finalData = await res.json();
           console.log("Brands from DB:", finalData);
        }

        // AUTO-SEED / ADD IF MISSING
        const hasAaha = finalData.some((b: any) => b.name === 'AAHA Kalyanam');
        const hasTiny = finalData.some((b: any) => b.name === 'Tiny Toes');

        if (!hasAaha || !hasTiny) {
            if (token) {
                if (!hasAaha) {
                   const r = await fetch("http://localhost:5000/api/brands", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify({ name: "AAHA Kalyanam" }) });
                   if (r.ok) finalData.push(await r.json());
                }
                if (!hasTiny) {
                   const r = await fetch("http://localhost:5000/api/brands", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify({ name: "Tiny Toes" }) });
                   if (r.ok) finalData.push(await r.json());
                }
            }
        }
        
        // Final fallback if still empty or if API failed completely
        if (finalData.length === 0) {
            finalData = [
                { _id: 'fallback-1', name: 'AAHA Kalyanam' },
                { _id: 'fallback-2', name: 'Tiny Toes' }
            ];
        }

        setBrands(finalData);
        if (finalData.length > 0) {
           setSelectedBrandId(finalData[0]._id);
        }
      } catch (err) {
        console.error("Failed to fetch brands", err);
        // Emergency fallback
        setBrands([
          { _id: 'fallback-1', name: 'AAHA Kalyanam' },
          { _id: 'fallback-2', name: 'Tiny Toes' }
        ]);
        setSelectedBrandId('fallback-1');
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  const fetchClients = useCallback(async () => {
    if (!selectedBrandId) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/clients?brandId=${selectedBrandId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error("Failed to load clients");
      }
      const data = await res.json();
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching clients");
    } finally {
      setLoading(false);
    }
  }, [selectedBrandId]);

  useEffect(() => {
    if (selectedBrandId) {
      fetchClients();
    }
  }, [selectedBrandId, fetchClients]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrandId) {
      setFormError("Please select a brand");
      return;
    }
    if (!name) {
      setFormError("Name is required");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const requestBody = {
      name,
      email,
      phone,
      eventDate,
      eventType,
      brandId: selectedBrandId
    };

    console.log("Client Creation Request Body:", requestBody);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create client");
      }

      // Success! Clear form, close modal, refetch clients
      setName('');
      setEmail('');
      setPhone('');
      setEventDate('');
      setIsAdding(false);
      fetchClients();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error creating client");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = clients.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone || '').includes(searchTerm)
  );

  return (
    <div className="space-y-8 pb-24 animate-ios-slide-up">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">Directory</h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Client Database & Project Hub</p>
        </div>

        <div className="flex items-center gap-4">
          {brands.length > 0 && (
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="bg-zinc-900 border border-white/10 text-white rounded-xl px-4 py-3.5 text-[10px] font-black uppercase tracking-widest outline-none shadow-lg"
            >
              {brands.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
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
            Onboard Project
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

      {error && (
        <div className="text-red-500 bg-red-500/10 p-4 border border-red-500/20 rounded-xl text-center text-xs tracking-widest uppercase font-mono max-w-lg mx-auto">
          {error}
        </div>
      )}

      {!loading && !error && filteredClients.length === 0 && (
        <div className="text-zinc-500 text-center py-20 font-mono tracking-widest uppercase text-xs">
          No clients found for this brand.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div key={client._id} className="glass-panel p-10 squircle-lg ios-transition hover:scale-[1.02] active:scale-[0.98] group relative flex flex-col h-full border border-white/5 cursor-pointer" onClick={() => navigate(`/client/${client._id}`)}>
            <div className="flex justify-between items-start mb-8">
              <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[9px] font-black text-zinc-500 tracking-widest uppercase font-mono truncate max-w-[120px]">
                {client._id}
              </div>
            </div>

            <h3 className="font-black text-2xl text-white tracking-tight mb-2 uppercase leading-none truncate flex items-center gap-3">
              <User className="w-5 h-5 text-zinc-600" />
              {client.name}
            </h3>

            {client.brandId && client.brandId.name && (
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-8">{client.brandId.name}</p>
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
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                <span className="flex items-center gap-3">
                  <Calendar className="w-4 h-4" /> 
                  {client.eventDate ? new Date(client.eventDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'No Event Date'}
                </span>
              </div>
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
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Brand Context *</label>
                <select required className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white outline-none disabled:opacity-50" value={selectedBrandId} onChange={e => setSelectedBrandId(e.target.value)} disabled={isSubmitting}>
                  <option value="" disabled>Select a brand...</option>
                  {brands.map(b => <option key={b._id} className="bg-zinc-900" value={b._id}>{b.name}</option>)}
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
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Assignment Type *</label>
                <select className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none disabled:opacity-50" value={eventType} onChange={e => setEventType(e.target.value)} disabled={isSubmitting}>
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

