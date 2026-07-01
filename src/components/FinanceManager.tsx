import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  Plus, Trash2, FileText, TrendingDown, X, Calculator, FileQuestion, Loader2, Eye
} from 'lucide-react';
import { api } from '../services/api';
import { type Invoice, type Expense, type Client, type CompanyProfile, InvoiceStatus, type ApprovalRecord } from '../types';
import { advanceProjectWorkflow } from '../utils/workflowEngine';
import { DocumentPreviewModal } from './DocumentPreviewModal';

interface FinanceManagerProps {
  invoices: Invoice[];
  expenses: Expense[];
  clients: Client[];
  companies: CompanyProfile[];
  selectedBrand: string | 'All';
  userRole: 'Admin' | 'Staff' | 'Client' | 'none';
}

interface FinancialRecord {
  id: string;
  date: string;
  description: string;
  client: string;
  brand: string;
  amount: number;
  status: string;
  type: 'income' | 'quotation' | 'expense';
  source: 'api_inv' | 'expense';
  metadata: any;
}

const FinanceManager: React.FC<FinanceManagerProps> = ({
  invoices, expenses, clients, companies, selectedBrand, userRole
}) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isRevenue = location.pathname === '/revenue';
  const [activeTab, setActiveTab] = useState<'all' | 'unpaid' | 'paid' | 'quotations' | 'expenses' | 'approvals'>(
    (searchParams.get('filter') as any) || 'all'
  );

  React.useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter && ['all', 'unpaid', 'paid', 'quotations', 'expenses', 'approvals'].includes(filter)) {
      setActiveTab(filter as any);
    }
  }, [searchParams]);

  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);

  const fetchApprovals = async () => {
    const apps = await api.getApprovals();
    setApprovals(apps);
  };

  React.useEffect(() => {
    fetchApprovals();
    const handleSync = () => fetchApprovals();
    window.addEventListener('finance-updated', handleSync);
    return () => window.removeEventListener('finance-updated', handleSync);
  }, []);

  const [activeVerificationScreenshot, setActiveVerificationScreenshot] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [fadingId, setFadingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, id: string | null, type: 'entry' | 'expense' | null }>({ isOpen: false, id: null, type: null });
  const [localExpenses, setLocalExpenses] = useState<Expense[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [entryForm, setEntryForm] = useState({ date: new Date().toISOString().split('T')[0], client: '', desc: '', amount: 0, status: 'Unpaid', type: 'invoice', brand: 'AAHA Kalyanam' });
  const [previewDoc, setPreviewDoc] = useState<Invoice | null>(null);
  const [newExpense, setNewExpense] = useState<{ category: string; amount: number; description: string; client: string; brand?: string }>({
    category: 'Production',
    amount: 0,
    description: '',
    client: 'General',
    brand: 'AAHA Kalyanam'
  });

  const showToast = (message: string) => { setToast({ message, visible: true }); setTimeout(() => setToast({ message: '', visible: false }), 3000); };

  React.useEffect(() => {
    if (deleteModal.isOpen || isCreating || isExpenseModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [deleteModal.isOpen, isCreating, isExpenseModalOpen]);

  React.useEffect(() => {
    setLocalExpenses(expenses);
  }, [expenses]);

  const combinedExpenses = Array.from(new Map([...expenses, ...localExpenses].map(e => [e.id, e])).values());
  const allBrands = Array.from(new Set(companies.map(c => c.companyName)));

  const unifiedRecords = useMemo(() => {
    const records: FinancialRecord[] = [];

    invoices.forEach(inv => {
      if (selectedBrand !== 'All' && inv.brandId !== selectedBrand && inv.brand !== selectedBrand) return;

      const totalAmt = inv.totalAmount || inv.amount || 0;

      const isQuote = inv.isQuotation || inv.type === 'quotation' || ['Quotation', 'Draft', 'Approved'].includes(inv.status);

      records.push({
        id: String(inv.id),
        date: inv.issueDate || inv.createdAt || '',
        description: isQuote ? `Quotation: ${inv.id}` : `Invoice: ${inv.id}`,
        client: inv.client?.name || clients.find(c => String(c.id) === String(inv.clientId))?.name || 'Unknown Client',
        brand: inv.brand || 'General',
        amount: totalAmt,
        status: inv.status || 'Unpaid',
        type: isQuote ? 'quotation' : 'income',
        source: 'api_inv',
        metadata: inv
      });
    });

    combinedExpenses.forEach(exp => {
      if (selectedBrand !== 'All' && exp.brand !== selectedBrand) return;

      records.push({
        id: String(exp.id),
        date: exp.date,
        description: exp.description,
        client: exp.client || 'N/A',
        brand: exp.brand || 'General',
        amount: Number(exp.amount),
        status: 'Paid',
        type: 'expense',
        source: 'expense',
        metadata: exp
      });
    });

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, combinedExpenses, selectedBrand, clients]);

  const filteredRecords = useMemo(() => {
    return unifiedRecords.filter(r => {
      if (activeTab === 'all') return true;
      if (activeTab === 'unpaid') return r.type === 'income' && r.status.toLowerCase() === 'unpaid';
      if (activeTab === 'paid') return r.type === 'income' && r.status.toLowerCase() === 'paid';
      if (activeTab === 'quotations') return r.type === 'quotation';
      if (activeTab === 'expenses') return r.type === 'expense';
      if (activeTab === 'approvals') return false; // approvals handled separately
      return true;
    });
  }, [unifiedRecords, activeTab]);

  const pendingApprovalsCount = approvals.filter(a => a.status === 'Pending Approval').length;
  
  const approvedToday = approvals.filter(a => a.status === 'Approved' && new Date(a.auditTrail?.approvedDate || '').toDateString() === new Date().toDateString()).length;
  const rejectedToday = approvals.filter(a => a.status === 'Rejected' && new Date(a.auditTrail?.rejectedDate || '').toDateString() === new Date().toDateString()).length;
  const totalApprovalValue = approvals.filter(a => a.status === 'Pending Approval').reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

  const totalRevenue = unifiedRecords.filter(r => r.type === 'income' && r.status.toLowerCase() === 'paid').reduce((s, r) => s + r.amount, 0);
  const totalExpenses = unifiedRecords.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const handleGenerateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const newDoc: Invoice = {
      id: `AK-TEMP-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`,
      clientId: entryForm.client,
      brand: entryForm.brand,
      brandId: companies.find(c => c.companyName === entryForm.brand)?.id || 'All',
      amount: entryForm.amount,
      totalAmount: entryForm.amount,
      status: entryForm.status as InvoiceStatus,
      type: entryForm.type as 'invoice' | 'quotation',
      isQuotation: entryForm.type === 'quotation',
      items: [{ id: '1', description: entryForm.desc, quantity: 1, price: entryForm.amount }],
      createdAt: entryForm.date,
      issueDate: entryForm.date,
      dueDate: entryForm.date,
    };

    try {
      await api.saveInvoice(newDoc);
      setIsCreating(false);
      setEntryForm({ date: new Date().toISOString().split('T')[0], client: '', desc: '', amount: 0, status: 'Unpaid', type: 'invoice', brand: 'AAHA Kalyanam' });
      window.dispatchEvent(new CustomEvent('finance-updated'));
    } catch (err) {
      console.error(err);
      alert("Failed to save entry");
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const expenseToSave = {
      id: `EXP-${new Date().getTime().toString().slice(-6)}`,
      description: newExpense.description,
      amount: Number(newExpense.amount),
      date: new Date().toISOString(),
      category: newExpense.category,
      brand: newExpense.brand || allBrands[0] || 'General'
    };
    try {
      await api.saveExpense(expenseToSave);
      showToast("Expense saved");
      setIsExpenseModalOpen(false);
      window.dispatchEvent(new CustomEvent('finance-updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprovePayment = async (inv: Invoice) => {
    try {
      const updatedInvoice = {
        ...inv,
        status: 'Paid' as InvoiceStatus,
        paidAmount: inv.totalAmount,
        paymentVerification: inv.paymentVerification ? { ...inv.paymentVerification, status: 'approved' as const } : undefined
      };
      await api.saveInvoice(updatedInvoice);

      // Advance workflow if this is the advance invoice
      const isAdvance = updatedInvoice.id.toLowerCase().includes('adv') || (updatedInvoice.totalAmount && updatedInvoice.totalAmount > 0);
      if (updatedInvoice.project?.id || updatedInvoice.clientId) {
        try {
          const projects = await api.getProjects();
          const proj = projects.find((p: any) => p.id === updatedInvoice.project?.id || p.clientId === updatedInvoice.clientId);
          if (proj && isAdvance) {
            await advanceProjectWorkflow(proj.id, 'Advance Paid', `Payment approved for invoice ${updatedInvoice.id}`);
          }
        } catch (err) {
          console.error("Failed to advance project workflow on payment approval:", err);
        }
        
        // Log timeline activity
        try {
          const clientData = await api.getClientById(updatedInvoice.clientId);
          if (clientData) {
            const timelineEvent = {
               id: new Date().getTime().toString(),
               title: 'Payment Approved',
               description: `Admin approved payment of ₹${updatedInvoice.totalAmount?.toLocaleString('en-IN')} for Invoice ${updatedInvoice.id}`,
               date: new Date().toISOString(),
               status: 'Completed' as const,
               category: 'finance'
            };
            const updatedClient = {
               ...clientData,
               portal: {
                  ...clientData.portal,
                  timeline: [...(clientData.portal?.timeline || []), timelineEvent],
                  deliverables: clientData.portal?.deliverables || [],
                  internalSpends: clientData.portal?.internalSpends || []
               }
            };
            await api.saveClient(updatedClient);
          }
        } catch (err) {
          console.error("Failed to save timeline activity on payment approval:", err);
        }
      }

      showToast("Payment Approved & Workflow Advanced");
      window.dispatchEvent(new CustomEvent('finance-updated'));
    } catch (err) {
      console.error(err);
      alert("Failed to approve payment");
    }
  };

  const handleRejectPayment = async (inv: Invoice) => {
    try {
      const updatedInvoice = {
        ...inv,
        status: 'Unpaid' as InvoiceStatus,
        paymentVerification: inv.paymentVerification ? { ...inv.paymentVerification, status: 'rejected' as const } : undefined
      };
      await api.saveInvoice(updatedInvoice);
      
      // Log timeline activity
      try {
        const clientData = await api.getClientById(updatedInvoice.clientId);
        if (clientData) {
          const timelineEvent = {
             id: new Date().getTime().toString(),
             title: 'Payment Rejected',
             description: `Payment verification for Invoice ${updatedInvoice.id} was rejected. Please re-submit.`,
             date: new Date().toISOString(),
             status: 'Pending' as const,
             category: 'finance'
          };
          const updatedClient = {
             ...clientData,
             portal: {
                ...clientData.portal,
                timeline: [...(clientData.portal?.timeline || []), timelineEvent],
                deliverables: clientData.portal?.deliverables || [],
                internalSpends: clientData.portal?.internalSpends || []
             }
          };
          await api.saveClient(updatedClient);
        }
      } catch (err) {
        console.error("Failed to save timeline activity on payment rejection:", err);
      }
      
      showToast("Payment Rejected");
      window.dispatchEvent(new CustomEvent('finance-updated'));
    } catch (err) {
      console.error(err);
    }
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

      {userRole !== 'Staff' && activeTab !== 'approvals' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          <div className="glass-panel p-5 md:p-8 squircle-lg bg-white/5 border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full group-hover:bg-white/10 transition-all" />
            <div className="flex justify-between items-start mb-6 md:mb-8 relative z-10">
              <div className="p-3 bg-white/10 rounded-xl text-white shadow-lg shadow-black/50"><TrendingDown className="w-5 h-5 group-hover:rotate-12 transition-transform" /></div>
              <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-3 py-1 bg-white/5 rounded-lg border border-white/10">Gross Revenue</span>
            </div>
            <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter font-mono"><span className="text-xl md:text-2xl text-zinc-500">₹</span>{(totalRevenue / 100000).toFixed(2)}<span className="text-xl md:text-2xl text-zinc-500">L</span></h3>
          </div>
          <div className="glass-panel p-5 md:p-8 squircle-lg bg-red-600/5 border-red-500/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full" />
            <div className="flex justify-between items-start mb-6 md:mb-8 relative z-10">
              <div className="p-3 bg-red-500/10 rounded-xl text-red-500 shadow-lg shadow-red-500/10"><TrendingDown className="w-5 h-5" /></div>
              <span className="text-[9px] font-black uppercase text-red-500 tracking-widest px-3 py-1 bg-red-500/10 rounded-lg">Spend</span>
            </div>
            <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter font-mono"><span className="text-xl md:text-2xl text-zinc-500">₹</span>{(totalExpenses).toLocaleString('en-IN')}</h3>
          </div>
          <div className="glass-panel p-5 md:p-8 squircle-lg bg-emerald-600/5 border-primary/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
            <div className="flex justify-between items-start mb-6 md:mb-8 relative z-10">
              <div className="p-3 bg-primary/10 rounded-xl text-primary shadow-lg shadow-emerald-500/10"><Calculator className="w-5 h-5" /></div>
              <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest px-3 py-1 bg-primary/10 rounded-lg">Net</span>
            </div>
            <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter font-mono"><span className="text-xl md:text-2xl text-zinc-500">₹</span>{(netProfit).toLocaleString('en-IN')}</h3>
          </div>
        </div>
      )}

      {userRole !== 'Staff' && activeTab === 'approvals' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-6 rounded-2xl bg-amber-500/5 border-amber-500/10 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="text-[9px] font-black uppercase text-amber-500 tracking-widest">Pending</span>
            </div>
            <h3 className="text-3xl font-black text-white tracking-tighter font-mono">{pendingApprovalsCount}</h3>
          </div>
          <div className="glass-panel p-6 rounded-2xl bg-primary/5 border-primary/10 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="text-[9px] font-black uppercase text-primary tracking-widest">Approved Today</span>
            </div>
            <h3 className="text-3xl font-black text-white tracking-tighter font-mono">{approvedToday}</h3>
          </div>
          <div className="glass-panel p-6 rounded-2xl bg-red-500/5 border-red-500/10 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="text-[9px] font-black uppercase text-red-500 tracking-widest">Rejected Today</span>
            </div>
            <h3 className="text-3xl font-black text-white tracking-tighter font-mono">{rejectedToday}</h3>
          </div>
          <div className="glass-panel p-6 rounded-2xl bg-white/5 border-white/10 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Pending Value</span>
            </div>
            <h3 className="text-3xl font-black text-white tracking-tighter font-mono"><span className="text-lg text-zinc-500">₹</span>{(totalApprovalValue / 100000).toFixed(2)}<span className="text-lg text-zinc-500">L</span></h3>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-6">
          <div className="flex bg-zinc-900/50 p-1.5 rounded-[1.2rem] border border-white/5 overflow-x-auto max-w-full relative">
            {['all', 'unpaid', 'paid', 'quotations', 'expenses', 'approvals'].map(t => (
              <button
                key={t} onClick={() => setActiveTab(t as any)}
                className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap relative ${activeTab === t ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'} touch-target`}
              >
                {t === 'approvals' ? 'Approvals' : t}
                {t === 'approvals' && pendingApprovalsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">{pendingApprovalsCount}</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            {userRole !== 'Client' && (
              <button onClick={() => activeTab === 'expenses' ? setIsExpenseModalOpen(true) : setIsCreating(true)} className="bg-white text-black px-6 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-xl active:scale-95 whitespace-nowrap touch-target">
                <Plus className="w-4 h-4" /> {activeTab === 'expenses' ? 'Log Expense' : 'Create Bill / Quote'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {activeTab === 'approvals' ? 
            approvals.map(app => (
              <div key={app.id} className="glass-panel p-5 md:p-8 squircle-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 group hover:bg-white/5 transition-all border border-white/5 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-1.5 h-full opacity-30 ${app.status === 'Approved' ? 'bg-primary' : app.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <div className="flex items-center gap-4 md:gap-6">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border shadow-lg ${app.status === 'Approved' ? 'bg-primary/10 border-primary/20 text-primary' : app.status === 'Rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                    <FileQuestion className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-base md:text-lg uppercase tracking-tight text-white">{app.clientName}</h4>
                    <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest mt-1">{app.type} • {app.brandName}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-8 mt-2 md:mt-0">
                  <div className="text-right">
                    <p className="text-xl font-black text-white font-mono">₹{app.amount.toLocaleString('en-IN')}</p>
                    <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest mt-1">{app.status} • {new Date(app.submissionDate).toLocaleDateString()}</p>
                  </div>
                  {app.status === 'Pending Approval' ? (
                    <div className="flex flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                      <div className="text-left text-xs bg-black/40 p-3 rounded-xl border border-white/5 mb-2">
                        {app.metadata?.paymentVerification?.utrNumber && <p className="font-mono text-zinc-300">UTR: <span className="text-white font-bold">{app.metadata.paymentVerification.utrNumber}</span></p>}
                        {app.metadata?.paymentVerification?.screenshot && (
                          <button onClick={() => setActiveVerificationScreenshot(app.metadata.paymentVerification.screenshot)} className="text-[9px] uppercase tracking-widest text-blue-400 font-bold mt-1 hover:underline">View Screenshot</button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={async () => {
                          const user = JSON.parse(localStorage.getItem('authUser') || '{}');
                          const userName = user.name || user.email?.split('@')[0] || 'System Admin';
                          const updated = { ...app, status: 'Approved' as const, auditTrail: { ...app.auditTrail, approvedDate: new Date().toISOString(), approvedBy: userName } };
                          await api.saveApproval(updated);
                          if (app.type === 'Client Payment Proof Approval') await handleApprovePayment(app.metadata);
                          window.dispatchEvent(new CustomEvent('finance-updated'));
                        }} className="touch-target flex-1 px-4 py-2 bg-primary/20 text-primary hover:bg-primary hover:text-black rounded-lg font-black text-[9px] uppercase tracking-widest transition-colors border border-primary/30">Approve</button>
                        <button onClick={async () => {
                          const user = JSON.parse(localStorage.getItem('authUser') || '{}');
                          const userName = user.name || user.email?.split('@')[0] || 'System Admin';
                          const notes = prompt("Enter rejection reason (optional):");
                          const updated = { ...app, status: 'Rejected' as const, notes: notes || '', auditTrail: { ...app.auditTrail, rejectedDate: new Date().toISOString(), rejectedBy: userName, notes: notes || '' } };
                          await api.saveApproval(updated);
                          if (app.type === 'Client Payment Proof Approval') await handleRejectPayment(app.metadata);
                          window.dispatchEvent(new CustomEvent('finance-updated'));
                        }} className="touch-target flex-1 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-colors border border-red-500/20">Reject</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col text-right">
                      <p className="text-[9px] uppercase tracking-widest text-zinc-500">
                         {app.status === 'Approved' ? 'Approved By' : 'Rejected By'}
                      </p>
                      <p className="text-[10px] font-bold text-white mt-1 mb-1">
                         {app.status === 'Approved' ? app.auditTrail?.approvedBy : app.auditTrail?.rejectedBy || 'Admin'}
                      </p>
                      <p className="text-[8px] uppercase tracking-widest text-zinc-600">
                         {new Date(app.auditTrail?.approvedDate || app.auditTrail?.rejectedDate || '').toLocaleString()}
                      </p>
                      {app.notes && (
                         <p className="text-[9px] font-medium text-amber-500 mt-2 max-w-[150px] truncate" title={app.notes}>
                            Note: {app.notes}
                         </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
           : 
            filteredRecords.map(record => {
              const isExpense = record.type === 'expense';
              const isQuote = record.type === 'quotation';
              const isPaid = record.status.toLowerCase() === 'paid';

            return (
              <div
                key={`${record.source}-${record.id}`}
                className={`glass-panel p-5 md:p-8 squircle-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 group hover:bg-white/5 transition-all border border-white/5 relative overflow-hidden ${fadingId === record.id ? 'animate-fade-out' : ''}`}
              >
                <div className={`absolute top-0 right-0 w-1.5 h-full opacity-30 ${isExpense ? 'bg-red-500' : isQuote ? 'bg-zinc-500' : isPaid ? 'bg-primary' : 'bg-amber-500'}`} />

                <div className="flex items-center gap-4 md:gap-6">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border shadow-lg ${isExpense ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                    isQuote ? 'bg-zinc-800 border-white/10 text-zinc-400' :
                      'bg-amber-500/10 border-amber-500/20 text-amber-500'
                    }`}>
                    {isExpense ? <TrendingDown className="w-5 h-5 md:w-6 md:h-6" /> : isQuote ? <FileQuestion className="w-5 h-5 md:w-6 md:h-6" /> : <FileText className="w-5 h-5 md:w-6 md:h-6" />}
                  </div>
                  <div>
                    <h4 className="font-black text-base md:text-lg uppercase tracking-tight text-white">{record.client}</h4>
                    <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest mt-1">{record.type} • {record.brand}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-8 mt-2 md:mt-0">
                  <div className="text-right">
                    <p className="text-xl font-black text-white font-mono">₹{record.amount.toLocaleString('en-IN')}</p>
                    <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest mt-1">{record.status} • {new Date(record.date).toLocaleDateString()}</p>
                  </div>

                  {userRole !== 'Client' && (
                      <div className="flex gap-2">
                        {!isExpense && (
                          <button onClick={() => setPreviewDoc(record.metadata)} className="touch-target p-3 bg-white/5 text-blue-400 hover:text-white rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                        )}
                        {!isExpense && !isQuote && !isPaid && (
                          <button onClick={async () => {
                            const updated = { ...record.metadata, status: 'Paid' };
                            await api.saveInvoice(updated);
                            window.dispatchEvent(new CustomEvent('finance-updated'));
                          }} className="touch-target px-4 py-3 bg-primary text-black rounded-lg font-black text-[9px] uppercase tracking-widest">Mark Paid</button>
                        )}
                        {isQuote && (
                          <button onClick={async () => {
                            const updated = { ...record.metadata, type: 'invoice', isQuotation: false, status: 'Unpaid' };
                            await api.saveInvoice(updated);
                            window.dispatchEvent(new CustomEvent('finance-updated'));
                          }} className="touch-target px-4 py-3 bg-primary text-white rounded-lg font-black text-[9px] uppercase tracking-widest">To Invoice</button>
                        )}
                        <button onClick={() => setDeleteModal({ isOpen: true, id: record.id, type: isExpense ? 'expense' : 'entry' })} className="touch-target p-3 bg-white/5 text-zinc-500 hover:text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                </div>
              </div>
            );
          })}
          
          {activeTab === 'approvals' && approvals.length === 0 && (
            <div className="glass-panel p-12 squircle-lg text-center flex flex-col items-center justify-center border-white/5">
              <FileText className="w-12 h-12 text-zinc-700 mb-4" />
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">No Pending Approvals</h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2 max-w-sm">All financial operations are up to date. No approvals require action.</p>
            </div>
          )}
        </div>
      </div>

      {isCreating && createPortal(
        <div
          className="fixed inset-0 bg-black/90 md:bg-black/70 z-[9999] flex items-center justify-center p-0 md:p-4 pt-safe md:pt-4 backdrop-blur-md md:backdrop-blur-sm animate-ios-fade-in"
          onClick={() => setIsCreating(false)}
        >
          <div
            className="glass-panel rounded-none md:rounded-2xl w-full h-full md:h-auto md:max-w-xl p-6 md:p-10 shadow-2xl animate-ios-slide-up relative overflow-y-auto pb-safe md:pb-10 no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">Finance Registry</h2>
              <button onClick={() => setIsCreating(false)} className="touch-target p-2 bg-white/5 rounded-full"><X className="w-6 h-6 text-zinc-500" /></button>
            </div>

            <form onSubmit={handleGenerateEntry} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-600">Client</label>
                  <select required className="w-full bg-black border border-white/5 rounded-xl p-4 text-sm font-bold" value={entryForm.client} onChange={e => setEntryForm({ ...entryForm, client: e.target.value })}>
                    <option value="">Select Client...</option>
                    {clients.map(c => <option key={String(c.id)} value={c.name || c.projectName}>{c.name || c.projectName}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-600">Brand</label>
                  <select required className="w-full bg-black border border-white/5 rounded-xl p-4 text-sm font-bold" value={entryForm.brand} onChange={e => setEntryForm({ ...entryForm, brand: e.target.value })}>
                    {companies.map(c => <option key={c.id} value={c.companyName}>{c.companyName}</option>)}
                  </select>
                </div>
              </div>
              <input required className="w-full bg-black border border-white/5 rounded-xl p-4 text-sm font-bold" placeholder="Description" value={entryForm.desc} onChange={e => setEntryForm({ ...entryForm, desc: e.target.value })} />
              <div className="grid grid-cols-3 gap-4">
                <input type="number" required className="w-full bg-black border border-white/5 rounded-xl p-4 text-sm font-bold" placeholder="Amount" value={entryForm.amount || ''} onChange={e => setEntryForm({ ...entryForm, amount: Number(e.target.value) })} />
                <select className="w-full bg-black border border-white/5 rounded-xl p-4 text-sm font-bold" value={entryForm.type} onChange={e => setEntryForm({ ...entryForm, type: e.target.value as any })}>
                  <option value="invoice">Invoice</option>
                  <option value="quotation">Quotation</option>
                </select>
                <select className="w-full bg-black border border-white/5 rounded-xl p-4 text-sm font-bold" value={entryForm.status} onChange={e => setEntryForm({ ...entryForm, status: e.target.value })}>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <button type="submit" className="w-full py-5 bg-white text-black font-black uppercase text-[11px] rounded-2xl tracking-widest shadow-xl mt-4">Record Transaction</button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {isExpenseModalOpen && createPortal(
        <div
          className="fixed inset-0 bg-black/90 md:bg-black/70 z-[9999] flex items-center justify-center p-0 md:p-4 pt-safe md:pt-4 backdrop-blur-md md:backdrop-blur-sm animate-ios-fade-in"
          onClick={() => setIsExpenseModalOpen(false)}
        >
          <div
            className="glass-panel rounded-none md:rounded-2xl w-full h-full md:h-auto md:max-w-lg p-6 md:p-10 shadow-2xl animate-ios-slide-up relative overflow-y-auto pb-safe md:pb-10 no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">Log Expense</h2>
              <button onClick={() => setIsExpenseModalOpen(false)} className="touch-target p-2 bg-white/5 rounded-full"><X className="w-6 h-6 text-zinc-500" /></button>
            </div>
            <form onSubmit={handleExpenseSubmit} className="space-y-6">
              <input required className="w-full bg-black border border-white/5 rounded-xl p-4 text-sm font-bold" placeholder="Description" value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" required className="bg-black border border-white/5 rounded-xl p-4 text-sm font-bold" placeholder="Amount" value={newExpense.amount || ''} onChange={e => setNewExpense({ ...newExpense, amount: Number(e.target.value) })} />
                <select className="bg-black border border-white/5 rounded-xl p-4 text-sm font-bold w-full" value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}>
                  <option value="Production">Production</option>
                  <option value="Travel">Travel</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Office">Office</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-600 px-1 tracking-widest">Entity</label>
                <select required className="w-full bg-black border border-white/5 rounded-xl p-4 text-sm font-bold" value={newExpense.brand} onChange={e => setNewExpense({ ...newExpense, brand: e.target.value })}>
                  {companies.map(c => <option key={c.id} value={c.companyName}>{c.companyName}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-5 bg-white text-black font-black uppercase text-[11px] rounded-2xl tracking-widest shadow-xl mt-4">Commit Transaction</button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {deleteModal.isOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
          <div className="bg-zinc-900 border border-white/10 p-10 rounded-[2rem] text-center max-w-sm">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Confirm Deletion</h3>
            <div className="flex gap-4">
              <button
                disabled={isDeleting}
                onClick={() => setDeleteModal({ isOpen: false, id: null, type: null })}
                className="flex-1 py-4 bg-white/5 text-white rounded-xl font-black uppercase text-[10px] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={async () => {
                  const targetId = deleteModal.id!;
                  const targetType = deleteModal.type!;
                  setIsDeleting(true);
                  setFadingId(targetId);
                  setTimeout(async () => {
                    try {
                      if (targetType === 'expense') await api.deleteExpense(targetId);
                      else await api.deleteInvoice(targetId);
                      window.dispatchEvent(new CustomEvent('finance-updated'));
                    } catch (err) { console.error(err); }
                    setDeleteModal({ isOpen: false, id: null, type: null });
                    setIsDeleting(false);
                    setFadingId(null);
                  }, 300);
                }} className="flex-1 py-4 bg-red-500 text-white rounded-xl font-black uppercase text-[10px] disabled:opacity-50 flex items-center justify-center gap-2">
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Removing...
                  </>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {toast.visible && (
        <div className="fixed bottom-4 right-4 bg-primary text-white px-6 py-4 rounded-xl shadow-2xl font-black uppercase text-[10px] tracking-widest z-[200]">
          {toast.message}
        </div>
      )}

      {activeVerificationScreenshot && createPortal(
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setActiveVerificationScreenshot(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setActiveVerificationScreenshot(null)} className="absolute -top-12 right-0 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white"><X size={24} /></button>
            <img src={activeVerificationScreenshot} alt="Payment Screenshot" className="max-w-full max-h-[85vh] object-contain rounded-xl border border-white/10" />
          </div>
        </div>,
        document.body
      )}

      {previewDoc && createPortal(
        <DocumentPreviewModal 
           documentData={previewDoc}
           client={clients.find(c => c.id === previewDoc.clientId) || {} as any}
           company={companies.find(c => c.companyName === previewDoc.brand) || companies.find(c => c.id === previewDoc.brandId) || companies[0]}
           type={previewDoc.isQuotation ? 'quote' : 'invoice'}
           onClose={() => setPreviewDoc(null)}
        />,
        document.body
      )}
    </div>
  );
};

export default FinanceManager;


