
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus, Trash2, FileText, TrendingDown, X, Tag, Calculator, FileQuestion, Edit2
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
  invoices, expenses, clients, companies, updateInvoiceStatus,
  addExpense, deleteExpense, selectedBrand, userRole
}) => {
  const location = useLocation();
  const isRevenue = location.pathname === '/revenue';
  const [activeTab, setActiveTab] = useState<'all' | 'unpaid' | 'paid' | 'quotes' | 'expenses'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [newInvoice, setNewInvoice] = useState<{ isQuotation: boolean }>({ isQuotation: false });
  const [newExpense, setNewExpense] = useState<{ category: string; amount: number; description: string; client: string; brand?: string }>({ category: 'Production', amount: 0, description: '', client: 'General' });
  const [customCategory, setCustomCategory] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([{ id: '1', description: '', quantity: 1, price: 0 }]);
  const [localEntries, setLocalEntries] = useState<any[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string | null, type: 'entry' | 'expense' | null}>({ isOpen: false, id: null, type: null });
  const [localExpenses, setLocalExpenses] = useState<Expense[]>([]);
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string; visible: boolean}>({message: '', visible: false});

  const showToast = (message: string) => { setToast({message, visible: true}); setTimeout(() => setToast({message: '', visible: false}), 3000); };

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("entries");
      if (stored) setLocalEntries(JSON.parse(stored));
      const storedExpenses = localStorage.getItem("expenses");
      if (storedExpenses) setLocalExpenses(JSON.parse(storedExpenses));
    } catch (e) {
      console.warn("Storage Error", e);
    }
  }, []);

  React.useEffect(() => {
    if (location.state) {
      const state = location.state as { tab?: string; scrollId?: string };
      if (state.tab) {
        setActiveTab(state.tab as any);
      }
      if (state.scrollId) {
        setTimeout(() => {
          const el = document.getElementById(`record-${state.scrollId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-blue-500', 'ring-offset-4', 'ring-offset-zinc-950');
            setTimeout(() => el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-4', 'ring-offset-zinc-950'), 3000);
          }
        }, 300);
      }
    }
  }, [location.state]);

  const calculateTotal = (items?: InvoiceItem[]) => items ? items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;

  const allBrands = Array.from(new Set([
    ...companies.map(c => c.name),
    ...clients.map(c => c.brand).filter(Boolean)
  ]));

  const combinedExpenses = Array.from(new Map([...expenses, ...localExpenses].map(e => [e.id, e])).values());

  const unifiedRecords = React.useMemo(() => {
    const records: any[] = [];
    
    invoices.forEach(inv => {
      if (deletedIds.includes(String(inv.id))) return;
      if (selectedBrand !== 'All' && inv.brand !== selectedBrand) return;
      records.push({
        id: String(inv.id),
        type: inv.isQuotation ? 'quotation' : 'invoice',
        status: inv.isQuotation ? null : inv.status,
        amount: calculateTotal(inv.items),
        client: clients.find(c => c.id === inv.clientId)?.projectName || 'Unknown Client',
        brand: inv.brand,
        date: (inv as any).date || inv.issueDate || inv.createdAt,
        source: 'api_inv',
        raw: inv
      });
    });

    localEntries.forEach(entry => {
      if (deletedIds.includes(String(entry.id))) return;
      if (selectedBrand !== 'All' && entry.brand !== selectedBrand) return;
      records.push({
        id: String(entry.id),
        type: entry.type === 'quotation' ? 'quotation' : 'invoice',
        status: entry.type === 'quotation' ? null : (entry.status || InvoiceStatus.Unpaid),
        amount: entry.total || 0,
        client: entry.clientName || 'Unknown Client',
        brand: entry.brand || 'General',
        date: entry.date || new Date().toISOString(),
        source: 'local_entry',
        raw: entry
      });
    });

    combinedExpenses.forEach(exp => {
      if (deletedIds.includes(String(exp.id))) return;
      if (selectedBrand !== 'All' && exp.brand !== selectedBrand) return;
      records.push({
        id: String(exp.id),
        type: 'expense',
        status: null,
        amount: Number(exp.amount) || 0,
        client: exp.client || 'General',
        brand: exp.brand,
        date: exp.date || (exp as any).createdAt || new Date().toISOString(),
        source: 'expense',
        raw: exp
      });
    });

    return records.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, localEntries, combinedExpenses, deletedIds, selectedBrand, clients]);

  const filteredRecords = React.useMemo(() => {
    return unifiedRecords.filter(r => {
      if (activeTab === 'all') return true;
      if (activeTab === 'unpaid') return r.type === 'invoice' && (!r.status || r.status.toLowerCase() === 'unpaid');
      if (activeTab === 'paid') return r.type === 'invoice' && r.status && r.status.toLowerCase() === 'paid';
      if (activeTab === 'quotes') return r.type === 'quotation';
      if (activeTab === 'expenses') return r.type === 'expense';
      return true;
    });
  }, [unifiedRecords, activeTab]);

  const totalRevenue = invoices.filter(i => !i.isQuotation && !deletedIds.includes(String(i.id))).reduce((s, i) => s + calculateTotal(i.items), 0) + 
                       localEntries.filter(e => e.type === 'invoice' && !deletedIds.includes(String(e.id))).reduce((s, e) => s + (e.total || 0), 0);
  const totalExpenses = combinedExpenses.filter(e => !deletedIds.includes(String(e.id))).reduce((s, e) => s + Number(e.amount), 0);
  const netProfit = totalRevenue - totalExpenses;

  const handleGenerateEntry = (e?: React.FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    console.log("clicked");

    if (!selectedClientId) {
      alert("Please select a client.");
      return;
    }

    if (!Array.isArray(items) || items.length === 0 || items.some(i => !i.description)) {
      alert("Please provide valid line items with descriptions.");
      return;
    }

    const totalAmount = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);

    const client = clients.find(c => String(c.id) === String(selectedClientId));

    const newEntry = {
      id: Date.now(),
      clientId: isNaN(Number(selectedClientId)) ? selectedClientId : Number(selectedClientId),
      clientName: client?.name || client?.projectName || 'Unknown Client',
      email: client?.email || client?.people?.[0]?.email || 'Not provided',
      phone: client?.phone || client?.people?.[0]?.phone || 'Not provided',
      brand: client?.brand || 'Not provided',
      type: newInvoice.isQuotation ? "quotation" : "invoice",
      items: items.map(i => ({
        description: String(i.description),
        quantity: Number(i.quantity) || 1,
        price: Number(i.price) || 0
      })),
      total: totalAmount,
      date: new Date().toISOString(),
      status: newInvoice.isQuotation ? 'quotation' : 'unpaid',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    console.log("New Entry Created:", newEntry);

    let existing: any[] = [];
    try {
      const stored = localStorage.getItem("entries");
      existing = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(existing)) existing = [];
    } catch {
      existing = [];
    }

    const updated = [...existing, newEntry];
    localStorage.setItem("entries", JSON.stringify(updated));
    setLocalEntries(updated);

    setIsCreating(false);
    setItems([{ id: '1', description: '', quantity: 1, price: 0 }]);
    setSelectedClientId('');
    setNewInvoice({ isQuotation: false });
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount || Number(newExpense.amount) <= 0) {
       alert("Please provide a description and an amount greater than 0.");
       return;
    }
    
    const expenseToSave = {
      id: editExpenseId || `EXP-${Date.now().toString().slice(-6)}`,
      description: newExpense.description,
      amount: Number(newExpense.amount),
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      category: newExpense.category === 'Other' && customCategory.trim() !== '' ? customCategory.trim() : (newExpense.category || 'Production'),
      brand: newExpense.brand || allBrands[0] || 'General'
    };

    try {
      if (editExpenseId) {
        await fetch(`http://localhost:5000/api/expenses/${editExpenseId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(expenseToSave)
        });
      } else {
        await fetch('http://localhost:5000/api/expenses', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(expenseToSave)
        });
      }
    } catch (err) {
      console.warn("Backend not available, saving to localStorage:", err);
    }

    const existing = JSON.parse(localStorage.getItem("expenses") || "[]");
    let updated;
    if (editExpenseId) {
      updated = existing.map((ex: any) => ex.id === editExpenseId ? { ...ex, ...expenseToSave } : ex);
    } else {
      updated = [...existing, expenseToSave];
    }
    localStorage.setItem("expenses", JSON.stringify(updated));
    setLocalExpenses(updated);
    addExpense(expenseToSave);

    setIsExpenseModalOpen(false);
    setNewExpense({ category: 'Production', amount: 0, description: '', client: 'General' });
    setCustomCategory('');
    setEditExpenseId(null);
    showToast(editExpenseId ? "Expense updated successfully" : "Expense saved successfully");
  };

  return (
    <div className="space-y-10 animate-ios-slide-up pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
            {isRevenue ? 'Revenue Overview' : 'Ledger'}
          </h1>
          <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] mt-1">Financial Operations & Billing</p>
        </div>
      </div>

      {userRole !== 'Staff' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-8 squircle-lg bg-white/5 border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full group-hover:bg-white/10 transition-all" />
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="p-3 bg-white/10 rounded-xl text-white shadow-lg shadow-black/50"><TrendingDown className="w-5 h-5 group-hover:rotate-12 transition-transform" /></div>
              <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-3 py-1 bg-white/5 rounded-lg border border-white/10">Gross</span>
            </div>
            <h3 className="text-5xl font-black text-white tracking-tighter font-mono"><span className="text-2xl text-zinc-500">₹</span>{(totalRevenue / 100000).toFixed(2)}<span className="text-2xl text-zinc-500">L</span></h3>
            <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest mt-2">Life-time Billings</p>
          </div>
          <div className="glass-panel p-8 squircle-lg bg-red-600/5 border-red-500/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full" />
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="p-3 bg-red-500/10 rounded-xl text-red-500 shadow-lg shadow-red-500/10"><TrendingDown className="w-5 h-5" /></div>
              <span className="text-[9px] font-black uppercase text-red-500 tracking-widest px-3 py-1 bg-red-500/10 rounded-lg">Spend</span>
            </div>
            <h3 className="text-5xl font-black text-white tracking-tighter font-mono"><span className="text-2xl text-zinc-500">₹</span>{(totalExpenses).toLocaleString('en-IN')}</h3>
            <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest mt-2">Total Expenses</p>
          </div>
          <div className="glass-panel p-8 squircle-lg bg-emerald-600/5 border-emerald-500/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 shadow-lg shadow-emerald-500/10"><Calculator className="w-5 h-5" /></div>
              <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest px-3 py-1 bg-emerald-500/10 rounded-lg">Net</span>
            </div>
            <h3 className="text-5xl font-black text-white tracking-tighter font-mono"><span className="text-2xl text-zinc-500">₹</span>{(netProfit).toLocaleString('en-IN')}</h3>
            <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest mt-2">Operating Cash Flow</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-6">
          <div className="flex bg-zinc-900/50 p-1.5 rounded-[1.2rem] border border-white/5 overflow-x-auto max-w-full">
            {['all', 'unpaid', 'paid', 'quotes', 'expenses'].map(t => (
              <button
                key={t} onClick={() => setActiveTab(t as 'all' | 'unpaid' | 'paid' | 'quotes' | 'expenses')}
                className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${activeTab === t ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
              >
                {t === 'quotes' ? 'Quotations' : t}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            {activeTab === 'expenses' ? (
              <button onClick={() => setIsExpenseModalOpen(true)} className="bg-white text-black px-6 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-xl active:scale-95 whitespace-nowrap">
                <TrendingDown className="w-4 h-4" /> Log Expense
              </button>
            ) : (
              <button onClick={() => setIsCreating(true)} className="bg-white text-black px-6 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-xl active:scale-95 whitespace-nowrap">
                <Plus className="w-4 h-4" /> Create Bill / Quote
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredRecords.map(record => {
            const isExpense = record.type === 'expense';
            const isQuote = record.type === 'quotation';
            const isPaid = record.status && record.status.toLowerCase() === 'paid';

            return (
              <div id={`record-${record.id}`} key={`${record.source}-${record.id}`} className={`glass-panel p-8 squircle-lg flex flex-col md:flex-row justify-between items-start md:items-center group hover:bg-white/5 transition-all border border-white/5 relative overflow-hidden ${isExpense ? 'border-red-500/10' : isQuote ? 'border-zinc-800/50' : 'border-blue-500/10'}`}>
                <div className={`absolute top-0 right-0 w-1.5 h-full opacity-30 ${isExpense ? 'bg-red-500' : isQuote ? 'bg-zinc-500' : isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} style={record.brand ? { backgroundColor: companies.find(co => co.name === record.brand)?.color } : undefined} />
                
                <div className="flex items-center gap-6 mb-6 md:mb-0">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${
                    isExpense ? 'bg-red-500/10 border-red-500/20 text-red-500' : 
                    isQuote ? 'bg-zinc-800 border-white/10 text-zinc-400' : 
                    isPaid ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
                    'bg-amber-500/10 border-amber-500/20 text-amber-500'
                  }`}>
                    {isExpense ? <TrendingDown className="w-6 h-6" /> : isQuote ? <FileQuestion className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-black text-lg uppercase tracking-tight text-white">{record.client}</h4>
                    <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest mt-1.5 flex items-center gap-2">
                      <Tag className="w-3 h-3" /> {record.type} • {record.brand}
                    </p>
                  </div>
                </div>

                 <div className="w-full md:w-auto flex justify-between md:justify-end items-center gap-8 border-t md:border-t-0 pt-6 md:pt-0 border-white/5">
                  <div className="text-left md:text-right">
                    <p className="text-xl font-black text-white tracking-tight font-mono">₹{record.amount.toLocaleString('en-IN')}</p>
                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1 ${isExpense ? 'text-red-500' : isPaid ? 'text-emerald-500' : isQuote ? 'text-zinc-500' : 'text-amber-500'}`}>
                      {isExpense ? new Date(record.date).toLocaleDateString() : (isQuote ? 'Estimation' : record.status)}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    {/* Action buttons based on status & type */}
                    {!isExpense && !isQuote && !isPaid && (
                      <button
                        onClick={() => {
                          if (record.source === 'api_inv') updateInvoiceStatus(record.raw.id, InvoiceStatus.Paid);
                          else if (record.source === 'local_entry') {
                             const updated = localEntries.map(e => String(e.id) === record.id ? { ...e, status: 'paid' } : e);
                             setLocalEntries(updated);
                             localStorage.setItem('entries', JSON.stringify(updated));
                          }
                          showToast('Invoice Marked as Paid');
                        }}
                        className="px-4 py-3.5 rounded-xl transition-all bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 font-black text-[9px] uppercase tracking-widest whitespace-nowrap"
                      >
                         Mark as Paid
                      </button>
                    )}

                    {isQuote && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (record.source === 'api_inv') { showToast('Not active on API currently'); }
                          else if (record.source === 'local_entry') {
                             const updated = localEntries.map(e => String(e.id) === record.id ? { ...e, type: 'invoice', status: 'unpaid' } : e);
                             setLocalEntries(updated);
                             localStorage.setItem('entries', JSON.stringify(updated));
                             showToast('Converted to Invoice');
                          }
                        }}
                        className="px-4 py-3.5 rounded-xl transition-all bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 font-black text-[9px] uppercase tracking-widest whitespace-nowrap"
                      >
                         Generate Invoice
                      </button>
                    )}

                    {isExpense && (
                      <button 
                        onClick={() => {
                          setEditExpenseId(record.id);
                          setNewExpense({ description: record.raw.description, amount: record.raw.amount, category: record.raw.category, brand: record.raw.brand, client: record.raw.client || 'General' });
                          setIsExpenseModalOpen(true);
                        }} 
                        className="p-3.5 rounded-xl transition-all bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    )}

                    <button 
                      onClick={() => setDeleteModal({ isOpen: true, id: record.id, type: isExpense ? 'expense' : 'entry' })} 
                      className="p-3.5 rounded-xl transition-all bg-white/5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredRecords.length === 0 && (
            <div className="py-24 text-center glass-panel rounded-[2rem] border-dashed border-zinc-800 flex flex-col items-center justify-center">
              <div className="p-4 rounded-full bg-zinc-900 mb-4"><Calculator className="w-8 h-8 text-zinc-700" /></div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">
                {activeTab === 'unpaid' ? "No unpaid invoices" : "Ledger Empty"}
              </p>
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

            <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Bill To Client</label>
                  <select 
                    className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none" 
                    value={selectedClientId || ""} 
                    onChange={e => {
                      console.log("Selected Client ID:", e.target.value);
                      setSelectedClientId(e.target.value);
                    }}
                  >
                    <option value="" disabled hidden>Select Client...</option>
                    {clients.map(client => <option key={String(client.id)} value={String(client.id)}>{client.name || client.projectName}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Document Type</label>
                  <div className="flex bg-black p-1 rounded-xl border border-white/10">
                    <button type="button" onClick={() => setNewInvoice({ ...newInvoice, isQuotation: false })} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!newInvoice.isQuotation ? 'bg-white text-black' : 'text-zinc-500'}`}>Invoice</button>
                    <button type="button" onClick={() => setNewInvoice({ ...newInvoice, isQuotation: true })} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${newInvoice.isQuotation ? 'bg-white text-black' : 'text-zinc-500'}`}>Quotation</button>
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
                <button type="button" onClick={() => setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, price: 0 }])} className="text-[10px] font-black uppercase text-blue-500 tracking-widest hover:text-white transition-colors flex items-center gap-2 px-1">
                  <Plus className="w-3 h-3" /> Add Line Item
                </button>
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Total Amount</p>
                  <p className="text-3xl font-black text-white font-mono mt-1">₹{calculateTotal(items).toLocaleString('en-IN')}</p>
                </div>
                <button type="button" onClick={handleGenerateEntry} className="bg-white text-black px-8 py-4 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-zinc-200 transition-all cursor-pointer">
                  Generate {newInvoice.isQuotation ? 'Quotation' : 'Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-xl">
          <div className="bg-zinc-900 border border-white/10 squircle-lg w-full max-w-lg p-10 shadow-2xl animate-ios-slide-up">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">Log Expense</h2>
              <button onClick={() => { setIsExpenseModalOpen(false); setEditExpenseId(null); setNewExpense({ category: 'Production', amount: 0, description: '', client: 'General' }); setCustomCategory(''); }} className="p-2 bg-white/5 rounded-full"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Description</label>
                <input required className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none" placeholder="e.g. Camera Rental" value={newExpense.description || ''} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Amount</label>
                  <input type="number" required className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none" placeholder="0.00" value={newExpense.amount || ''} onChange={e => setNewExpense({ ...newExpense, amount: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Category</label>
                  <select className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none" value={newExpense.category} onChange={e => {
                    setNewExpense({ ...newExpense, category: e.target.value });
                    if (e.target.value !== 'Other') setCustomCategory('');
                  }}>
                    <option value="Production">Production</option>
                    <option value="Travel">Travel</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Office">Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {newExpense.category === 'Other' && (
                <div className="space-y-2 animate-ios-slide-up">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Custom Category</label>
                  <input 
                    required 
                    className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-white/20 transition-all" 
                    placeholder="e.g. Petrol, Food, Travel" 
                    value={customCategory} 
                    onChange={e => setCustomCategory(e.target.value)} 
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Select Client</label>
                <select className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none" value={newExpense.client || 'General'} onChange={e => setNewExpense({ ...newExpense, client: e.target.value })}>
                  <option value="General">General (Non-Client Expense)</option>
                  {clients.map(client => (
                    <option key={String(client.id)} value={client.name || client.projectName}>
                      {client.name || client.projectName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Brand</label>
                <select className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none" value={newExpense.brand || ''} onChange={e => setNewExpense({ ...newExpense, brand: e.target.value })}>
                  <option value="" disabled hidden>Select Brand...</option>
                  {allBrands.map(brandName => <option key={String(brandName)} value={String(brandName)}>{brandName}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full bg-white text-black px-8 py-5 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-zinc-200 transition-all mt-4">
                Record Transaction
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-xl">
          <div className="bg-zinc-900 border border-white/10 squircle-lg w-full max-w-sm p-8 shadow-2xl animate-ios-slide-up text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Delete Item</h3>
            <p className="text-zinc-400 text-sm mb-8">Are you sure you want to remove this entry? This action cannot be undone.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeleteModal({ isOpen: false, id: null, type: null })} 
                className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!deleteModal.id) {
                    setDeleteModal({ isOpen: false, id: null, type: null });
                    return;
                  }
                  
                  try {
                    console.log(`[Delete] Attempting to delete ${deleteModal.type} with ID: ${deleteModal.id}`);
                    
                    // Send DELETE request to backend API
                    try {
                      const endpoint = deleteModal.type === 'expense' ? `/api/expenses/${deleteModal.id}` : `/api/entries/${deleteModal.id}`;
                      const res = await fetch(`http://localhost:5000${endpoint}`, {
                        method: 'DELETE',
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
                          'Content-Type': 'application/json'
                        }
                      });
                      console.log(`[Delete] API Response Status: ${res.status}`);
                    } catch (netErr) {
                      console.warn(`[Delete] API unavailable for ${deleteModal.id}, defaulting to local deletion.`, netErr);
                    }
                    
                    // Remove from localStorage strictly to ensure it doesn't reappear on refresh
                    if (deleteModal.type === 'expense') {
                      try {
                        const stored = localStorage.getItem("expenses");
                        if (stored) {
                          const parsed = JSON.parse(stored);
                          const filtered = parsed.filter((e: any) => String(e.id) !== String(deleteModal.id));
                          localStorage.setItem("expenses", JSON.stringify(filtered));
                          setLocalExpenses(filtered);
                        }
                        try {
                           deleteExpense(deleteModal.id!);
                        } catch {
                           // Silently fail if handle fails
                        }
                      } catch (e) {
                        console.warn("Could not target expenses localStorage", e);
                      }
                    } else {
                      try {
                        const stored = localStorage.getItem("entries");
                        if (stored) {
                          const parsed = JSON.parse(stored);
                          const filtered = parsed.filter((e: any) => String(e.id) !== String(deleteModal.id));
                          localStorage.setItem("entries", JSON.stringify(filtered));
                          setLocalEntries(filtered);
                        }
                      } catch (e) {
                        console.warn("Could not target entries localStorage", e);
                      }
                    }

                    // Remove from UI
                    setDeletedIds(prev => [...prev, deleteModal.id!]);
                    setDeleteModal({ isOpen: false, id: null, type: null });
                  } catch (err: any) {
                    console.error("[Delete] Exception caught:", err);
                    alert("Failed to safely complete deletion.");
                  }
                }} 
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
                disabled={!deleteModal.id}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.visible && (
        <div className="fixed bottom-4 right-4 bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl font-black uppercase text-[10px] tracking-widest animate-ios-slide-up z-[200]">
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default FinanceManager;
