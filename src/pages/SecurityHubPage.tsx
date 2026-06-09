import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, ShieldCheck, Download, Search } from 'lucide-react';
import { sha256 } from 'js-sha256';
import { api } from '../services/api';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { type Invoice, type Client } from '../types';
import { generateInvoicePDF } from '../utils/pdfGenerator';

import AnimatedDashboard from '../components/AnimatedDashboard';
import PdfProtectionCard from '../components/PdfProtectionCard';
import QRVerifyCard from '../components/QRVerifyCard';
import WatermarkPreview from '../components/WatermarkPreview';
import SecureRenderToggle from '../components/SecureRenderToggle';
import VerificationModal from '../components/VerificationModal';

export const SecurityHubPage: React.FC = () => {
  const { globalSettings, saveGlobalSettings, companies } = useCompanySettings();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Security Locks
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('artisans_hub_unlocked') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [lockError, setLockError] = useState(false);

  // Modal Controls
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedHash, setSelectedHash] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const invs = await api.getInvoices();
      const cls = await api.getClients();
      setInvoices(invs);
      setClients(cls);
    };
    loadData();
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = globalSettings.pdfOwnerPassword || 'Artisans@2026';
    if (passwordInput === correctPassword) {
      setIsUnlocked(true);
      sessionStorage.setItem('artisans_hub_unlocked', 'true');
      setLockError(false);
    } else {
      setLockError(true);
      // reset error message visual shake
      setTimeout(() => setLockError(false), 800);
    }
  };

  const getDocumentHash = (invoice: Invoice, client: Client) => {
    const salt = globalSettings.pdfSecretSalt || 'DEFAULT_SALT';
    const subtotal = invoice.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    const taxAmount = invoice.taxPercent ? (subtotal * invoice.taxPercent / 100) : 0;
    const grandTotal = subtotal + taxAmount - (invoice.discountValue || 0) + (invoice.shippingCost || 0);
    
    const hashInput = `${invoice.id}|${client.projectName || client.name || 'Private Entity'}|${grandTotal}|${invoice.issueDate}|${salt}`;
    return sha256(hashInput).substring(0, 16).toUpperCase();
  };

  const handleOpenVerify = (invoice: Invoice) => {
    const client = clients.find(c => c.id === invoice.clientId) || { id: invoice.clientId, name: 'Private Client', projectName: 'Private Client', notes: '' } as Client;
    const hash = getDocumentHash(invoice, client);
    setSelectedInvoice(invoice);
    setSelectedClient(client);
    setSelectedHash(hash);
    setIsVerifyOpen(true);
  };

  const handleExportPDF = async (invoice: Invoice) => {
    const client = clients.find(c => c.id === invoice.clientId) || { id: invoice.clientId, name: 'Private Client', projectName: 'Private Client', notes: '' } as Client;
    // Get associated company settings or default
    const matchedCompany = companies.find(comp => comp.companyName === invoice.brand || comp.projectType === client.projectType) || companies[0];
    
    // Trigger the pdfGenerator.ts
    await generateInvoicePDF(invoice, client, matchedCompany);
  };

  const filteredInvoices = invoices.filter(inv => {
    const client = clients.find(c => c.id === inv.clientId);
    const clientName = (client?.projectName || client?.name || '').toLowerCase();
    const invoiceId = String(inv.id).toLowerCase();
    const query = searchQuery.toLowerCase();
    return invoiceId.includes(query) || clientName.includes(query);
  });

  // Password gate check
  if (globalSettings.pdfOwnerPassword && !isUnlocked) {
    return (
      <AnimatedDashboard className="min-h-[80vh] relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-950/20">
        <div className="w-full h-full min-h-[80vh] flex items-center justify-center relative">
          {/* Dark Cinematic Backdrop Blur */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md z-0" />

          <div 
            className="absolute inset-0 opacity-15 pointer-events-none z-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: '3rem 3rem',
            }}
          />
          
          <form 
            onSubmit={handleUnlock}
            className={`relative max-w-md w-full bg-zinc-950/70 border ${
              lockError ? 'border-red-500 animate-[shake_0.5s_ease-in-out]' : 'border-white/10'
            } rounded-[2.5rem] p-10 backdrop-blur-2xl text-center space-y-8 shadow-[0_24px_50px_rgba(0,0,0,0.8)] z-10`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-5 bg-white/5 border border-white/5 rounded-[2rem] text-zinc-400">
                <Lock className="w-10 h-10" />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white">DOCUMENT LOCKED</h1>
              <p className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase">Hub Access Protection Required</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="password"
                  placeholder="ENTER MASTER SECRET..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-center font-mono font-bold text-white text-sm tracking-widest outline-none focus:border-white/20 transition-all"
                  autoFocus
                />
              </div>
              {lockError && (
                <p className="text-[9px] font-black uppercase text-red-500 tracking-widest">
                  VERIFICATION FAILURE: INVALID SECURITY PROTOCOL
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-4 bg-white text-black hover:bg-zinc-200 transition-colors font-black text-[10px] uppercase tracking-widest rounded-2xl"
            >
              <span>Decrypt Access</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </AnimatedDashboard>
    );
  }

  return (
    <AnimatedDashboard className="p-0">
      <div className="space-y-12">
        {/* Title Section */}
        <div className="flex justify-between items-end border-b border-white/5 pb-8">
          <div>
            <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/10 border border-emerald-900/20 w-max mb-3">
              <ShieldCheck className="w-3 h-3 animate-pulse" />
              Secured Operations
            </span>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">Security Hub</h1>
            <p className="text-xs text-zinc-400 font-medium mt-1">Manage global PDF locks, watermarks, anti-forgery QR badges, and hash validations.</p>
          </div>
        </div>

        {/* Configurations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <PdfProtectionCard 
            globalSettings={globalSettings} 
            onSave={saveGlobalSettings} 
          />
          <QRVerifyCard 
            globalSettings={globalSettings} 
            onSave={saveGlobalSettings} 
          />
          <WatermarkPreview 
            globalSettings={globalSettings} 
            onSave={saveGlobalSettings} 
          />
          <SecureRenderToggle 
            globalSettings={globalSettings} 
            onSave={saveGlobalSettings} 
          />
        </div>

        {/* Registry Logs / Invoices Section */}
        <div className="glass-panel rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">Document Registry</h2>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Live Cryptographic Signatures</span>
            </div>
            
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search documents or clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-2xl px-10 py-3 text-xs font-bold text-white outline-none focus:border-white/20 transition-all"
              />
              <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                  <th className="py-4">ID</th>
                  <th className="py-4">Client</th>
                  <th className="py-4">Type</th>
                  <th className="py-4">Fingerprint</th>
                  <th className="py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300 font-bold">
                {filteredInvoices.map((inv) => {
                  const client = clients.find(c => c.id === inv.clientId) || { projectName: 'Private Client' } as Client;
                  const hash = getDocumentHash(inv, client);
                  return (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-5 font-mono text-[10px] text-zinc-400">#{inv.id}</td>
                      <td className="py-5 text-white">{client.projectName || client.name}</td>
                      <td className="py-5">
                        <span className={`text-[8.5px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          inv.type === 'quotation' ? 'bg-amber-950 text-amber-400 border border-amber-500/10' : 'bg-blue-950 text-blue-400 border border-primary/10'
                        }`}>
                          {inv.type || 'invoice'}
                        </span>
                      </td>
                      <td className="py-5 font-mono text-[10px] text-zinc-500 select-all font-black uppercase tracking-wider">{hash}</td>
                      <td className="py-5 text-right space-x-3">
                        <button
                          onClick={() => handleOpenVerify(inv)}
                          className="px-3.5 py-2 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest text-zinc-350 hover:text-white"
                        >
                          Verify Signature
                        </button>
                        <button
                          onClick={() => handleExportPDF(inv)}
                          className="px-3.5 py-2 bg-white text-black hover:bg-zinc-200 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest flex inline-items items-center gap-1.5 inline-flex"
                        >
                          <Download className="w-3 h-3" />
                          <span>Export PDF</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-zinc-500 italic">
                      No active registry records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Verification Dialog Overlay */}
      <VerificationModal
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        invoice={selectedInvoice}
        client={selectedClient}
        documentHash={selectedHash}
      />
    </AnimatedDashboard>
  );
};

export default SecurityHubPage;


