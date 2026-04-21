
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus, Trash2, FileText, TrendingDown, X, Calculator, FileQuestion, Edit2, Download
} from 'lucide-react';
import { type Invoice, type Expense, type Client, type CompanyProfile, InvoiceStatus, type InvoiceItem } from '../types';

interface FinanceManagerProps {
  invoices: Invoice[];
  expenses: Expense[];
  clients: Client[];
  companies: CompanyProfile[];
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

  const [categories, setCategories] = useState<string[]>(['Production', 'Travel', 'Marketing', 'Office', 'Other']);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const calculateTotal = (items?: InvoiceItem[]) => items ? items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;

  const allBrands = Array.from(new Set([
    ...companies.map(c => c.companyName),
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

  const totalRevenue = invoices.filter(i => !i.isQuotation && !deletedIds.includes(String(i.id)) && i.status?.toLowerCase() === 'paid').reduce((s, i) => s + calculateTotal(i.items), 0) + 
                       localEntries.filter(e => e.type === 'invoice' && !deletedIds.includes(String(e.id)) && e.status?.toLowerCase() === 'paid').reduce((s, e) => s + (e.total || 0), 0);
  const totalExpenses = combinedExpenses.filter(e => !deletedIds.includes(String(e.id))).reduce((s, e) => s + Number(e.amount), 0);
  const netProfit = totalRevenue - totalExpenses;

  const handleGenerateEntry = (e?: React.FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!selectedClientId) {
      alert("Please select a client.");
      return;
    }

    const totalAmount = calculateTotal(items);

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
      date: (newInvoice as any).date || new Date().toISOString(),
      status: newInvoice.isQuotation ? 'quotation' : ((newInvoice as any).status || 'unpaid'),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

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
      category: newExpense.category || 'Production',
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
              <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-3 py-1 bg-white/5 rounded-lg border border-white/10">Gross Revenue</span>
            </div>
            <h3 className="text-5xl font-black text-white tracking-tighter font-mono"><span className="text-2xl text-zinc-500">₹</span>{(totalRevenue / 100000).toFixed(2)}<span className="text-2xl text-zinc-500">L</span></h3>
            <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest mt-2">Realized Paid Earnings</p>
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
            {userRole !== 'Client' && (
               activeTab === 'expenses' ? (
                 <button onClick={() => setIsExpenseModalOpen(true)} className="bg-white text-black px-6 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-xl active:scale-95 whitespace-nowrap">
                   <TrendingDown className="w-4 h-4" /> Log Expense
                 </button>
               ) : (
                 <button onClick={() => setIsCreating(true)} className="bg-white text-black px-6 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-xl active:scale-95 whitespace-nowrap">
                   <Plus className="w-4 h-4" /> Create Bill / Quote
                 </button>
               )
            )}
            {userRole === 'Client' && (
              <div className="px-6 py-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                 <p className="text-[9px] font-black uppercase text-blue-500 tracking-[0.2em]">Verified Transaction Mirror</p>
              </div>
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
                <div className={`absolute top-0 right-0 w-1.5 h-full opacity-30 ${isExpense ? 'bg-red-500' : isQuote ? 'bg-zinc-500' : isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} style={record.brand ? { backgroundColor: companies.find(co => co.companyName === record.brand)?.primaryColor } : undefined} />
                
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
                       {record.type} • {record.brand || 'General'}
                    </p>
                  </div>
                </div>

                 <div className="w-full md:w-auto flex justify-between md:justify-end items-center gap-8 border-t md:border-t-0 pt-6 md:pt-0 border-white/5">
                  <div className="text-left md:text-right">
                    <p className="text-xl font-black text-white tracking-tight font-mono">₹{record.amount.toLocaleString('en-IN')}</p>
                    <div className="flex items-center gap-2 mt-1 md:justify-end">
                       <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                         isExpense ? 'bg-red-500/10 text-red-500' :
                         isPaid ? 'bg-emerald-500/10 text-emerald-500' :
                         isQuote ? 'bg-zinc-500/10 text-zinc-500' :
                         'bg-amber-500/10 text-amber-500'
                       }`}>
                         {isExpense ? 'Expense' : isQuote ? 'Quotation' : record.status}
                       </span>
                       <span className="text-[8px] font-black uppercase text-zinc-600 tracking-widest">{new Date(record.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                            <div className="flex gap-2">
                    {userRole === 'Client' && !isExpense && (
                       <button
                         onClick={() => showToast('Generating Secure PDF...')}
                         className="flex items-center gap-2 px-6 py-3.5 rounded-xl transition-all bg-white text-black hover:bg-zinc-200 font-black text-[9px] uppercase tracking-widest whitespace-nowrap active:scale-95"
                       >
                          <Download size={14} /> Download PDF
                       </button>
                    )}

                    {userRole !== 'Client' && (
                      <>
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
                            className="px-4 py-3.5 rounded-xl transition-all bg-emerald-500 text-black hover:bg-emerald-400 font-black text-[9px] uppercase tracking-widest whitespace-nowrap active:scale-95"
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
                            className="px-4 py-3.5 rounded-xl transition-all bg-blue-500 text-white hover:bg-blue-600 font-black text-[9px] uppercase tracking-widest whitespace-nowrap active:scale-95"
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
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredRecords.length === 0 && (
            <div className="py-24 text-center glass-panel rounded-[2rem] border-dashed border-zinc-800 flex flex-col items-center justify-center bg-zinc-900/20">
              <div className="p-4 rounded-full bg-zinc-900 mb-4 border border-white/5"><Calculator className="w-8 h-8 text-zinc-700" /></div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">
                {activeTab === 'unpaid' ? "No unpaid invoices" : "Ledger Portfolio Empty"}
              </p>
            </div>
          )}
        </div>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-xl">
          <div className="bg-zinc-900 border border-white/10 squircle-lg w-full max-w-2xl p-10 shadow-2xl animate-ios-slide-up max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Financial Deployment</h2>
              <button 
                onClick={() => {
                  setIsCreating(false);
                  setNewInvoice({ isQuotation: false });
                }} 
                className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6 text-zinc-500" />
              </button>
            </div>

            <form onSubmit={handleGenerateEntry} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Engagement Target</label>
                  <select 
                    required
                    className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-white/20 transition-all cursor-pointer" 
                    value={selectedClientId || ""} 
                    onChange={e => setSelectedClientId(e.target.value)}
                  >
                    <option value="" disabled hidden>Select Client...</option>
                    {clients.map(client => <option key={String(client.id)} value={String(client.id)} className="bg-zinc-950 font-black tracking-tight">{client.name || client.projectName}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Operation Type</label>
                  <div className="flex bg-black p-1 rounded-xl border border-white/10">
                    <button type="button" onClick={() => setNewInvoice({ ...newInvoice, isQuotation: false })} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!newInvoice.isQuotation ? 'bg-white text-black' : 'text-zinc-500'}`}>Invoice</button>
                    <button type="button" onClick={() => setNewInvoice({ ...newInvoice, isQuotation: true })} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${newInvoice.isQuotation ? 'bg-white text-black' : 'text-zinc-500'}`}>Quotation</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Payment Manifest</label>
                    <select 
                      disabled={newInvoice.isQuotation}
                      className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed" 
                      value={(newInvoice as any).status || 'unpaid'} 
                      onChange={e => setNewInvoice({ ...newInvoice, status: e.target.value } as any)}
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="paid">Paid</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Effective Date</label>
                    <input 
                      type="date" 
                      required 
                      className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-white/20" 
                      value={(newInvoice as any).date || new Date().toISOString().split('T')[0]} 
                      onChange={e => setNewInvoice({ ...newInvoice, date: e.target.value } as any)}
                    />
                 </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest">Billing Manifest</label>
                  <button 
                    type="button" 
                    onClick={() => setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, price: 0 }])}
                    className="text-[9px] font-black uppercase text-blue-500 tracking-[0.2em] hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-3 h-3" /> Add Row
                  </button>
                </div>
                
                <div className="space-y-4">
                  {items.map((item, idx) => (
                    <div key={item.id || idx} className="grid grid-cols-12 gap-3 items-center group animate-ios-slide-up">
                      <div className="col-span-12 md:col-span-5">
                        <input 
                          type="text"
                          className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-white/20" 
                          placeholder="Description (e.g. Cinema Package)" 
                          value={item.description} 
                          onChange={e => {
                            const n = [...items];
                            n[idx].description = e.target.value;
                            setItems(n);
                          }} 
                        />
                      </div>
                      <div className="col-span-3 md:col-span-2">
                        <div className="flex bg-black border border-white/10 rounded-xl items-center h-12 overflow-hidden focus-within:border-white/20 transition-all">
                          <button 
                            type="button" 
                            onClick={() => {
                              const n = [...items];
                              n[idx].quantity = Math.max(1, (n[idx].quantity || 1) - 1);
                              setItems(n);
                            }}
                            className="h-full px-2 text-zinc-600 hover:text-white hover:bg-white/5 transition-colors font-black"
                          >
                            -
                          </button>
                          <input 
                            type="number" 
                            min="1"
                            className="w-full bg-transparent text-xs font-black text-white outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                            placeholder="Qty" 
                            value={item.quantity === 0 ? '' : item.quantity} 
                            onChange={e => {
                              const n = [...items];
                              let val = parseInt(e.target.value);
                              if (isNaN(val) || val < 1) val = 1;
                              n[idx].quantity = val;
                              setItems(n);
                            }} 
                            onBlur={e => {
                              if (!e.target.value) {
                                const n = [...items];
                                n[idx].quantity = 1;
                                setItems(n);
                              }
                            }}
                          />
                          <button 
                            type="button" 
                            onClick={() => {
                              const n = [...items];
                              n[idx].quantity = (n[idx].quantity || 0) + 1;
                              setItems(n);
                            }}
                            className="h-full px-2 text-zinc-600 hover:text-white hover:bg-white/5 transition-colors font-black"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        <input 
                          type="number" 
                          className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs font-bold text-white outline-none text-right" 
                          placeholder="Price" 
                          value={item.price} 
                          onChange={e => {
                            const n = [...items];
                            n[idx].price = Number(e.target.value);
                            setItems(n);
                          }} 
                        />
                      </div>
                      <div className="col-span-4 md:col-span-2 text-right">
                         <p className="text-[10px] font-black text-zinc-500 mb-1 uppercase tracking-tighter">Subtotal</p>
                         <p className="text-sm font-black text-white font-mono">₹{(item.quantity * item.price).toLocaleString('en-IN')}</p>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button 
                          type="button" 
                          onClick={() => setItems(items.length > 1 ? items.filter((_, i) => i !== idx) : items)} 
                          className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-red-500 bg-white/5 rounded-lg border border-white/5 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Calculated Payout</p>
                  <p className="text-5xl font-black text-white font-mono mt-1 tracking-tighter">₹{calculateTotal(items).toLocaleString('en-IN')}</p>
                </div>
                <button 
                  type="submit" 
                  disabled={items.some(i => !i.description || i.price <= 0)}
                  className="w-full md:w-auto bg-white text-black px-12 py-5 rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-2xl hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed group flex items-center justify-center gap-3"
                >
                   Finalize {newInvoice.isQuotation ? 'Quotation' : 'Invoice'}
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
              <button onClick={() => { setIsExpenseModalOpen(false); setEditExpenseId(null); setNewExpense({ category: 'Production', amount: 0, description: '', client: 'General' }); setShowNewCategoryInput(false); }} className="p-2 bg-white/5 rounded-full"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Description</label>
                <input required className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none" placeholder="e.g. Camera Rental" value={newExpense.description || ''} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Amount</label>
                  <input type="number" required className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-white/20" placeholder="0.00" value={newExpense.amount || ''} onChange={e => setNewExpense({ ...newExpense, amount: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest">Category</label>
                    <button 
                      type="button" 
                      onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
                      className="p-1 hover:bg-white/10 rounded transition-colors text-blue-500"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <select 
                    className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-white/20" 
                    value={showNewCategoryInput ? "ADD_NEW" : newExpense.category} 
                    onChange={e => {
                      if (e.target.value === "ADD_NEW") {
                        setShowNewCategoryInput(true);
                      } else {
                        setNewExpense({ ...newExpense, category: e.target.value });
                        setShowNewCategoryInput(false);
                      }
                    }}
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    <option value="ADD_NEW">+ Add New Category</option>
                  </select>
                </div>
              </div>

              {showNewCategoryInput && (
                <div className="space-y-2 animate-ios-slide-up bg-white/[0.02] p-4 rounded-xl border border-white/5">
                  <label className="text-[10px] font-black uppercase text-blue-500 tracking-widest px-1">Define New Category</label>
                  <div className="flex gap-2">
                    <input 
                      autoFocus
                      className="flex-1 bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-white/20" 
                      placeholder="e.g. Equipment, Rent..." 
                      value={newCategoryName} 
                      onChange={e => setNewCategoryName(e.target.value)} 
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        if (newCategoryName.trim()) {
                          const name = newCategoryName.trim();
                          if (!categories.includes(name)) {
                            setCategories([...categories, name]);
                          }
                          setNewExpense({ ...newExpense, category: name });
                          setNewCategoryName('');
                          setShowNewCategoryInput(false);
                        }
                      }}
                      className="bg-blue-500 text-white px-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all"
                    >
                      Add
                    </button>
                  </div>
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
