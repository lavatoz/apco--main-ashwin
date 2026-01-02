
import React, { useState } from 'react';
import { 
  Plus, Trash2, FileText, Send, CheckCircle2, Clock, 
  IndianRupee, TrendingUp, TrendingDown, Wallet, Briefcase, Printer, Share2, X, ArrowRightLeft, Sparkles, ChevronRight, Eye, ShieldCheck, 
  Lock, User, Layers, Info, CheckCircle, Calculator, Tag, CreditCard, Layout, ArrowUpRight, ArrowDownRight, FileQuestion
} from 'lucide-react';
import { type Invoice, type Expense, type Client, type Company, InvoiceStatus, type InvoiceItem } from '../types';

interface FinanceManagerProps {
  invoices: Invoice[];
  expenses: Expense[];
  clients: Client[];
  companies: Company[];
  addInvoice: (invoice: Invoice) => void;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;
  addExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  selectedBrand: string | 'All';
  userRole: 'Admin' | 'Staff' | 'Client' | 'none';
}

const FinanceManager: React.FC<FinanceManagerProps> = ({ 
  invoices, expenses, clients, companies, addInvoice, updateInvoiceStatus, 
  addExpense, deleteExpense, selectedBrand, userRole 
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unpaid' | 'paid' | 'quotes'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [newInvoice, setNewInvoice] = useState<{ clientId: string, isQuotation: boolean }>({ clientId: '', isQuotation: false });
  const [items, setItems] = useState<InvoiceItem[]>([{ id: '1', description: '', quantity: 1, price: 0, costPrice: 0 }]);
  
  const calculateTotal = (items: InvoiceItem[]) => items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const filteredInvoices = invoices.filter(i => {
    const brandMatch = selectedBrand === 'All' || i.brand === selectedBrand;
    if (activeTab === 'quotes') return brandMatch && i.isQuotation;
    return brandMatch && !i.isQuotation;
  });
  
  const displayInvoices = filteredInvoices.filter(inv => {
    if (activeTab === 'paid') return inv.status === InvoiceStatus.Paid;
    if (activeTab === 'unpaid') return inv.status !== InvoiceStatus.Paid;
    return true;
  });

  const totalRevenue = invoices.filter(i => !i.isQuotation).reduce((s, i) => s + calculateTotal(i.items), 0);
  const pendingRevenue = invoices.filter(i => !i.isQuotation && i.status !== InvoiceStatus.Paid).reduce((s, i) => s + calculateTotal(i.items), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.clientId) return;
    const client = clients.find(c => c.id === newInvoice.clientId);
    if (!client) return;

    addInvoice({
      id: `INV-${Date.now().toString().slice(-6)}`,
      clientId: newInvoice.clientId,
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      items: items,
      status: newInvoice.isQuotation ? InvoiceStatus.Quotation : InvoiceStatus.Unpaid,
      brand: client.brand,
      isQuotation: newInvoice.isQuotation
    });
    setIsCreating(false);
    setItems([{ id: '1', description: '', quantity: 1, price: 0, costPrice: 0 }]);
    setNewInvoice({ clientId: '', isQuotation: false });
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
                 <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest px-3 py-1 bg-blue-500/10 rounded-lg">Gross Volume</span>
              </div>
              <h3 className="text-5xl font-black text-white tracking-tighter font-mono">₹{(totalRevenue/100000).toFixed(2)}L</h3>
              <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest mt-2">Lifetime Revenue</p>
           </div>
           <div className="glass-panel p-8 squircle-lg bg-amber-600/5 border-amber-500/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />
              <div className="flex justify-between items-start mb-8 relative z-10">
                 <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 shadow-lg shadow-amber-500/10"><Clock className="w-5 h-5" /></div>
                 <span className="text-[9px] font-black uppercase text-amber-400 tracking-widest px-3 py-1 bg-amber-500/10 rounded-lg">Pending</span>
              </div>
              <h3 className="text-5xl font-black text-white tracking-tighter font-mono">₹{(pendingRevenue/100000).toFixed(2)}L</h3>
              <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest mt-2">Accounts Receivable</p>
           </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-6">
           <div className="flex bg-zinc-900/50 p-1.5 rounded-[1.2rem] border border-white/5 overflow-x-auto max-w-full">
             {['all', 'unpaid', 'paid', 'quotes'].map(t => (
               <button 
                 key={t} onClick={() => setActiveTab(t as any)}
                 className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${activeTab === t ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
               >
                 {t === 'quotes' ? 'Quotations' : t}
               </button>
             ))}
           </div>
           <button onClick={() => setIsCreating(true)} className="bg-white text-black px-6 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-xl active:scale-95 whitespace-nowrap">
             <Plus className="w-4 h-4" /> Create Bill / Quote
           </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {displayInvoices.map(inv => {
            const client = clients.find(c => c.id === inv.clientId);
            return (
              <div key={inv.id} className="glass-panel p-8 squircle-lg flex flex-col md:flex-row justify-between items-start md:items-center group hover:bg-white/5 transition-all border border-white/5 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-1.5 h-full opacity-30" style={{ backgroundColor: companies.find(co => co.name === inv.brand)?.color || '#333' }} />
                 
                 <div className="flex items-center gap-6 mb-6 md:mb-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${inv.isQuotation ? 'bg-zinc-800 border-white/10 text-zinc-400' : inv.status === InvoiceStatus.Paid ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                      {inv.isQuotation ? <FileQuestion className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="font-black text-lg uppercase tracking-tight text-white">{client?.projectName || 'Unknown Client'}</h4>
                      <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest mt-1.5 flex items-center gap-2">
                        <Tag className="w-3 h-3" /> {inv.id} • {inv.brand}
                      </p>
                    </div>
                 </div>
                 
                 <div className="w-full md:w-auto flex justify-between md:justify-end items-center gap-8 border-t md:border-t-0 pt-6 md:pt-0 border-white/5">
                    <div className="text-left md:text-right">
                       <p className="text-xl font-black text-white tracking-tight font-mono">₹{calculateTotal(inv.items).toLocaleString('en-IN')}</p>
                       <p className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1 ${inv.status === InvoiceStatus.Paid ? 'text-emerald-500' : inv.isQuotation ? 'text-zinc-500' : 'text-amber-500'}`}>
                         {inv.isQuotation ? 'Estimation' : inv.status}
                       </p>
                    </div>
                    <button 
                      onClick={() => !inv.isQuotation && updateInvoiceStatus(inv.id, inv.status === InvoiceStatus.Paid ? InvoiceStatus.Unpaid : InvoiceStatus.Paid)} 
                      disabled={inv.isQuotation}
                      className={`p-3.5 rounded-xl transition-all ${inv.isQuotation ? 'bg-transparent text-zinc-700 cursor-default' : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'}`}
                    >
                      {inv.isQuotation ? <Eye className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                 </div>
              </div>
            );
          })}
          
          {displayInvoices.length === 0 && (
            <div className="py-24 text-center glass-panel rounded-[2rem] border-dashed border-zinc-800 flex flex-col items-center justify-center">
              <div className="p-4 rounded-full bg-zinc-900 mb-4"><Calculator className="w-8 h-8 text-zinc-700" /></div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Ledger Empty</p>
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
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Bill To Client</label>
                       <select required className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none" value={newInvoice.clientId} onChange={e => setNewInvoice({...newInvoice, clientId: e.target.value})}>
                          <option value="">Select Project...</option>
                          {clients.map(c => <option key={c.id} value={c.id}>{c.projectName} ({c.brand})</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Document Type</label>
                       <div className="flex bg-black p-1 rounded-xl border border-white/10">
                          <button type="button" onClick={() => setNewInvoice({...newInvoice, isQuotation: false})} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!newInvoice.isQuotation ? 'bg-white text-black' : 'text-zinc-500'}`}>Invoice</button>
                          <button type="button" onClick={() => setNewInvoice({...newInvoice, isQuotation: true})} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${newInvoice.isQuotation ? 'bg-white text-black' : 'text-zinc-500'}`}>Quotation</button>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Line Items</label>
                    {items.map((item, idx) => (
                       <div key={idx} className="flex gap-3">
                          <input className="flex-[2] bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none" placeholder="Description" value={item.description} onChange={e => { const n = [...items]; n[idx].description = e.target.value; setItems(n); }} />
                          <input type="number" className="w-20 bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none text-center" placeholder="Qty" value={item.quantity} onChange={e => { const n = [...items]; n[idx].quantity = Number(e.target.value); setItems(n); }} />
                          <input type="number" className="w-32 bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none text-right" placeholder="Price" value={item.price} onChange={e => { const n = [...items]; n[idx].price = Number(e.target.value); setItems(n); }} />
                          {items.length > 1 && <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-4 text-zinc-600 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
                       </div>
                    ))}
                    <button type="button" onClick={() => setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, price: 0, costPrice: 0 }])} className="text-[10px] font-black uppercase text-blue-500 tracking-widest hover:text-white transition-colors flex items-center gap-2 px-1">
                       <Plus className="w-3 h-3" /> Add Line Item
                    </button>
                 </div>

                 <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                    <div>
                       <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Total Amount</p>
                       <p className="text-3xl font-black text-white font-mono mt-1">₹{calculateTotal(items).toLocaleString('en-IN')}</p>
                    </div>
                    <button type="submit" className="bg-white text-black px-8 py-4 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-zinc-200 transition-all">
                       Generate {newInvoice.isQuotation ? 'Quotation' : 'Invoice'}
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
