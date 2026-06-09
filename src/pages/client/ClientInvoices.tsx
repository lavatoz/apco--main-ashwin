import React, { useState, useEffect } from 'react';
import { Receipt, CheckCircle, Clock, AlertCircle, X, Copy, ExternalLink, Upload, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import type { Client, Invoice } from '../../types';
import { api } from '../../services/api';

interface ClientInvoicesProps {
  client: Client | null;
  invoices: Invoice[];
}

const UPI_ID = 'joelabin85-@okaxis';
const BUSINESS_NAME = 'Aaha Kalyanam';

const ClientInvoices: React.FC<ClientInvoicesProps> = ({ client, invoices }) => {
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<Invoice | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotBase64, setScreenshotBase64] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When active payment invoice changes, generate QR code
  useEffect(() => {
    if (activePaymentInvoice) {
      const amount = (activePaymentInvoice.totalAmount || 0) - (activePaymentInvoice.paidAmount || 0);
      const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(BUSINESS_NAME)}&am=${amount}&cu=INR&tn=${activePaymentInvoice.id}`;
      QRCode.toDataURL(upiLink, { width: 300, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('QR Generate Error', err));
    }
  }, [activePaymentInvoice]);

  if (!client) return null;

  const clientInvoices = invoices.filter(i => i.clientId === client.id);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentInvoice) return;
    if (!utrNumber) {
       alert("Please enter the UTR/Transaction Number.");
       return;
    }

    setIsSubmitting(true);
    try {
      const amount = (activePaymentInvoice.totalAmount || 0) - (activePaymentInvoice.paidAmount || 0);
      
      const updatedInvoice: Invoice = {
        ...activePaymentInvoice,
        status: 'Payment Submitted',
        paymentVerification: {
          utrNumber,
          amount,
          screenshot: screenshotBase64,
          submittedAt: new Date().toISOString(),
          status: 'pending'
        }
      };

      await api.saveInvoice(updatedInvoice);

      // Log to client timeline
      if (client) {
         const timelineEvent = {
            id: Date.now().toString(),
            title: 'Payment Submitted',
            description: `Payment verification submitted for Invoice ${activePaymentInvoice.id} (UTR: ${utrNumber})`,
            date: new Date().toISOString(),
            status: 'Pending' as const,
            category: 'finance'
         };
         const updatedClient = {
            ...client,
            portal: {
               ...(client.portal || { timeline: [], deliverables: [], internalSpends: [] }),
               timeline: [...(client.portal?.timeline || []), timelineEvent]
            }
         };
         await api.saveClient(updatedClient);
      }

      window.dispatchEvent(new CustomEvent('finance-updated'));
      
      setActivePaymentInvoice(null);
      setUtrNumber('');
      setScreenshotFile(null);
      setScreenshotBase64('');
      alert("Payment verification submitted successfully! We will notify you once approved.");
    } catch (err) {
      console.error(err);
      alert("Failed to submit payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  return (
    <div className="p-8 md:p-12 animate-ios-slide-up max-w-[1400px] mx-auto pb-32">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Invoices</h1>
        <p className="text-xl text-zinc-400 font-medium">Financial Statements & Payments</p>
      </div>

      <div className="space-y-6">
        {clientInvoices.map((invoice, i) => {
          const balance = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);
          const isPaid = balance <= 0 && (invoice.totalAmount || 0) > 0;
          const isSubmitted = invoice.status === 'Payment Submitted';
          
          return (
            <div key={invoice.id || i} className="glass-panel p-8 squircle-lg flex flex-col md:flex-row gap-8 items-center justify-between border border-white/5 hover:bg-white/5 transition-colors relative overflow-hidden">
              {isSubmitted && <div className="absolute top-0 right-0 w-1.5 h-full bg-primary opacity-50" />}
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className={`p-5 rounded-2xl ${isPaid ? 'bg-primary/10 text-primary' : isSubmitted ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-500'}`}>
                  {isPaid ? <CheckCircle className="w-8 h-8" /> : isSubmitted ? <Clock className="w-8 h-8" /> : balance > 0 && invoice.status === 'Overdue' ? <AlertCircle className="w-8 h-8 text-red-500" /> : <Clock className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight uppercase mb-1">Invoice {invoice.id}</h3>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8 w-full md:w-auto">
                <div className="text-center md:text-right w-full md:w-auto">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Total Amount</p>
                  <p className="text-xl font-black">₹{(invoice.totalAmount || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="text-center md:text-right w-full md:w-auto">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Balance Due</p>
                  <p className={`text-xl font-black ${isPaid ? 'text-primary' : 'text-amber-500'}`}>₹{balance.toLocaleString('en-IN')}</p>
                </div>
                <button 
                   onClick={() => !isPaid && !isSubmitted ? setActivePaymentInvoice(invoice) : null}
                   className={`w-full md:w-auto px-8 py-4 ${isPaid ? 'bg-white text-black' : isSubmitted ? 'bg-primary text-white' : 'bg-primary text-black'} text-xs font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition-colors active:scale-95 shadow-xl disabled:opacity-50`}
                   disabled={isPaid || isSubmitted}
                >
                  {isPaid ? 'View Receipt' : isSubmitted ? 'Verification Pending' : 'Pay Now'}
                </button>
              </div>
            </div>
          );
        })}

        {clientInvoices.length === 0 && (
          <div className="py-20 text-center glass-panel border border-dashed rounded-[2rem]">
            <Receipt className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-600">No invoices generated yet</p>
          </div>
        )}
      </div>

      {activePaymentInvoice && createPortal(
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-md animate-ios-fade-in" onClick={() => setActivePaymentInvoice(null)}>
          <div 
             className="bg-zinc-900 border border-white/10 rounded-[2rem] w-full max-w-2xl shadow-2xl relative overflow-y-auto max-h-[90vh] no-scrollbar animate-ios-slide-up"
             onClick={(e) => e.stopPropagation()}
          >
             <div className="sticky top-0 bg-zinc-900/80 backdrop-blur-md border-b border-white/5 p-6 flex justify-between items-center z-10">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Pay Invoice</h2>
                <button onClick={() => setActivePaymentInvoice(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
             </div>

             <div className="p-8 space-y-8">
                {/* Invoice Details Header */}
                <div className="text-center space-y-2">
                   <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">Invoice Number: {activePaymentInvoice.id}</p>
                   <h3 className="text-4xl font-black text-emerald-400 font-mono">₹{((activePaymentInvoice.totalAmount || 0) - (activePaymentInvoice.paidAmount || 0)).toLocaleString('en-IN')}</h3>
                </div>

                {/* QR Section */}
                <div className="glass-panel p-8 squircle-lg border border-white/5 bg-white/5 flex flex-col items-center justify-center text-center">
                   {qrCodeUrl ? (
                      <div className="bg-white p-4 rounded-3xl mb-6 shadow-2xl">
                         <img src={qrCodeUrl} alt="UPI QR Code" className="w-48 h-48 md:w-64 md:h-64 object-contain" />
                      </div>
                   ) : (
                      <div className="w-48 h-48 md:w-64 md:h-64 bg-black/20 rounded-3xl mb-6 flex items-center justify-center border border-dashed border-white/10">
                         <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
                      </div>
                   )}
                   <p className="text-sm font-black text-white uppercase tracking-widest mb-1">Scan with any UPI App</p>
                   <p className="text-xs font-medium text-zinc-400">{BUSINESS_NAME}</p>
                   <div className="mt-4 inline-flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                      <span className="text-xs font-mono text-zinc-300">{UPI_ID}</span>
                      <button onClick={() => copyToClipboard(UPI_ID, 'UPI ID')} className="text-primary hover:text-emerald-400 p-1"><Copy size={14} /></button>
                   </div>
                </div>

                {/* Mobile Deep Link */}
                <div className="md:hidden">
                   <a 
                     href={`upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(BUSINESS_NAME)}&am=${(activePaymentInvoice.totalAmount || 0) - (activePaymentInvoice.paidAmount || 0)}&cu=INR&tn=${activePaymentInvoice.id}`}
                     className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-black font-black uppercase text-sm rounded-xl active:scale-95 transition-transform"
                   >
                     <ExternalLink size={18} /> Open UPI App
                   </a>
                </div>

                {/* Desktop Deep Link fallback */}
                <div className="hidden md:flex justify-center">
                   <button 
                     onClick={() => copyToClipboard(`upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(BUSINESS_NAME)}&am=${(activePaymentInvoice.totalAmount || 0) - (activePaymentInvoice.paidAmount || 0)}&cu=INR&tn=${activePaymentInvoice.id}`, 'Payment Link')}
                     className="text-xs font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20 transition-colors"
                   >
                      <Copy size={14} /> Copy Payment Link
                   </button>
                </div>

                {/* Submission Form */}
                <div className="border-t border-white/5 pt-8">
                   <h4 className="text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      Submit Payment Verification
                   </h4>
                   <form onSubmit={handlePaymentSubmit} className="space-y-5">
                      <div>
                         <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block mb-2">Transaction / UTR Number *</label>
                         <input 
                            type="text" 
                            required 
                            placeholder="e.g. 234810394012"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-sm text-white font-mono placeholder:text-zinc-700 outline-none focus:border-primary/50 transition-colors"
                            value={utrNumber}
                            onChange={(e) => setUtrNumber(e.target.value)}
                         />
                      </div>
                      
                      <div>
                         <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block mb-2">Payment Screenshot (Optional)</label>
                         <label className="w-full bg-black/50 border border-dashed border-white/20 rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer hover:bg-white/5 transition-colors group">
                            <Upload className="w-5 h-5 text-zinc-500 group-hover:text-primary transition-colors" />
                            <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">
                               {screenshotFile ? screenshotFile.name : 'Upload Screenshot Image'}
                            </span>
                            <input 
                               type="file" 
                               accept="image/*" 
                               className="hidden" 
                               onChange={handleFileChange}
                            />
                         </label>
                         {screenshotBase64 && (
                            <div className="mt-4 flex justify-center">
                               <img src={screenshotBase64} alt="Screenshot Preview" className="h-32 object-contain rounded-lg border border-white/10" />
                            </div>
                         )}
                      </div>

                      <button 
                         type="submit" 
                         disabled={isSubmitting}
                         className="w-full py-5 bg-white text-black font-black uppercase text-[11px] rounded-xl tracking-[0.2em] shadow-xl hover:bg-zinc-200 transition-colors active:scale-95 disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                      >
                         {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                         Submit Payment
                      </button>
                   </form>
                </div>
             </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ClientInvoices;

