
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, CheckCircle2, Upload, ArrowLeft, ShieldCheck, 
  Info, AlertCircle, Lock
} from 'lucide-react';
import { type Invoice, InvoiceStatus, type Client } from '../types';
import { api } from '../services/api';
import { useCompanySettings } from '../hooks/useCompanySettings';

const AgreementPage: React.FC = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  
  const [quote, setQuote] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const { settings } = useCompanySettings();
  const [agreed, setAgreed] = useState(false);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!quoteId) return;
      try {
        const foundQuote = await api.getQuoteById(quoteId);
        setQuote(foundQuote);
        
        if (foundQuote.clientId) {
           const foundClient = await api.getClientById(foundQuote.clientId);
           if (foundClient) {
              setClient(foundClient);
              if (foundClient.activeAgreement?.status === 'accepted') {
                 setAgreed(true);
              }
           }
        }
      } catch (err: any) {
        console.error("Load Failure:", err);
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
    if (!agreed || !idFile || !quote || !client) return;
    
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
         const storedClients = JSON.parse(localStorage.getItem('clients') || '[]');
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

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 text-center animate-ios-slide-up">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/10">
          <AlertCircle className="text-red-500 w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Verification Error</h1>
        <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.2em] mb-10">{error}</p>
        <button onClick={() => navigate(-1)} className="px-10 py-5 bg-white text-black font-black uppercase text-[11px] rounded-2xl tracking-widest active:scale-95 transition-all outline-none">
          Return to Portal
        </button>
      </div>
    );
  }

  if (!quote) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans selection:bg-blue-500 selection:text-white animate-ios-fade-in">
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
           
           {/* Section A & B: Terms & Conditions */}
           <div className="space-y-10">
              {/* Quote Summary Card */}
              <div className="glass-panel p-10 squircle-lg border border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-8">
                 <div>
                    <label className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em] mb-2 block">Project Reference</label>
                    <h4 className="text-3xl font-black text-white uppercase tracking-tighter">{quote.client?.name || 'Private Client'}</h4>
                    <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mt-2">Project ID: {quote.id}</p>
                 </div>
                 <div className="text-right">
                    <label className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em] mb-2 block">Total Bound Vector</label>
                    <p className="text-4xl font-black text-emerald-400 font-mono tracking-tighter">₹{(quote.totalAmount || quote.amount || 0).toLocaleString('en-IN')}</p>
                 </div>
              </div>

              <div className="glass-panel p-10 squircle-lg border border-white/5 bg-white/[0.01] relative overflow-hidden flex flex-col h-[600px]">
                 <div className="flex items-center gap-4 mb-8 shrink-0">
                    <FileText className="w-6 h-6 text-blue-500" />
                    <h3 className="text-xl font-black uppercase tracking-widest text-white">Terms of Engagement</h3>
                 </div>
                 
                  <div 
                    className="flex-1 overflow-y-auto pr-6 no-scrollbar space-y-10 text-gray-300 text-lg leading-8 font-medium select-none agreement-body"
                    onContextMenu={(e) => e.preventDefault()}
                  >
                     {client?.activeAgreement?.body ? (
                        <div className="whitespace-pre-wrap py-2">
                           {client.activeAgreement.body}
                        </div>
                     ) : (
                        <div className="py-20 text-center space-y-4 opacity-50">
                           <AlertCircle className="w-12 h-12 mx-auto text-zinc-600" />
                           <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">No active agreement has been assigned yet.</p>
                           <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Please contact your account manager to initialize terms.</p>
                        </div>
                     )}
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center justify-center gap-2">
                       <Lock size={10} className="opacity-50" /> 🔒 This agreement is view-only and securely stored on Artisans. For a copy, please contact your account manager.
                    </p>
                  </div>

                 {/* Checkbox / Status */}
                 <div className="mt-10 pt-10 border-t border-white/10 shrink-0">
                    {client?.activeAgreement?.status === 'accepted' ? (
                       <div className="flex items-center gap-6 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                          <div>
                             <p className="text-lg font-black text-white uppercase tracking-widest">Agreement Accepted</p>
                             <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Confirmed on: {new Date(client.activeAgreement.acceptedAt || '').toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                          </div>
                       </div>
                    ) : (
                       <label className={`flex items-start gap-5 transition-all ${!client?.activeAgreement?.body ? 'opacity-20 cursor-not-allowed grayscale' : 'cursor-pointer group'}`}>
                          <div className="relative mt-1">
                             <input 
                               type="checkbox" 
                               className="peer appearance-none w-6 h-6 bg-black border border-white/20 rounded-lg checked:bg-blue-500 checked:border-blue-500 transition-all disabled:cursor-not-allowed"
                               checked={agreed}
                               onChange={(e) => setAgreed(e.target.checked)}
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
                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
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
                         className={`w-full h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center p-6 cursor-pointer transition-all ${idFile ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-black/50 border-white/10 hover:border-white/20 hover:bg-white/[0.02]'}`}
                       >
                          {idFile ? (
                             <>
                                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                                <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">{idFile.name}</p>
                                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{(idFile.size / 1024 / 1024).toFixed(2)} MB • File Staged</p>
                             </>
                          ) : (
                             <>
                                <Upload className="w-8 h-8 text-zinc-700 mb-2" />
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Click to Upload ID Proof</p>
                                <p className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">PDF, JPG, PNG Limit 10MB</p>
                             </>
                          )}
                       </label>
                    </div>

                    {idFile && (
                       <button onClick={() => setIdFile(null)} className="text-[8px] font-black text-zinc-600 uppercase tracking-widest hover:text-red-500 transition-colors w-full text-center">
                          Change Document
                       </button>
                    )}
                 </div>

                 <div className="pt-8 border-t border-white/5">
                    <div className="mb-6">
                       <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2 flex items-center gap-2 italic">
                          <Info size={10} /> Data Integrity Note
                       </p>
                       <p className="text-[8px] font-bold text-zinc-600 uppercase leading-snug">
                          All uploaded documents are encrypted and stored in nuestra secure vault. Documents will be purged automatically after project completion.
                       </p>
                    </div>

                    <button 
                      onClick={handleSubmit}
                      disabled={!agreed || !idFile || isSubmitting || !client?.activeAgreement?.body || client?.activeAgreement?.status === 'accepted'}
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
                 <p className="text-[8px] font-black uppercase tracking-widest">End-to-End Encryption Enabled</p>
                 <ShieldCheck className="w-4 h-4 opacity-30" />
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default AgreementPage;
