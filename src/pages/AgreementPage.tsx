
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, Upload, ArrowLeft, ShieldCheck, 
  Info, AlertCircle
} from 'lucide-react';
import { type Invoice, InvoiceStatus, type Client } from '../types';
import { api } from '../services/api';
import { useCompanySettings } from '../hooks/useCompanySettings';
import ConfirmDialog from '../components/ConfirmDialog';
import { safeParse } from '../utils/storage';
import { agreementTemplates, getTemplate } from '../templates/registry';

const AgreementPage: React.FC = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  
  const [quote, setQuote] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [isOrphaned, setIsOrphaned] = useState(false);
  const { settings } = useCompanySettings();
  const [isAgreed, setIsAgreed] = useState(false);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!quoteId) return;
      console.log('[AgreementPage] Initializing lookup for URL ID:', quoteId);
      
      // Explicit debug check of storage
      const allInvoices = safeParse<any[]>('artisans_invoices', []);
      console.log('[AgreementPage] Storage Check - Total Records:', allInvoices.length);
      console.log('[AgreementPage] Storage Check - Matching ID?:', allInvoices.find((i: any) => String(i.id) === quoteId || String(i._id) === quoteId));

      try {
        const foundQuote = await api.getQuoteById(quoteId);
        console.log('[AgreementPage] API Lookup Success:', foundQuote);
        setQuote(foundQuote);
        
        if (foundQuote.clientId) {
           const foundClient = await api.getClientById(foundQuote.clientId);
           if (foundClient) {
              setClient(foundClient);
              if (foundClient.activeAgreement?.status === 'accepted') {
                 // Removed auto-agree to force explicit interaction as per requirements
              }

              // Auto-link this quote to the agreement if not already linked (to handle orphaned state later)
              if (foundClient.activeAgreement && foundClient.activeAgreement.linkedQuoteId !== quoteId) {
                 const updatedClient = {
                    ...foundClient,
                    activeAgreement: {
                       ...foundClient.activeAgreement,
                       linkedQuoteId: quoteId
                    }
                 };
                 await api.saveClient(updatedClient);
              }
           }
        }
      } catch (err: any) {
        console.error("Load Failure:", err);
        if (err.message.includes("404")) {
           // Search for orphaned agreement
           try {
              const allClients = await api.getClients();
              const orphan = allClients.find((c: Client) => c.activeAgreement?.linkedQuoteId === quoteId);
              if (orphan) {
                 setClient(orphan);
                 setIsOrphaned(true);
                 return;
              }
           } catch (searchErr) {
              console.error("Orphan Search Failure:", searchErr);
           }
        }
        setError(err.message.includes("404") ? "404: Quotation record not found." : "Failed to connect to ledger service.");
      }
    };

    loadData();
  }, [quoteId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIdFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!isAgreed || !idFile || !quote || !client) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 1. Update Client activeAgreement status
      if (client.activeAgreement) {
         const updatedClient = {
            ...client,
            activeAgreement: {
               ...client.activeAgreement,
               status: 'accepted' as const,
               acceptedAt: new Date().toISOString()
            }
         };
         
         // Persist back to clients storage
         const storedClients = safeParse<Client[]>('clients', []);
         const newClients = storedClients.map((c: any) => (c.id === client.id || c._id === client.id) ? updatedClient : c);
         localStorage.setItem('clients', JSON.stringify(newClients));
         setClient(updatedClient);
      }

      // 2. Mark Quote as Approved + Verified
      const updatedQuote = { 
        ...quote, 
        status: InvoiceStatus.Approved,
        agreementAccepted: true,
        agreementDate: new Date().toISOString(),
        idProofName: idFile.name,
        approvalTimestamp: new Date().toISOString()
      };

      // 3. Convert to Invoice
      const newInvoice: Invoice = {
        ...updatedQuote,
        _id: `inv_id_${Date.now()}`,
        id: `INV-${Date.now().toString().slice(-6)}`,
        type: 'invoice',
        isQuotation: false,
        status: InvoiceStatus.Unpaid,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), 
        createdAt: new Date().toISOString(),
        convertedFrom: quoteId
      };

      // 4. Save both using API service
      await api.saveInvoice(updatedQuote);
      await api.saveInvoice(newInvoice);

      console.log('Quote Approved & Invoice Generated:', newInvoice.id);
      await new Promise(r => setTimeout(r, 1000));
      navigate('/ledger');
    } catch (err) {
      console.error("Confirmation Failure:", err);
      setError("Failed to finalize agreement. Please contact support.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrphan = async () => {
    if (!client) return;
    try {
      const updatedClient = { ...client, activeAgreement: undefined };
      await api.saveClient(updatedClient);
      setIsDeleteConfirmOpen(false);
      navigate('/ledger');
    } catch (err) {
      console.error("Deletion Failure:", err);
      setError("Failed to delete orphaned agreement.");
    }
  };

  if (error && error.includes("404")) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-10 text-center animate-ios-slide-up">
        <div className="w-24 h-24 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-amber-500/10 shadow-2xl shadow-amber-500/5">
          <AlertCircle className="text-amber-500 w-12 h-12" />
        </div>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Quotation not found</h1>
        <div className="max-w-md">
           <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-12 leading-relaxed">
             The quotation <span className="text-white">'{quoteId}'</span> may have been deleted, moved, or the secure link has expired. Please check your registry or contact support.
           </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
           <button 
              onClick={() => navigate('/dashboard')} 
              className="px-10 py-5 bg-white text-black font-black uppercase text-xs rounded-2xl tracking-widest active:scale-95 transition-all outline-none"
           >
             Back to Dashboard
           </button>
           <button 
              onClick={() => navigate('/ledger?filter=quotations')} 
              className="px-10 py-5 bg-white/5 border border-white/10 text-white font-black uppercase text-xs rounded-2xl tracking-widest active:scale-95 transition-all outline-none hover:bg-white/10"
           >
             View All Quotations
           </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-10 text-center animate-ios-slide-up">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/10">
          <AlertCircle className="text-red-500 w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Verification Error</h1>
        <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.2em] mb-10">{error}</p>
        <button onClick={() => navigate(-1)} className="px-10 py-5 bg-white text-black font-black uppercase text-xs rounded-2xl tracking-widest active:scale-95 transition-all outline-none">
          Return to Portal
        </button>
      </div>
    );
  }

  if (!quote && !isOrphaned) return <div className="min-h-screen bg-transparent flex items-center justify-center"><div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-transparent text-white p-6 md:p-12 font-sans selection:bg-primary selection:text-white animate-ios-fade-in">
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Delete Orphaned Agreement"
        message="This orphaned agreement record will be permanently removed."
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteOrphan}
      />
      {isOrphaned && (
         <div className="mb-10 p-6 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] flex items-center justify-between gap-6 animate-ios-slide-up">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="text-amber-500 w-6 h-6" />
               </div>
               <div>
                  <p className="text-sm font-black text-white uppercase tracking-widest leading-none">Linked quotation was deleted</p>
                  <p className="text-xs font-bold text-amber-500/60 uppercase tracking-widest mt-1.5">This agreement is orphaned and no longer linked to a valid billable record.</p>
               </div>
            </div>
            <button 
               onClick={() => setIsDeleteConfirmOpen(true)}
               className="px-6 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-rose-500 hover:text-white transition-all active:scale-95"
            >
               Delete Orphan
            </button>
         </div>
      )}
      <style>{`
        @media print {
          .agreement-body { display: none !important; }
          body::before { 
            content: "This document cannot be printed. Please view it securely on the Artisans platform."; 
            display: block;
            padding: 20px;
            font-family: sans-serif;
            font-weight: bold;
            text-align: center;
          }
        }
      `}</style>
      <div className="max-w-none space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
           <div className="flex items-center gap-6">
              <button onClick={() => navigate(-1)} className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all active:scale-90">
                 <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                 {settings.logo ? (
                    <img src={settings.logo} alt="Logo" className="w-12 h-12 rounded-xl object-cover shadow-2xl border border-white/5" />
                 ) : (
                    <div className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center font-bold text-xl font-serif">
                       {settings.companyName.charAt(0).toUpperCase()}
                    </div>
                 )}
                 <div>
                    <p className="text-xl font-black text-white uppercase tracking-tighter leading-none">{settings.companyName}</p>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1.5">{settings.tagline}</p>
                 </div>
              </div>
           </div>
            <div className="text-right">
               <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none mb-3">Agreement & Confirmation</h1>
               <p className="text-zinc-500 font-bold uppercase text-xs tracking-[0.4em]">
                  {client?.activeAgreement ? `${client.activeAgreement.title} • VER: ${client.activeAgreement.version}` : 'Verification Protocol Required'} • {quoteId}
               </p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr] gap-12">
           
           {/* Section A & B: Document Rendering (Dynamic Template) */}
           <div className="space-y-10">
              {/* Quote Summary Card */}
              <div className="glass-panel p-10 squircle-lg border border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-8">
                 <div>
                    <label className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em] mb-2 block">Project Reference</label>
                    <h4 className="text-3xl font-black text-white uppercase tracking-tighter">{quote?.client?.name || client?.projectName || 'Private Client'}</h4>
                    <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mt-2">Project ID: {quote?.id || 'NO_LINKED_ID'}</p>
                 </div>
                 <div className="text-right">
                    <label className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em] mb-2 block">Total Bound Vector</label>
                    <p className="text-4xl font-black text-emerald-400 font-mono tracking-tighter">
                       {quote ? `₹${(quote.totalAmount || quote.amount || 0).toLocaleString('en-IN')}` : '₹0.00 (ORPHANED)'}
                    </p>
                 </div>
              </div>

              {/* Dynamic Template Injection */}
              <div className="relative">
                {(() => {
                   const templateId = settings.defaultAgreementTemplate || 'default_v1';
                   const TemplateComponent = getTemplate(agreementTemplates, templateId, 'default_v1').component;
                   
                   return (
                     <TemplateComponent 
                        company={settings} 
                        client={client || undefined} 
                        document={quote} 
                        agreement={client?.activeAgreement} 
                     />
                   );
                })()}
              </div>

              {/* Checkbox / Status (Business Logic separated from Presentation) */}
              <div className="glass-panel p-10 squircle-lg border border-white/5 bg-white/[0.01]">
                 <div className="shrink-0">
                     {isAgreed ? (
                        <div className="flex flex-col gap-4 animate-ios-slide-up">
                           <div className="flex items-center gap-6 p-6 bg-primary/5 border border-primary/10 rounded-3xl">
                              <CheckCircle2 className="w-8 h-8 text-primary" />
                              <div>
                                 <p className="text-lg font-black text-white uppercase tracking-widest">Agreement Accepted</p>
                                 <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Confirmed on: {new Date(client?.activeAgreement?.acceptedAt || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                              </div>
                           </div>
                           <button 
                              onClick={() => setIsAgreed(false)} 
                              className="text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-white transition-all text-left px-6"
                           >
                              Change Agreement Selection
                           </button>
                        </div>
                     ) : (
                        <label className={`flex items-start gap-5 transition-all ${!client?.activeAgreement?.body ? 'opacity-20 cursor-not-allowed grayscale' : 'cursor-pointer group'}`}>
                           <div className="relative mt-1">
                              <input 
                                type="checkbox" 
                                className="peer appearance-none w-6 h-6 bg-black border border-white/20 rounded-lg checked:bg-primary checked:border-primary transition-all disabled:cursor-not-allowed"
                                checked={isAgreed}
                                onChange={(e) => setIsAgreed(e.target.checked)}
                                disabled={!client?.activeAgreement?.body}
                              />
                              <CheckCircle2 className="absolute top-1 left-1 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                           </div>
                           <div>
                              <p className={`text-lg font-black text-white uppercase tracking-widest transition-colors ${client?.activeAgreement?.body ? 'group-hover:text-blue-400' : ''}`}>I agree to the terms and conditions</p>
                              <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mt-2">{client?.activeAgreement?.body ? 'Legally binding digital signature required to initialize production' : 'Waiting for administration to assign active terms.'}</p>
                           </div>
                        </label>
                     )}
                  </div>
              </div>
           </div>

           {/* Section C & D: Validation & Upload */}
           <div className="space-y-12">
              <div className="glass-panel p-10 squircle-lg border border-white/5 bg-white/[0.01] space-y-10">
                 <div className="flex items-center gap-4">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                    <h3 className="text-xl font-black uppercase tracking-widest text-white">Identity Verification</h3>
                 </div>

                 <p className="text-lg text-zinc-400 font-medium leading-relaxed">
                    To comply with our secure production policies, we require a valid government-issued ID proof before converting this quotation into an active billable record.
                 </p>

                 <div className="space-y-4">
                    <div className="relative">
                       <input 
                         type="file" 
                         className="hidden" 
                         id="id-upload" 
                         accept=".pdf,.png,.jpg,.jpeg"
                         onChange={handleFileChange}
                       />
                       <label 
                         htmlFor="id-upload" 
                         className={`w-full h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center p-6 cursor-pointer transition-all ${idFile ? 'bg-primary/5 border-primary/20' : 'bg-black/50 border-white/10 hover:border-white/20 hover:bg-white/[0.02]'}`}
                       >
                          {idFile ? (
                             <>
                                <CheckCircle2 className="w-8 h-8 text-primary mb-2" />
                                <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">{idFile.name}</p>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{(idFile.size / 1024 / 1024).toFixed(2)} MB • File Staged</p>
                             </>
                          ) : (
                             <>
                                <Upload className="w-8 h-8 text-zinc-700 mb-2" />
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Click to Upload ID Proof</p>
                                <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">PDF, JPG, PNG Limit 10MB</p>
                             </>
                          )}
                       </label>
                    </div>

                    {idFile && (
                       <button onClick={() => setIdFile(null)} className="text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-red-500 transition-colors w-full text-center">
                          Change Document
                       </button>
                    )}
                 </div>

                 <div className="pt-8 border-t border-white/5">
                    <div className="mb-6">
                       <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 flex items-center gap-2 italic">
                          <Info size={10} /> Data Integrity Note
                       </p>
                       <p className="text-[10px] font-bold text-zinc-600 uppercase leading-snug">
                          All uploaded documents are encrypted and stored in nuestra secure vault. Documents will be purged automatically after project completion.
                       </p>
                    </div>

                    <button 
                      onClick={handleSubmit}
                      disabled={!isAgreed || !idFile || isSubmitting || !client?.activeAgreement?.body}
                      className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-2xl active:scale-95 transition-all disabled:opacity-20 disabled:cursor-not-allowed group flex items-center justify-center gap-3"
                    >
                       {isSubmitting ? (
                          <>
                             <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                             Finalizing Setup...
                          </>
                       ) : client?.activeAgreement?.status === 'accepted' ? (
                          <>
                             Terms Verified
                             <CheckCircle2 className="w-4 h-4" />
                          </>
                       ) : (
                          <>
                             Confirm & Continue
                             <CheckCircle2 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </>
                       )}
                    </button>
                 </div>
              </div>

              {/* Secure Footer Card */}
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex justify-between items-center text-zinc-600">
                 <p className="text-[10px] font-black uppercase tracking-widest">End-to-End Encryption Enabled</p>
                 <ShieldCheck className="w-4 h-4 opacity-30" />
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default AgreementPage;

