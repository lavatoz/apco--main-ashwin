import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  Download, 
  Search, 
  Shield, 
  QrCode, 
  Layers, 
  Hash, 
  Globe, 
  Eye, 
  EyeOff, 
  Check, 
  Copy, 
  Edit3, 
  Sliders, 
  AlertTriangle, 
  Info 
} from 'lucide-react';
import { sha256 } from 'js-sha256';
import { api } from '../services/api';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { type Invoice, type Client } from '../types';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { getDisplayId } from '../utils/displayId';

import AnimatedDashboard from '../components/AnimatedDashboard';
import VerificationModal from '../components/VerificationModal';

export const SecurityHubPage: React.FC = () => {
  const { globalSettings, saveGlobalSettings, companies } = useCompanySettings();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  


  // Password Protection States
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tempPasswordMode, setTempPasswordMode] = useState<'owner-only' | 'open-password'>('open-password');
  const [tempPasswordVal, setTempPasswordVal] = useState('');
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Modal Controls
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedHash, setSelectedHash] = useState('');

  const handleStartEditPassword = () => {
    const isOwnerMode = globalSettings.pdfPasswordMode === 'owner-only';
    setTempPasswordMode(isOwnerMode ? 'owner-only' : 'open-password');
    const currentPass = isOwnerMode
      ? (globalSettings.pdfOwnerPassword || '')
      : (globalSettings.pdfUserPassword || globalSettings.pdfOwnerPassword || '');
    setTempPasswordVal(currentPass);
    setIsEditingPassword(true);
  };

  const handleSavePassword = () => {
    if (tempPasswordMode === 'open-password') {
      saveGlobalSettings({
        ...globalSettings,
        pdfPasswordMode: 'open-password',
        pdfUserPassword: tempPasswordVal.trim(),
        pdfOwnerPassword: globalSettings.pdfOwnerPassword || 'Artisans@2026'
      });
    } else {
      saveGlobalSettings({
        ...globalSettings,
        pdfPasswordMode: 'owner-only',
        pdfOwnerPassword: tempPasswordVal.trim(),
        pdfUserPassword: undefined
      });
    }
    setIsEditingPassword(false);
  };

  useEffect(() => {
    const loadData = async () => {
      const invs = await api.getInvoices();
      const cls = await api.getClients();
      setInvoices(invs);
      setClients(cls);
    };
    loadData();
  }, []);



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
    if (invoice.type === 'quotation' || invoice.isQuotation) {
      try {
        const res = await api.generateQuotationPDF(invoice.id);
        if (res.success && res.fileId) {
          await api.downloadProjectFile(res.fileId, res.fileName || `Quotation_${invoice.id}.pdf`);
        } else {
          alert("Failed to generate quotation PDF.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to export backend-generated quotation PDF.");
      }
    } else {
      const client = clients.find(c => c.id === invoice.clientId) || { id: invoice.clientId, name: 'Private Client', projectName: 'Private Client', notes: '' } as Client;
      // Get associated company settings or default
      const matchedCompany = companies.find(comp => comp.companyName === invoice.brand || comp.projectType === client.projectType) || companies[0];
      
      // Trigger the pdfGenerator.ts
      await generateInvoicePDF(invoice, client, matchedCompany);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const client = clients.find(c => c.id === inv.clientId);
    const clientName = (client?.projectName || client?.name || '').toLowerCase();
    const invoiceId = String(inv.id).toLowerCase();
    const displayId = String(inv.type === 'quotation' ? inv.quotationCode : inv.invoiceCode).toLowerCase();
    const query = searchQuery.toLowerCase();
    return invoiceId.includes(query) || displayId.includes(query) || clientName.includes(query);
  });



  const isEncryptionActive = !!globalSettings.pdfOwnerPassword;
  const isQrActive = globalSettings.pdfQrEnabled !== false;
  const isWatermarkActive = globalSettings.pdfWatermarkEnabled !== false;
  const isHashActive = globalSettings.pdfHashEnabled !== false;
  const isVerifyLinkActive = globalSettings.pdfVerifyLinkEnabled !== false;

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 1. Protection Status (Read-Only) */}
          <div className="glass-panel rounded-[2.2rem] border border-white/5 bg-zinc-950/40 backdrop-blur-xl p-8 hover:border-white/10 transition-all flex flex-col justify-between min-h-[420px]">
             <div className="space-y-6">
                <div className="flex items-center gap-3">
                   <div className="p-2.5 rounded-xl bg-primary/10 text-emerald-400 border border-primary/20">
                      <Shield className="w-5 h-5 animate-pulse" />
                   </div>
                   <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Protection Status</h3>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Active Protocols</p>
                   </div>
                </div>

                <div className="space-y-4">
                   {/* PDF Encryption */}
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${isEncryptionActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-900 text-zinc-500'}`}>
                            <Lock className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-xs font-bold text-white">PDF Encryption</p>
                            <p className="text-[9px] text-zinc-500 font-mono">Owner &amp; user permissions</p>
                         </div>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${isEncryptionActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/10' : 'bg-zinc-900 text-zinc-500 border border-white/5'}`}>
                         {isEncryptionActive ? 'Active' : 'Inactive'}
                      </span>
                   </div>

                   {/* QR Verification */}
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${isQrActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-900 text-zinc-500'}`}>
                            <QrCode className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-xs font-bold text-white">QR Verification</p>
                            <p className="text-[9px] text-zinc-500 font-mono">Scan badge verification</p>
                         </div>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${isQrActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/10' : 'bg-zinc-900 text-zinc-500 border border-white/5'}`}>
                         {isQrActive ? 'Active' : 'Inactive'}
                      </span>
                   </div>

                   {/* Watermark */}
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${isWatermarkActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-900 text-zinc-500'}`}>
                            <Layers className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-xs font-bold text-white">Watermark</p>
                            <p className="text-[9px] text-zinc-500 font-mono">Diagonal copy protection</p>
                         </div>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${isWatermarkActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/10' : 'bg-zinc-900 text-zinc-500 border border-white/5'}`}>
                         {isWatermarkActive ? 'Active' : 'Inactive'}
                      </span>
                   </div>

                   {/* SHA-256 Integrity */}
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${isHashActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-900 text-zinc-500'}`}>
                            <Hash className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-xs font-bold text-white">SHA-256 Integrity</p>
                            <p className="text-[9px] text-zinc-500 font-mono">Cryptographic signatures</p>
                         </div>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${isHashActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/10' : 'bg-zinc-900 text-zinc-500 border border-white/5'}`}>
                         {isHashActive ? 'Active' : 'Inactive'}
                      </span>
                   </div>

                   {/* Verification Link */}
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${isVerifyLinkActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-900 text-zinc-500'}`}>
                            <Globe className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-xs font-bold text-white">Verification Link</p>
                            <p className="text-[9px] text-zinc-500 font-mono">Footer validation URL</p>
                         </div>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${isVerifyLinkActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/10' : 'bg-zinc-900 text-zinc-500 border border-white/5'}`}>
                         {isVerifyLinkActive ? 'Active' : 'Inactive'}
                      </span>
                   </div>
                </div>
             </div>
             
             <div className="pt-4 border-t border-white/5 mt-4">
                <p className="text-[9.5px] text-zinc-500 font-medium leading-relaxed font-mono">
                   Unified document security state
                </p>
             </div>
          </div>

          {/* 2. Password Protection */}
          <div className="glass-panel rounded-[2.2rem] border border-white/5 bg-zinc-950/40 backdrop-blur-xl p-8 hover:border-white/10 transition-all flex flex-col justify-between min-h-[420px]">
             <div className="space-y-6">
                <div className="flex items-center gap-3">
                   <div className="p-2.5 rounded-xl bg-primary/10 text-emerald-400 border border-primary/20">
                      <Lock className="w-5 h-5" />
                   </div>
                   <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Password Protection</h3>
                      <p className="text-[10px] text-zinc-550 uppercase tracking-widest font-mono">Encryption Controls</p>
                   </div>
                </div>

                {isEditingPassword ? (
                   <div className="space-y-4 animate-ios-slide-up">
                      {/* Mode Selector */}
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Protection Mode</label>
                         <div className="grid grid-cols-2 gap-2">
                            <button
                               type="button"
                               onClick={() => setTempPasswordMode('open-password')}
                               className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                                  tempPasswordMode === 'open-password'
                                    ? 'bg-primary/10 border-primary/40 text-primary'
                                    : 'bg-transparent border-white/5 text-zinc-500 hover:border-white/15 hover:text-zinc-355'
                               }`}
                            >
                               <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full border-2 transition-all ${tempPasswordMode === 'open-password' ? 'bg-primary border-primary' : 'bg-transparent border-zinc-650'}`} />
                                  <span className="text-[9.5px] font-black uppercase tracking-wider">Open Password</span>
                                </div>
                                <p className="text-[8px] font-medium leading-snug">Requires password to view file.</p>
                            </button>

                            <button
                               type="button"
                               onClick={() => setTempPasswordMode('owner-only')}
                               className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                                  tempPasswordMode === 'owner-only'
                                    ? 'bg-primary/10 border-primary/40 text-primary'
                                    : 'bg-transparent border-white/5 text-zinc-500 hover:border-white/15 hover:text-zinc-355'
                               }`}
                            >
                               <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full border-2 transition-all ${tempPasswordMode === 'owner-only' ? 'bg-primary border-primary' : 'bg-transparent border-zinc-650'}`} />
                                  <span className="text-[9.5px] font-black uppercase tracking-wider">Owner Password</span>
                                </div>
                                <p className="text-[8px] font-medium leading-snug">Freely readable; editing locked.</p>
                            </button>
                         </div>
                      </div>

                      {/* Password Input */}
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Password Key</label>
                         <div className="relative">
                            <input
                               type={showPassword ? 'text' : 'password'}
                               value={tempPasswordVal}
                               onChange={(e) => setTempPasswordVal(e.target.value)}
                               placeholder={tempPasswordMode === 'open-password' ? "Enter client-facing password..." : "Enter system owner password..."}
                               className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono font-bold text-white outline-none focus:border-white/20 transition-colors pr-10"
                            />
                            <button
                               type="button"
                               onClick={() => setShowPassword(!showPassword)}
                               className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                            >
                               {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                         </div>
                      </div>

                      {/* Save/Cancel Buttons */}
                      <div className="flex gap-2 pt-2">
                         <button
                            type="button"
                            onClick={handleSavePassword}
                            className="flex-1 py-3 bg-white text-black hover:bg-zinc-200 transition-colors text-[10px] font-black uppercase tracking-widest rounded-xl"
                         >
                            Save Settings
                         </button>
                         <button
                            type="button"
                            onClick={() => setIsEditingPassword(false)}
                            className="px-4 py-3 bg-white/5 text-zinc-400 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/5"
                         >
                            Cancel
                         </button>
                      </div>
                   </div>
                ) : (
                   <div className="space-y-5 animate-ios-fade-in">
                      {/* Read-Only State */}
                      <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-3.5">
                         <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Mode</span>
                            <span className="text-xs font-bold text-white">
                               {(globalSettings.pdfPasswordMode ?? 'open-password') === 'owner-only' ? 'Owner Password' : 'Open Password'}
                            </span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Password</span>
                            <div className="flex items-center gap-2">
                               <span className="font-mono text-xs text-zinc-350">
                                  {(globalSettings.pdfPasswordMode ?? 'open-password') === 'owner-only' 
                                    ? (globalSettings.pdfOwnerPassword ? (showPassword ? globalSettings.pdfOwnerPassword : '••••••••') : <span className="text-zinc-650 italic font-sans font-normal">None</span>)
                                    : (globalSettings.pdfUserPassword ? (showPassword ? globalSettings.pdfUserPassword : '••••••••') : <span className="text-zinc-650 italic font-sans font-normal">None</span>)
                                  }
                               </span>
                               {((((globalSettings.pdfPasswordMode ?? 'open-password') === 'owner-only' && globalSettings.pdfOwnerPassword) || 
                                 ((globalSettings.pdfPasswordMode ?? 'open-password') !== 'owner-only' && globalSettings.pdfUserPassword)) && (
                                  <>
                                     <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-zinc-500 hover:text-white transition-colors"
                                     >
                                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                     </button>
                                     <button
                                        type="button"
                                        onClick={() => {
                                           const pass = (globalSettings.pdfPasswordMode ?? 'open-password') === 'owner-only' ? (globalSettings.pdfOwnerPassword || '') : (globalSettings.pdfUserPassword || '');
                                           navigator.clipboard.writeText(pass);
                                           setCopiedPassword(true);
                                           setTimeout(() => setCopiedPassword(false), 2000);
                                        }}
                                        className="text-zinc-500 hover:text-white transition-colors"
                                     >
                                        {copiedPassword ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                     </button>
                                  </>
                               ))}
                            </div>
                         </div>
                      </div>

                      <button
                         type="button"
                         onClick={handleStartEditPassword}
                         className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white transition-colors text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/5 flex items-center justify-center gap-2"
                      >
                         <Edit3 className="w-3.5 h-3.5 text-primary" />
                         <span>Modify Settings</span>
                      </button>
                   </div>
                )}
             </div>

             <div className="pt-4 border-t border-white/5 mt-4">
                <div className="flex items-start gap-2 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                   <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                   <p className="text-[8.5px] font-medium text-amber-500/80 leading-relaxed">
                      PDF encryption protects generated records against unverified tampering.
                   </p>
                </div>
             </div>
          </div>

          {/* 3. Security Features */}
          <div className="glass-panel rounded-[2.2rem] border border-white/5 bg-zinc-950/40 backdrop-blur-xl p-8 hover:border-white/10 transition-all flex flex-col justify-between min-h-[420px]">
             <div className="space-y-6">
                <div className="flex items-center gap-3">
                   <div className="p-2.5 rounded-xl bg-primary/10 text-emerald-400 border border-primary/20">
                      <Sliders className="w-5 h-5 text-primary" />
                   </div>
                   <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Security Features</h3>
                      <p className="text-[10px] text-zinc-550 uppercase tracking-widest font-mono">Fine-Grained Toggles</p>
                   </div>
                </div>

                <div className="space-y-3.5">
                   {/* QR Verification */}
                   <div className="flex items-center justify-between p-2.5 bg-black/20 border border-white/5 rounded-xl">
                      <div>
                         <p className="text-xs font-bold text-white">QR Verification</p>
                         <p className="text-[9px] text-zinc-500 font-mono">Inject authenticity QR badge</p>
                      </div>
                      <button
                         onClick={() => saveGlobalSettings({ ...globalSettings, pdfQrEnabled: !isQrActive })}
                         className={`w-9 h-5 rounded-full transition-all duration-300 flex items-center p-0.5 shrink-0 ${isQrActive ? 'bg-white justify-end' : 'bg-zinc-800 border border-white/10 justify-start'}`}
                      >
                         <span className={`w-3.5 h-3.5 rounded-full transition-all ${isQrActive ? 'bg-black' : 'bg-zinc-500'}`} />
                      </button>
                   </div>

                   {/* Watermark */}
                   <div className="flex items-center justify-between p-2.5 bg-black/20 border border-white/5 rounded-xl">
                      <div>
                         <p className="text-xs font-bold text-white">Watermark</p>
                         <p className="text-[9px] text-zinc-500 font-mono">Background diagonal watermark</p>
                      </div>
                      <button
                         onClick={() => saveGlobalSettings({ ...globalSettings, pdfWatermarkEnabled: !isWatermarkActive })}
                         className={`w-9 h-5 rounded-full transition-all duration-300 flex items-center p-0.5 shrink-0 ${isWatermarkActive ? 'bg-white justify-end' : 'bg-zinc-800 border border-white/10 justify-start'}`}
                      >
                         <span className={`w-3.5 h-3.5 rounded-full transition-all ${isWatermarkActive ? 'bg-black' : 'bg-zinc-500'}`} />
                      </button>
                   </div>

                   {/* SHA-256 Integrity Hash */}
                   <div className="flex items-center justify-between p-2.5 bg-black/20 border border-white/5 rounded-xl">
                      <div>
                         <p className="text-xs font-bold text-white">SHA-256 Integrity Hash</p>
                         <p className="text-[9px] text-zinc-500 font-mono">Unique cryptographic signature</p>
                      </div>
                      <button
                         onClick={() => saveGlobalSettings({ ...globalSettings, pdfHashEnabled: !isHashActive })}
                         className={`w-9 h-5 rounded-full transition-all duration-300 flex items-center p-0.5 shrink-0 ${isHashActive ? 'bg-white justify-end' : 'bg-zinc-800 border border-white/10 justify-start'}`}
                      >
                         <span className={`w-3.5 h-3.5 rounded-full transition-all ${isHashActive ? 'bg-black' : 'bg-zinc-500'}`} />
                      </button>
                   </div>

                   {/* Verification Link */}
                   <div className="flex items-center justify-between p-2.5 bg-black/20 border border-white/5 rounded-xl">
                      <div>
                         <p className="text-xs font-bold text-white">Verification Link</p>
                         <p className="text-[9px] text-zinc-500 font-mono">Validation link in footer</p>
                      </div>
                      <button
                         onClick={() => saveGlobalSettings({ ...globalSettings, pdfVerifyLinkEnabled: !isVerifyLinkActive })}
                         className={`w-9 h-5 rounded-full transition-all duration-300 flex items-center p-0.5 shrink-0 ${isVerifyLinkActive ? 'bg-white justify-end' : 'bg-zinc-800 border border-white/10 justify-start'}`}
                      >
                         <span className={`w-3.5 h-3.5 rounded-full transition-all ${isVerifyLinkActive ? 'bg-black' : 'bg-zinc-500'}`} />
                      </button>
                   </div>

                   {/* Secure Render */}
                   <div className="flex items-center justify-between p-2.5 bg-black/20 border border-white/5 rounded-xl">
                      <div>
                         <p className="text-xs font-bold text-white">Secure Render Mode</p>
                         <p className="text-[9px] text-zinc-500 font-mono">Image-based PDF (Anti-scrape)</p>
                      </div>
                      <button
                         onClick={() => saveGlobalSettings({ ...globalSettings, pdfSecureRenderEnabled: !globalSettings.pdfSecureRenderEnabled })}
                         className={`w-9 h-5 rounded-full transition-all duration-300 flex items-center p-0.5 shrink-0 ${globalSettings.pdfSecureRenderEnabled ? 'bg-white justify-end' : 'bg-zinc-800 border border-white/10 justify-start'}`}
                      >
                         <span className={`w-3.5 h-3.5 rounded-full transition-all ${globalSettings.pdfSecureRenderEnabled ? 'bg-black' : 'bg-zinc-500'}`} />
                      </button>
                   </div>
                </div>
             </div>

             <div className="pt-4 border-t border-white/5 mt-4">
                <div className="flex items-start gap-2">
                   <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                   <p className="text-[8.5px] font-medium text-zinc-500 leading-relaxed font-mono">
                      Fine-grained feature toggles
                   </p>
                </div>
             </div>
          </div>
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
                      <td className="py-5 font-mono text-[10px] text-zinc-400">#{getDisplayId(inv.type === 'quotation' ? inv.quotationCode : inv.invoiceCode, inv.id)}</td>
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


