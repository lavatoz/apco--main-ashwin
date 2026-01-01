import React, { useState } from 'react';
import { Plus, Trash2, FileText, Send, CheckCircle2, Clock, IndianRupee } from 'lucide-react';
import type { Invoice, InvoiceStatus, Client, InvoiceItem, Brand } from '../types';
import { generateEmailDraft } from '../services/geminiService';

interface InvoiceManagerProps {
  invoices: Invoice[];
  clients: Client[];
  addInvoice: (invoice: Invoice) => void;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;
  selectedBrand: Brand | 'All';
}

const InvoiceManager: React.FC<InvoiceManagerProps> = ({ invoices, clients, addInvoice, updateInvoiceStatus, selectedBrand }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([{ id: '1', description: '', quantity: 1, price: 0 }]);
  const [dueDate, setDueDate] = useState('');
  
  const [aiDraft, setAiDraft] = useState<{ id: string, text: string } | null>(null);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  const filteredInvoices = selectedBrand === 'All' ? invoices : invoices.filter(i => i.brand === selectedBrand);

  const calculateTotal = (items: InvoiceItem[]) => items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    
    const client = clients.find(c => c.id === selectedClient);
    if (!client) return;

    const newInvoice: Invoice = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      clientId: selectedClient,
      issueDate: new Date().toISOString(),
      dueDate: dueDate || new Date().toISOString(),
      items: items,
      status: InvoiceStatus.Unpaid,
      brand: client.brand 
    };
    
    addInvoice(newInvoice);
    setIsCreating(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedClient('');
    setItems([{ id: '1', description: '', quantity: 1, price: 0 }]);
    setDueDate('');
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

  // Theming
  const isBaby = selectedBrand === 'Tiny Toes';
  const textPrimary = isBaby ? 'text-slate-900' : 'text-zinc-100';
  const textSecondary = isBaby ? 'text-slate-500' : 'text-zinc-500';
  const cardBg = isBaby ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800';
  const accentColor = isBaby ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-yellow-600 hover:bg-yellow-700 text-black';
  const tableHeader = isBaby ? 'bg-slate-50 text-slate-600' : 'bg-black text-zinc-500';
  const tableRowHover = isBaby ? 'hover:bg-slate-50' : 'hover:bg-zinc-800/50';
  const borderColor = isBaby ? 'border-slate-100' : 'border-zinc-800';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className={`text-2xl font-bold ${textPrimary}`}>Invoices</h1>
           <p className={textSecondary}>Manage payments for {selectedBrand === 'All' ? 'AP Co.' : selectedBrand}</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className={`${accentColor} px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors`}
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 text-slate-900">
            <h2 className="text-xl font-bold mb-6">New Invoice</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
                  <select 
                    required
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                  >
                    <option value="">Select Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.brand})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Line Items</label>
                {items.map((item) => (
                  <div key={item.id} className="flex gap-2 items-start">
                    <input 
                      placeholder="Description"
                      className="flex-1 border border-slate-300 rounded-lg p-2 text-sm"
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      required
                    />
                    <input 
                      type="number"
                      placeholder="Qty"
                      className="w-20 border border-slate-300 rounded-lg p-2 text-sm"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value))}
                      min="1"
                    />
                    <input 
                      type="number"
                      placeholder="Price"
                      className="w-28 border border-slate-300 rounded-lg p-2 text-sm"
                      value={item.price}
                      onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                    />
                    <button 
                      type="button" 
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-2 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={handleAddItem}
                  className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <div className="text-right">
                  <span className="text-sm text-slate-500">Total Amount</span>
                  <div className="text-2xl font-bold text-slate-900 flex items-center justify-end gap-1">
                    <IndianRupee className="w-5 h-5" />
                    {calculateTotal(items).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-zinc-800 font-medium"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice List */}
      <div className={`${cardBg} rounded-xl shadow-sm border overflow-hidden`}>
        <table className="w-full text-left">
          <thead className={`${tableHeader} text-xs font-semibold uppercase tracking-wider`}>
            <tr>
              <th className="p-4">Invoice ID</th>
              <th className="p-4">Brand</th>
              <th className="p-4">Client</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Due Date</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${borderColor}`}>
            {filteredInvoices.map((inv) => {
              const client = clients.find(c => c.id === inv.clientId);
              const total = calculateTotal(inv.items);
              const isOverdue = inv.status !== InvoiceStatus.Paid && new Date(inv.dueDate) < new Date();
              
              return (
                <React.Fragment key={inv.id}>
                <tr className={`${tableRowHover} transition-colors`}>
                  <td className={`p-4 font-mono text-sm ${textSecondary}`}>#{inv.id}</td>
                  <td className="p-4">
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-sm ${inv.brand === 'Aaha Kalayanam' ? 'bg-yellow-900/30 text-yellow-500' : 'bg-blue-100 text-blue-600'}`}>
                      {inv.brand === 'Aaha Kalayanam' ? 'Wedding' : 'Baby'}
                    </span>
                  </td>
                  <td className={`p-4 font-medium ${textPrimary}`}>{client?.name || 'Unknown'}</td>
                  <td className={`p-4 font-medium ${textPrimary}`}>₹{total.toLocaleString('en-IN')}</td>
                  <td className={`p-4 text-sm ${textSecondary}`}>{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td className="p-4">
                    <StatusBadge status={isOverdue ? InvoiceStatus.Overdue : inv.status} isBaby={isBaby} />
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    {inv.status !== InvoiceStatus.Paid && (
                      <button 
                        onClick={() => handleGenerateReminder(inv)}
                        className={`p-2 rounded-lg ${isBaby ? 'bg-indigo-50 text-indigo-600' : 'bg-zinc-800 text-zinc-300 hover:text-white'}`}
                        title="Generate Reminder Email"
                      >
                         {generatingFor === inv.id ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    )}
                    <button 
                       onClick={() => updateInvoiceStatus(inv.id, inv.status === InvoiceStatus.Paid ? InvoiceStatus.Unpaid : InvoiceStatus.Paid)}
                       className={`p-2 rounded-lg ${inv.status === InvoiceStatus.Paid ? (isBaby ? 'text-amber-600 bg-amber-50' : 'text-yellow-500 bg-yellow-900/20') : (isBaby ? 'text-emerald-600 bg-emerald-50' : 'text-emerald-400 bg-emerald-900/20')}`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
                {aiDraft?.id === inv.id && (
                  <tr>
                    <td colSpan={7} className="bg-zinc-900/50 p-4">
                      <div className="bg-white border rounded-lg p-4 relative text-slate-800">
                        <h4 className="text-xs font-bold text-indigo-600 uppercase mb-2">AI Drafted Email ({inv.brand})</h4>
                        <p className="text-sm whitespace-pre-wrap">{aiDraft.text}</p>
                        <button 
                          onClick={() => setAiDraft(null)} 
                          className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {filteredInvoices.length === 0 && (
          <div className={`p-8 text-center ${textSecondary}`}>No invoices found for this selection.</div>
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ status, isBaby }: { status: InvoiceStatus, isBaby: boolean }) => {
  const styles = {
    [InvoiceStatus.Paid]: isBaby ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-900/30 text-emerald-400 border border-emerald-900',
    [InvoiceStatus.Unpaid]: isBaby ? 'bg-slate-100 text-slate-700' : 'bg-zinc-800 text-zinc-400 border border-zinc-700',
    [InvoiceStatus.Overdue]: isBaby ? 'bg-red-100 text-red-700' : 'bg-red-900/30 text-red-400 border border-red-900',
    [InvoiceStatus.Draft]: 'bg-gray-100 text-gray-600',
  };
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
};

export default InvoiceManager;