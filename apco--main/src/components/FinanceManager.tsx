
import React, { useState } from 'react';
import { 
  Plus, Trash2, FileText, Send, CheckCircle2, Clock, 
  IndianRupee, TrendingUp, TrendingDown, Wallet, Briefcase, Users, Printer, Share2, X
} from 'lucide-react';
import type { Invoice, InvoiceStatus, Client, InvoiceItem, Brand, Expense } from '../types';
import { generateEmailDraft } from '../services/geminiService';

interface FinanceManagerProps {
  invoices: Invoice[];
  expenses: Expense[];
  clients: Client[];
  addInvoice: (invoice: Invoice) => void;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;
  addExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  selectedBrand: Brand | 'All';
}

const FinanceManager: React.FC<FinanceManagerProps> = ({ 
  invoices, expenses, clients, addInvoice, updateInvoiceStatus, 
  addExpense, deleteExpense, selectedBrand 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'expenses' | 'profitability'>('overview');
  
  // Invoice Form State
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([{ id: '1', description: '', quantity: 1, price: 0 }]);
  const [dueDate, setDueDate] = useState('');
  
  // Expense Form State
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({ date: new Date().toISOString().split('T')[0], category: 'Vendor', brand: 'Aaha Kalayanam' });

  // AI Draft State
  const [aiDraft, setAiDraft] = useState<{ id: string, text: string } | null>(null);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  // Print State
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);

  // Filter Data based on Brand
  const filteredInvoices = selectedBrand === 'All' ? invoices : invoices.filter(i => i.brand === selectedBrand);
  const filteredExpenses = selectedBrand === 'All' ? expenses : expenses.filter(e => e.brand === selectedBrand);
  const filteredClients = selectedBrand === 'All' ? clients : clients.filter(c => c.brand === selectedBrand);

  // Theming Helpers
  const isBaby = selectedBrand === 'Tiny Toes';
  const textPrimary = isBaby ? 'text-slate-900' : 'text-zinc-100';
  const textSecondary = isBaby ? 'text-slate-500' : 'text-zinc-400';
  const cardBg = isBaby ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-700';
  const accentColor = isBaby ? 'bg-blue-600 hover:bg-blue-700' : 'bg-yellow-600 hover:bg-yellow-700';
  const tableHeader = isBaby ? 'bg-slate-50 text-slate-700' : 'bg-black text-zinc-300';
  const borderColor = isBaby ? 'divide-slate-200' : 'divide-zinc-800';

  // --- Invoice Functions ---
  const calculateTotal = (items: InvoiceItem[]) => items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const handleInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    const client = clients.find(c => c.id === selectedClient);
    if (!client) return;

    const newInv: Invoice = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      clientId: selectedClient,
      issueDate: new Date().toISOString(),
      dueDate: dueDate || new Date().toISOString(),
      items: invoiceItems,
      status: InvoiceStatus.Unpaid,
      brand: client.brand 
    };
    addInvoice(newInv);
    setIsCreatingInvoice(false);
    setSelectedClient('');
    setInvoiceItems([{ id: '1', description: '', quantity: 1, price: 0 }]);
  };

  const handleGenerateReminder = async (invoice: Invoice) => {
    setGeneratingFor(invoice.id);
    const client = clients.find(c => c.id === invoice.clientId);
    if (client) {
      const draft = await generateEmailDraft('payment_reminder', client, invoice);
      setAiDraft({ id: invoice.id, text: draft });
    }
    setGeneratingFor(null);
  };

  const handlePrint = (invoice: Invoice) => {
    setPrintInvoice(invoice);
    // Slight delay to allow render before printing
    setTimeout(() => {
        window.print();
        // Clear print selection after print dialog closes (or user cancels)
        // Note: window.print is blocking in most browsers, so this runs after.
        // For better UX, we might want a "Close" button on the print preview if we made it a modal.
        // But here we rely on CSS print media query.
    }, 100);
  };

  const handleShareWhatsApp = (invoice: Invoice) => {
    const client = clients.find(c => c.id === invoice.clientId);
    if (!client) return;

    const total = calculateTotal(invoice.items);
    const message = `
*Invoice from AP Co. (${invoice.brand})*
Hello ${client.name}, here are your invoice details:

Invoice ID: ${invoice.id}
Amount Due: ₹${total.toLocaleString('en-IN')}
Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}

Please arrange for payment at your earliest convenience. Thank you!
    `.trim();

    const url = `https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // --- Expense Functions ---
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpense.description && newExpense.amount) {
      addExpense({
        id: Date.now().toString(),
        description: newExpense.description,
        amount: Number(newExpense.amount),
        date: newExpense.date || new Date().toISOString(),
        category: newExpense.category as any,
        clientId: newExpense.clientId || undefined,
        brand: newExpense.brand as Brand
      });
      setIsAddingExpense(false);
      setNewExpense({ date: new Date().toISOString().split('T')[0], category: 'Vendor', brand: 'Aaha Kalayanam' });
    }
  };

  // --- Render Functions ---

  const renderOverview = () => {
    const totalRevenue = filteredInvoices
      .filter(i => i.status === InvoiceStatus.Paid)
      .reduce((sum, inv) => sum + calculateTotal(inv.items), 0);
    
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const pending = filteredInvoices
      .filter(i => i.status === InvoiceStatus.Unpaid || i.status === InvoiceStatus.Overdue)
      .reduce((sum, inv) => sum + calculateTotal(inv.items), 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <div className={`p-6 rounded-xl border ${cardBg}`}>
              <div className="flex justify-between items-start mb-2">
                 <p className={`text-xs font-bold uppercase tracking-wider ${textSecondary}`}>Total Revenue</p>
                 <div className={`p-2 rounded-lg ${isBaby ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-900/30 text-emerald-500'}`}><TrendingUp className="w-4 h-4" /></div>
              </div>
              <h3 className={`text-2xl font-bold ${textPrimary}`}>₹{totalRevenue.toLocaleString('en-IN')}</h3>
           </div>
           <div className={`p-6 rounded-xl border ${cardBg}`}>
              <div className="flex justify-between items-start mb-2">
                 <p className={`text-xs font-bold uppercase tracking-wider ${textSecondary}`}>Total Expenses</p>
                 <div className={`p-2 rounded-lg ${isBaby ? 'bg-red-100 text-red-600' : 'bg-red-900/30 text-red-500'}`}><TrendingDown className="w-4 h-4" /></div>
              </div>
              <h3 className={`text-2xl font-bold ${textPrimary}`}>₹{totalExpenses.toLocaleString('en-IN')}</h3>
           </div>
           <div className={`p-6 rounded-xl border ${cardBg}`}>
              <div className="flex justify-between items-start mb-2">
                 <p className={`text-xs font-bold uppercase tracking-wider ${textSecondary}`}>Net Profit</p>
                 <div className={`p-2 rounded-lg ${isBaby ? 'bg-blue-100 text-blue-600' : 'bg-yellow-900/30 text-yellow-500'}`}><Wallet className="w-4 h-4" /></div>
              </div>
              <h3 className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                ₹{netProfit.toLocaleString('en-IN')}
              </h3>
           </div>
           <div className={`p-6 rounded-xl border ${cardBg}`}>
              <div className="flex justify-between items-start mb-2">
                 <p className={`text-xs font-bold uppercase tracking-wider ${textSecondary}`}>Pending Collection</p>
                 <div className={`p-2 rounded-lg ${isBaby ? 'bg-slate-100 text-slate-600' : 'bg-zinc-800 text-zinc-400'}`}><Clock className="w-4 h-4" /></div>
              </div>
              <h3 className={`text-2xl font-bold ${textSecondary}`}>₹{pending.toLocaleString('en-IN')}</h3>
           </div>
        </div>
      </div>
    );
  };

  const renderProfitability = () => {
    return (
      <div className={`${cardBg} rounded-xl overflow-hidden border`}>
        <table className="w-full text-left">
           <thead className={`text-xs uppercase font-bold tracking-wider ${tableHeader}`}>
             <tr>
               <th className="p-4">Client / Project</th>
               <th className="p-4 text-right">Total Invoiced (Paid)</th>
               <th className="p-4 text-right">Project Expenses</th>
               <th className="p-4 text-right">Net Profit</th>
               <th className="p-4 text-right">Margin</th>
             </tr>
           </thead>
           <tbody className={`divide-y ${borderColor}`}>
             {filteredClients.map(client => {
               const clientInvoices = invoices.filter(i => i.clientId === client.id && i.status === InvoiceStatus.Paid);
               const clientRevenue = clientInvoices.reduce((sum, inv) => sum + calculateTotal(inv.items), 0);
               const clientExpenses = expenses.filter(e => e.clientId === client.id).reduce((sum, e) => sum + e.amount, 0);
               const profit = clientRevenue - clientExpenses;
               const margin = clientRevenue > 0 ? (profit / clientRevenue) * 100 : 0;
               
               return (
                 <tr key={client.id} className={isBaby ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/50'}>
                   <td className={`p-4 font-medium ${textPrimary}`}>
                     {client.name}
                     <span className={`block text-[10px] ${textSecondary}`}>{client.brand}</span>
                   </td>
                   <td className="p-4 text-right text-emerald-500">₹{clientRevenue.toLocaleString('en-IN')}</td>
                   <td className="p-4 text-right text-red-500">₹{clientExpenses.toLocaleString('en-IN')}</td>
                   <td className={`p-4 text-right font-bold ${profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                     ₹{profit.toLocaleString('en-IN')}
                   </td>
                   <td className={`p-4 text-right text-sm ${textSecondary}`}>{margin.toFixed(1)}%</td>
                 </tr>
               );
             })}
           </tbody>
        </table>
        {filteredClients.length === 0 && <div className={`p-8 text-center ${textSecondary}`}>No client data available for analysis.</div>}
      </div>
    );
  };

  const renderInvoices = () => (
    <>
      <div className="flex justify-end mb-4">
         <button onClick={() => setIsCreatingInvoice(true)} className={`px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 ${accentColor}`}>
           <Plus className="w-4 h-4" /> New Invoice
         </button>
      </div>
      <div className={`${cardBg} rounded-xl border overflow-hidden`}>
        <table className="w-full text-left">
          <thead className={`text-xs uppercase font-bold tracking-wider ${tableHeader}`}>
            <tr>
              <th className="p-4">Invoice</th>
              <th className="p-4">Client</th>
              <th className="p-4">Due Date</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${borderColor}`}>
            {filteredInvoices.map(inv => {
               const client = clients.find(c => c.id === inv.clientId);
               const total = calculateTotal(inv.items);
               return (
                 <React.Fragment key={inv.id}>
                 <tr className={isBaby ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/50'}>
                   <td className={`p-4 font-mono text-xs ${textSecondary}`}>#{inv.id}</td>
                   <td className={`p-4 font-medium ${textPrimary}`}>{client?.name}</td>
                   <td className={`p-4 text-sm ${textSecondary}`}>{new Date(inv.dueDate).toLocaleDateString()}</td>
                   <td className={`p-4 font-medium ${textPrimary}`}>₹{total.toLocaleString('en-IN')}</td>
                   <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        inv.status === 'Paid' ? 'bg-emerald-900/30 text-emerald-500' : 
                        inv.status === 'Overdue' ? 'bg-red-900/30 text-red-500' : 
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {inv.status}
                      </span>
                   </td>
                   <td className="p-4 flex justify-end gap-2">
                      <button 
                        onClick={() => handleShareWhatsApp(inv)}
                        className={`p-2 rounded hover:bg-zinc-800 ${textSecondary}`}
                        title="Share on WhatsApp"
                      >
                         <Share2 className="w-4 h-4" />
                      </button>
                      <button 
                         onClick={() => handlePrint(inv)}
                         className={`p-2 rounded hover:bg-zinc-800 ${textSecondary}`}
                         title="Print / Save PDF"
                      >
                         <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => updateInvoiceStatus(inv.id, inv.status === 'Paid' ? InvoiceStatus.Unpaid : InvoiceStatus.Paid)}
                        className={`p-2 rounded ${inv.status === 'Paid' ? 'text-emerald-500' : 'text-zinc-500 hover:text-emerald-500'}`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                   </td>
                 </tr>
                 {aiDraft?.id === inv.id && (
                  <tr>
                    <td colSpan={6} className="bg-zinc-900/50 p-4">
                      <div className="bg-white border rounded-lg p-4 relative text-slate-800">
                        <h4 className="text-xs font-bold text-indigo-600 uppercase mb-2">AI Drafted Email</h4>
                        <p className="text-sm whitespace-pre-wrap">{aiDraft.text}</p>
                        <button onClick={() => setAiDraft(null)} className="absolute top-2 right-2 text-slate-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )}
                 </React.Fragment>
               );
            })}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderExpenses = () => (
    <>
      <div className="flex justify-end mb-4">
         <button onClick={() => setIsAddingExpense(true)} className={`px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 ${accentColor}`}>
           <Plus className="w-4 h-4" /> Log Expense
         </button>
      </div>
      <div className={`${cardBg} rounded-xl border overflow-hidden`}>
        <table className="w-full text-left">
          <thead className={`text-xs uppercase font-bold tracking-wider ${tableHeader}`}>
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Description</th>
              <th className="p-4">Category</th>
              <th className="p-4">Client (Optional)</th>
              <th className="p-4">Amount</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${borderColor}`}>
            {filteredExpenses.map(exp => {
              const client = clients.find(c => c.id === exp.clientId);
              return (
                <tr key={exp.id} className={isBaby ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/50'}>
                  <td className={`p-4 text-sm ${textSecondary}`}>{new Date(exp.date).toLocaleDateString()}</td>
                  <td className={`p-4 font-medium ${textPrimary}`}>{exp.description}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-zinc-800 text-zinc-400`}>
                      {exp.category}
                    </span>
                  </td>
                  <td className={`p-4 text-sm ${textSecondary}`}>{client ? client.name : '-'}</td>
                  <td className={`p-4 font-bold ${textPrimary}`}>₹{exp.amount.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => deleteExpense(exp.id)} className="text-zinc-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
           <h1 className={`text-2xl font-bold ${textPrimary}`}>Finance Manager</h1>
           <p className={textSecondary}>Track revenue, expenses, and project profitability.</p>
         </div>
         {/* Tabs */}
         <div className={`flex p-1 rounded-lg border ${cardBg}`}>
           {['overview', 'invoices', 'expenses', 'profitability'].map(tab => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
                 activeTab === tab 
                   ? (isBaby ? 'bg-blue-100 text-blue-700' : 'bg-zinc-700 text-white') 
                   : (isBaby ? 'text-slate-500 hover:bg-slate-50' : 'text-zinc-500 hover:text-zinc-300')
               }`}
             >
               {tab}
             </button>
           ))}
         </div>
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'invoices' && renderInvoices()}
      {activeTab === 'expenses' && renderExpenses()}
      {activeTab === 'profitability' && renderProfitability()}

      {/* Invoice Modal */}
      {isCreatingInvoice && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 text-slate-900">
             <h2 className="text-xl font-bold mb-4">Create New Invoice</h2>
             <form onSubmit={handleInvoiceSubmit}>
               <div className="grid grid-cols-2 gap-4 mb-4">
                 <select required className="border p-2 rounded" value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
                   <option value="">Select Client</option>
                   {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
                 <input type="date" required className="border p-2 rounded" value={dueDate} onChange={e => setDueDate(e.target.value)} />
               </div>
               <div className="space-y-2 mb-4">
                 {invoiceItems.map(item => (
                   <div key={item.id} className="flex gap-2">
                     <input className="border p-2 rounded flex-1" placeholder="Item" value={item.description} onChange={e => setInvoiceItems(invoiceItems.map(i => i.id === item.id ? {...i, description: e.target.value} : i))} />
                     <input type="number" className="border p-2 rounded w-24" placeholder="Qty" value={item.quantity} onChange={e => setInvoiceItems(invoiceItems.map(i => i.id === item.id ? {...i, quantity: Number(e.target.value)} : i))} />
                     <input type="number" className="border p-2 rounded w-32" placeholder="Price" value={item.price} onChange={e => setInvoiceItems(invoiceItems.map(i => i.id === item.id ? {...i, price: Number(e.target.value)} : i))} />
                   </div>
                 ))}
                 <button type="button" onClick={() => setInvoiceItems([...invoiceItems, {id: Date.now().toString(), description: '', quantity: 1, price: 0}])} className="text-sm text-blue-600 font-bold">+ Add Line Item</button>
               </div>
               <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsCreatingInvoice(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-black text-white rounded">Create Invoice</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {isAddingExpense && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 text-slate-900">
             <h2 className="text-xl font-bold mb-4">Log New Expense</h2>
             <form onSubmit={handleExpenseSubmit} className="space-y-4">
               <div>
                 <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
                 <input placeholder="e.g. Photography Team Payment" required className="w-full border p-2 rounded" value={newExpense.description || ''} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Amount (₹)</label>
                    <input type="number" required className="w-full border p-2 rounded" value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Date</label>
                    <input type="date" required className="w-full border p-2 rounded" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category</label>
                    <select className="w-full border p-2 rounded" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value as any})}>
                      <option value="Vendor">Vendor Payment</option>
                      <option value="Labor">Labor / Staff</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Travel">Travel</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Brand</label>
                    <select className="w-full border p-2 rounded" value={newExpense.brand} onChange={e => setNewExpense({...newExpense, brand: e.target.value as any})}>
                      <option value="Aaha Kalayanam">Aaha Kalayanam</option>
                      <option value="Tiny Toes">Tiny Toes</option>
                    </select>
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Link to Client (Optional)</label>
                  <select className="w-full border p-2 rounded" value={newExpense.clientId || ''} onChange={e => setNewExpense({...newExpense, clientId: e.target.value})}>
                    <option value="">General (No specific client)</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.brand})</option>)}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Linking to a client helps calculate project profitability.</p>
               </div>
               <div className="flex justify-end gap-2 mt-6">
                  <button type="button" onClick={() => setIsAddingExpense(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-black text-white rounded">Save Expense</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* Hidden Printable Invoice Template */}
      {printInvoice && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black">
          <div className="max-w-3xl mx-auto border p-8">
            <div className="flex justify-between items-start mb-12">
               <div>
                 <h1 className="text-3xl font-bold font-serif mb-2">AP Co.</h1>
                 <p className="text-sm text-gray-600">Aaha Kalayanam & Tiny Toes</p>
                 <p className="text-sm text-gray-600 mt-4">123 Event Street, Chennai, India</p>
                 <p className="text-sm text-gray-600">contact@apco.in | +91 98765 43210</p>
               </div>
               <div className="text-right">
                 <h2 className="text-4xl font-light text-gray-300 mb-4">INVOICE</h2>
                 <p className="font-bold"># {printInvoice.id}</p>
                 <p className="text-sm text-gray-600">Date: {new Date(printInvoice.issueDate).toLocaleDateString()}</p>
                 <p className="text-sm text-gray-600">Due: {new Date(printInvoice.dueDate).toLocaleDateString()}</p>
               </div>
            </div>

            <div className="mb-12">
              <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Bill To</h3>
              <p className="font-bold text-xl">{clients.find(c => c.id === printInvoice.clientId)?.name}</p>
              <p className="text-gray-600">{clients.find(c => c.id === printInvoice.clientId)?.email}</p>
              <p className="text-gray-600">{clients.find(c => c.id === printInvoice.clientId)?.phone}</p>
            </div>

            <table className="w-full mb-12">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-2">Description</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {printInvoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-4">{item.description}</td>
                    <td className="text-right py-4">{item.quantity}</td>
                    <td className="text-right py-4">₹{item.price.toLocaleString('en-IN')}</td>
                    <td className="text-right py-4">₹{(item.quantity * item.price).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mb-12">
              <div className="text-right">
                <p className="text-xl font-bold">Total: ₹{calculateTotal(printInvoice.items).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="border-t pt-8 text-center text-sm text-gray-500">
               <p>Thank you for your business!</p>
               <p className="mt-2">Bank Details: AP Co. | Acc: 123456789 | IFSC: ABCD012345</p>
            </div>
          </div>
          {/* Close button for when it might accidentally show up in non-print contexts or for testing */}
          <button onClick={() => setPrintInvoice(null)} className="print:hidden fixed top-4 right-4 bg-black text-white p-2 rounded">
             <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FinanceManager;
