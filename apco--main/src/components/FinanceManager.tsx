
import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, FileText, Clock, X, Tag, Calculator, FileQuestion, ChevronRight, ArrowUpRight
} from 'lucide-react';
import { type Invoice, type Client, type Company, type Project, type InvoiceItem } from '../types';

interface FinanceManagerProps {
  invoices: Invoice[];
  clients: Client[];
  companies: Company[];
  updateInvoiceStatus: (id: string, status: string) => void;
  selectedBrand: string | 'All';
  userRole: 'Admin' | 'Staff' | 'Client' | 'none';
}

const FinanceManager: React.FC<FinanceManagerProps> = ({
  companies, updateInvoiceStatus,
  selectedBrand, userRole
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unpaid' | 'paid' | 'quotation'>('all');
  const [isCreating, setIsCreating] = useState(false);
  
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  
  const [newInvoice, setNewInvoice] = useState<{ isQuotation: boolean }>({ isQuotation: false });
  const [items, setItems] = useState<InvoiceItem[]>([{ id: '1', description: '', quantity: 1, price: 0 }]);

  const fetchInvoices = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/finance/invoices`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        console.log("Data (Invoices):", data);
        setInvoices(data || []);
      }
    } catch (err) {
      console.error("Failed to load invoices", err);
    }
  }, []);

  const fetchClientsAndProjects = useCallback(async () => {
      try {
        const token = localStorage.getItem("token");
        const [clientRes, projectRes] = await Promise.all([
            fetch("http://localhost:5000/api/clients", { headers: { "Authorization": `Bearer ${token}` }}),
            fetch("http://localhost:5000/api/projects", { headers: { "Authorization": `Bearer ${token}` }})
        ]);
        
        if (clientRes.ok) setClients(await clientRes.json());
        if (projectRes.ok) setProjects(await projectRes.json());
      } catch (err) {
        console.error("Failed to load data", err);
      }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchClientsAndProjects();
  }, [fetchInvoices, fetchClientsAndProjects]);

  const calculateTotal = (invoiceItems: InvoiceItem[]) => invoiceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const displayInvoices = invoices.filter(item => {
    const brandMatch = selectedBrand === 'All' || (item.brandId as any)?.name === selectedBrand || (item as any).brand === selectedBrand;
    if (!brandMatch) return false;

    if (activeTab === 'all') return true;
    
    // Requirement 4: item.status?.toLowerCase() === selectedTab.toLowerCase()
    const status = (item.status || '').toLowerCase();
    const type = (item.type || '').toLowerCase();

    if (activeTab === 'quotation') return type === 'quotation';
    return status === activeTab;
  });

  const totalRevenue = displayInvoices.reduce((s, i) => s + (i.amount || 0), 0);
  const unpaidTotal = invoices.filter(i => i.status === 'unpaid').reduce((s, i) => s + (i.amount || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClientId && selectedProjectId) {
      const client = clients.find(c => c._id === selectedClientId);
      const project = projects.find(p => p._id === selectedProjectId);
      if (!client || !project) return;

      console.log("ID (Client):", selectedClientId);
      console.log("ID (Project):", selectedProjectId);

      const isQuote = newInvoice.isQuotation || false;
      const createdInvoice = {
        client: selectedClientId,
        project: selectedProjectId,
        amount: calculateTotal(items),
        status: isQuote ? 'unpaid' : 'unpaid', // Default is unpaid as per requirement 3
        type: isQuote ? 'quotation' : 'invoice',
        brandId: selectedBrandId || (client as any).brandId?._id || client.brandId || companies[0]?.id
      };

      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/finance/invoices", {
            method: 'POST',
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(createdInvoice)
        });
        
        if (res.ok) {
            const data = await res.json();
            console.log("Data (Created Invoice):", data);
            setInvoices(prev => [...prev, data]);
            setIsCreating(false);
            setItems([{ id: '1', description: '', quantity: 1, price: 0 }]);
            setSelectedClientId('');
            setSelectedProjectId('');
            setSelectedBrandId('');
        }
      } catch (err) {
        console.error("Error creating invoice", err);
      }
    }
  };

  return (
    <div className="space-y-10 animate-ios-slide-up pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Ledger</h1>
          <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] mt-1">Financial Operations & Billing</p>
        </div>
      </div>

      {userRole === 'Admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-8 squircle-lg bg-blue-600/5 border-blue-500/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 shadow-lg shadow-blue-500/10"><ArrowUpRight className="w-5 h-5" /></div>
              <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest px-3 py-1 bg-blue-500/10 rounded-lg">Total Revenue</span>
            </div>
            <h3 className="text-5xl font-black text-white tracking-tighter font-mono">₹{(totalRevenue / 100000).toFixed(2)}L</h3>
            <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest mt-2">Sum of all bills</p>
          </div>
          <div className="glass-panel p-8 squircle-lg bg-amber-600/5 border-amber-500/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 shadow-lg shadow-amber-500/10"><Clock className="w-5 h-5" /></div>
              <span className="text-[9px] font-black uppercase text-amber-400 tracking-widest px-3 py-1 bg-amber-500/10 rounded-lg">Unpaid</span>
            </div>
            <h3 className="text-5xl font-black text-white tracking-tighter font-mono">₹{(unpaidTotal / 100000).toFixed(2)}L</h3>
            <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest mt-2">Accounts Receivable</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-6">
          <div className="flex bg-zinc-900/50 p-1.5 rounded-[1.2rem] border border-white/5 overflow-x-auto max-w-full">
            {['all', 'unpaid', 'paid', 'quotation'].map(t => (
              <button
                key={t} onClick={() => setActiveTab(t as any)}
                className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${activeTab === t ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
             <button onClick={() => setIsCreating(true)} className="bg-white text-black px-6 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-xl active:scale-95 whitespace-nowrap">
                <Plus className="w-4 h-4" /> Create Invoice
              </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
            {displayInvoices.length > 0 ? (
                displayInvoices.map(inv => (
                    <div key={inv._id} className="glass-panel p-8 squircle-lg flex flex-col md:flex-row justify-between items-start md:items-center group hover:bg-white/5 transition-all border border-white/5 relative overflow-hidden">
                      <div className="flex items-center gap-6 mb-6 md:mb-0">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${inv.type === 'quotation' ? 'bg-zinc-800 border-white/10 text-zinc-400' : (inv.status || '').toLowerCase() === 'paid' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                          {inv.type === 'quotation' ? <FileQuestion className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                        </div>
                        <div>
                          <h4 className="font-black text-lg uppercase tracking-tight text-white">{inv.client?.name || 'Unknown Client'}</h4>
                          <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest mt-1.5 flex items-center gap-2">
                            <Tag className="w-3 h-3" /> {inv.project?.name || 'No Project'} • {new Date(inv.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="w-full md:w-auto flex justify-between md:justify-end items-center gap-8 border-t md:border-t-0 pt-6 md:pt-0 border-white/5">
                        <div className="text-left md:text-right">
                          <p className="text-xl font-black text-white tracking-tight font-mono">₹{inv.amount?.toLocaleString('en-IN')}</p>
                          <p className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1 ${(inv.status || '').toLowerCase() === 'paid' ? 'text-emerald-500' : inv.type === 'quotation' ? 'text-zinc-500' : 'text-amber-500'}`}>
                            {inv.status}
                          </p>
                        </div>
                        <button
                          onClick={() => inv.type !== 'quotation' && updateInvoiceStatus(inv._id, inv.status === 'paid' ? 'unpaid' : 'paid')}
                          disabled={inv.type === 'quotation'}
                          className={`p-3.5 rounded-xl transition-all ${inv.type === 'quotation' ? 'bg-transparent text-zinc-700 cursor-default' : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'}`}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                ))
            ) : (
                <div className="py-24 text-center glass-panel rounded-[2rem] border-dashed border-zinc-800 flex flex-col items-center justify-center">
                    <div className="p-4 rounded-full bg-zinc-900 mb-4"><Calculator className="w-8 h-8 text-zinc-700" /></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">LEDGER EMPTY</p>
                </div>
            )}
        </div>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-xl">
          <div className="bg-zinc-900 border border-white/10 squircle-lg w-full max-w-2xl p-10 shadow-2xl animate-ios-slide-up max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">New Entry</h2>
              <button onClick={() => setIsCreating(false)} className="p-2 bg-white/5 rounded-full"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Select Brand</label>
                  <select required className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none" value={selectedBrandId} onChange={e => setSelectedBrandId(e.target.value)}>
                    <option value="">Choose Brand...</option>
                    {companies.map(brand => (
                      <option key={brand.id || (brand as any)._id} value={brand.id || (brand as any)._id}>{brand.name}</option>
                    ))}
                  </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Select Client</label>
                  <select required className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none" value={selectedClientId} onChange={e => { setSelectedClientId(e.target.value); setSelectedProjectId(''); }}>
                    <option value="">Choose Client...</option>
                    {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Select Project</label>
                  <select required className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
                    <option value="">Choose Project...</option>
                    {projects.filter(p => (p.client as any)._id === selectedClientId || p.client === selectedClientId).map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Document Type</label>
                  <div className="flex bg-black p-1 rounded-xl border border-white/10">
                    <button type="button" onClick={() => setNewInvoice({ ...newInvoice, isQuotation: false })} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!newInvoice.isQuotation ? 'bg-white text-black' : 'text-zinc-500'}`}>Invoice</button>
                    <button type="button" onClick={() => setNewInvoice({ ...newInvoice, isQuotation: true })} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${newInvoice.isQuotation ? 'bg-white text-black' : 'text-zinc-500'}`}>Quotation</button>
                  </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Items</label>
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <input className="flex-[2] bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none" placeholder="Description" value={item.description} onChange={e => { const n = [...items]; n[idx].description = e.target.value; setItems(n); }} />
                    <input type="number" className="w-20 bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none text-center" placeholder="Qty" value={item.quantity} onChange={e => { const n = [...items]; n[idx].quantity = Number(e.target.value); setItems(n); }} />
                    <input type="number" className="w-32 bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none text-right" placeholder="Price" value={item.price} onChange={e => { const n = [...items]; n[idx].price = Number(e.target.value); setItems(n); }} />
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Total</p>
                  <p className="text-3xl font-black text-white font-mono mt-1">₹{calculateTotal(items).toLocaleString('en-IN')}</p>
                </div>
                <button type="submit" className="bg-white text-black px-8 py-4 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-zinc-200 transition-all">
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceManager;
