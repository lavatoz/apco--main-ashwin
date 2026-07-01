import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, CheckCircle, Clock, AlertCircle, X, Copy, ExternalLink, Upload, Loader2, Eye, Download, FileText } from 'lucide-react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import type { Client, Invoice } from '../../types';
import { api } from '../../services/api';
import ClientPageLoader from './ClientPageLoader';
import { useCompanyForClient } from '../../hooks/useCompanySettings';
import { generateInvoicePDF } from '../../utils/pdfGenerator';

const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatDate = (dateStr: string) => {
    try {
        return new Date(dateStr).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateStr;
    }
};

interface ClientInvoicesProps {
  client: Client | null;
  invoices: Invoice[];
}

const UPI_ID = 'joelabin85-@okaxis';
const BUSINESS_NAME = 'Aaha Kalyanam';

const ClientInvoices: React.FC<ClientInvoicesProps> = ({ client, invoices }) => {
  const navigate = useNavigate();
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<Invoice | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotBase64, setScreenshotBase64] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [loadingPdfId, setLoadingPdfId] = useState<string | null>(null);

  const [invoiceFiles, setInvoiceFiles] = useState<any[]>([]);
  const [quotationFiles, setQuotationFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  useEffect(() => {
    const fetchBillingFiles = async () => {
      if (!client) return;
      setLoadingFiles(true);
      try {
        const allProjects = await api.getProjects();
        const clientProjects = allProjects.filter(p => p.clientId === client.id);
        const mainProject = clientProjects[0];
        if (mainProject) {
          const [invs, quotes] = await Promise.all([
            api.getFilesByProject(mainProject.id, 'Invoices'),
            api.getFilesByProject(mainProject.id, 'Quotations')
          ]);
          setInvoiceFiles(invs || []);
          setQuotationFiles(quotes || []);
        }
      } catch (err) {
        console.error("Failed to fetch billing files", err);
      } finally {
        setLoadingFiles(false);
      }
    };
    fetchBillingFiles();
    
    window.addEventListener('finance-updated', fetchBillingFiles);
    return () => {
      window.removeEventListener('finance-updated', fetchBillingFiles);
    };
  }, [client?.id]);

  const settings = useCompanyForClient(client);

  // Load global settings to verify PDF lock/encryption status
  useEffect(() => {
    const globalStored = localStorage.getItem('artisans_global_settings');
    if (globalStored) {
      setGlobalSettings(JSON.parse(globalStored));
    }
  }, []);

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

  if (!client) return <ClientPageLoader />;

  const clientInvoices = invoices.filter(i => i.clientId === client.id);
  const quotesOnly = clientInvoices.filter(i => i.isQuotation || i.type === 'quotation');
  const invoicesOnly = clientInvoices.filter(i => !i.isQuotation && i.type !== 'quotation');

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

  // PDF Retrieval Logic matching priority order
  const getPdfDataUri = async (invoice: Invoice): Promise<string> => {
    // Priority 1 & 2: Use existing/cached PDF if available
    if (invoice.generatedPdf) {
      return invoice.generatedPdf;
    }

    // Priority 3: Regenerate only if missing
    if (!client || !settings) {
      throw new Error("Client or Company settings missing");
    }

    const doc = await generateInvoicePDF(invoice, client, settings, false);
    const dataUri = doc.output('datauristring');
    invoice.generatedPdf = dataUri;
    
    // Notify the application of the updated record to sync state
    window.dispatchEvent(new CustomEvent('finance-updated'));
    
    return dataUri;
  };

  const handleViewPdf = async (invoice: Invoice) => {
    setLoadingPdfId(invoice.id);
    try {
      if (invoice.type === 'quotation' || invoice.isQuotation) {
        const file = quotationFiles.find((f: any) => 
          (invoice.quotationNumber && f.fileName.toLowerCase().includes(invoice.quotationNumber.toLowerCase())) ||
          f.fileName.toLowerCase().includes(invoice.id.toLowerCase())
        );
        if (!file) {
          alert("Quotation PDF has not been generated by the administrator yet.");
          return;
        }
        const blob = await api.getFileBlob(file.id);
        const fileURL = URL.createObjectURL(blob);
        const newTab = window.open();
        if (newTab) {
          newTab.document.write(
            `<iframe src="${fileURL}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
          );
          newTab.document.title = `Quotation ${invoice.quotationNumber || invoice.id}`;
          
          newTab.addEventListener('beforeunload', () => {
            try {
              URL.revokeObjectURL(fileURL);
            } catch (e) {}
          });
          setTimeout(() => {
            try {
              URL.revokeObjectURL(fileURL);
            } catch (e) {}
          }, 15000);
        } else {
          URL.revokeObjectURL(fileURL);
          alert("Pop-up blocked! Please allow pop-ups to view PDF.");
        }
      } else {
        const pdfDataUri = await getPdfDataUri(invoice);
        const newTab = window.open();
        if (newTab) {
          newTab.document.write(
            `<iframe src="${pdfDataUri}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
          );
          newTab.document.title = `Invoice ${invoice.id}`;
        } else {
          alert("Pop-up blocked! Please allow pop-ups to view PDF.");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to open PDF viewer.");
    } finally {
      setLoadingPdfId(null);
    }
  };

  const handleDownloadPdf = async (invoice: Invoice) => {
    setLoadingPdfId(invoice.id);
    try {
      if (invoice.type === 'quotation' || invoice.isQuotation) {
        const file = quotationFiles.find((f: any) => 
          (invoice.quotationNumber && f.fileName.toLowerCase().includes(invoice.quotationNumber.toLowerCase())) ||
          f.fileName.toLowerCase().includes(invoice.id.toLowerCase())
        );
        if (!file) {
          alert("Quotation PDF has not been generated by the administrator yet.");
          return;
        }
        const blob = await api.getFileBlob(file.id);
        const fileURL = URL.createObjectURL(blob);
        const filename = file.fileName || `Quotation_${invoice.quotationNumber || invoice.id}.pdf`;
        const link = document.createElement('a');
        link.href = fileURL;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(fileURL);
      } else {
        const pdfDataUri = await getPdfDataUri(invoice);
        const filename = `Invoice_${invoice.id}.pdf`;
        const link = document.createElement('a');
        link.href = pdfDataUri;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to download PDF.");
    } finally {
      setLoadingPdfId(null);
    }
  };

  const renderCard = (invoice: Invoice, index: number, isQuote: boolean) => {
     const balance = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);
     const isPaid = balance <= 0 && (invoice.totalAmount || 0) > 0;
     const isSubmitted = invoice.status === 'Payment Submitted';
     const isEncrypted = !!globalSettings?.pdfOwnerPassword;
     
     const title = isQuote ? `Quotation ${invoice.id}` : `Invoice ${invoice.id}`;
     
     return (
       <div key={invoice.id || index} className="glass-panel p-8 squircle-lg flex flex-col md:flex-row gap-8 items-center justify-between border border-white/5 hover:bg-white/5 transition-colors relative overflow-hidden">
          {!isQuote && isSubmitted && <div className="absolute top-0 right-0 w-1.5 h-full bg-primary opacity-50" />}
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full md:w-auto">
             <div className={`p-5 rounded-2xl shrink-0 ${isQuote ? 'bg-indigo-500/10 text-indigo-400' : isPaid ? 'bg-primary/10 text-primary' : isSubmitted ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-500'}`}>
                {isQuote ? <Receipt className="w-8 h-8" /> : isPaid ? <CheckCircle className="w-8 h-8" /> : isSubmitted ? <Clock className="w-8 h-8" /> : balance > 0 && invoice.status === 'Overdue' ? <AlertCircle className="w-8 h-8 text-red-500" /> : <Clock className="w-8 h-8" />}
             </div>
             <div className="space-y-3">
                <div>
                   <h3 className="text-xl font-black tracking-tight uppercase mb-1">{title}</h3>
                   <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                   <span className={`px-2.5 py-1 text-[8.5px] font-black uppercase rounded-lg tracking-widest border ${isQuote ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                      {isQuote ? 'Quotation' : 'Invoice'}
                   </span>
                   <span className="px-2.5 py-1 text-[8.5px] font-black uppercase rounded-lg tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      PDF Available
                   </span>
                   {isEncrypted && (
                      <span className="px-2.5 py-1 text-[8.5px] font-black uppercase rounded-lg tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
                         Protected
                      </span>
                   )}
                   {isQuote ? (
                      <span className={`px-2.5 py-1 text-[8.5px] font-black uppercase rounded-lg tracking-widest ${['Approved', 'ACCEPTED', 'Accepted', 'Paid', 'Agreement Completed'].includes(invoice.status as string) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                         {['Approved', 'ACCEPTED', 'Accepted', 'Paid', 'Agreement Completed'].includes(invoice.status as string) ? 'Accepted' : 'Review Required'}
                      </span>
                   ) : (
                      <span className={`px-2.5 py-1 text-[8.5px] font-black uppercase rounded-lg tracking-widest ${isPaid ? 'bg-primary/10 text-primary border-primary/20' : isSubmitted ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                         {isPaid ? 'Paid' : isSubmitted ? 'Submitted' : 'Unpaid'}
                      </span>
                   )}
                </div>
             </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8 w-full md:w-auto mt-6 md:mt-0">
             <div className="flex md:flex-col justify-between md:justify-center items-center md:items-end w-full md:w-auto gap-1 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-sans">Total Amount</span>
                <span className="text-xl font-black">₹{(invoice.totalAmount || 0).toLocaleString('en-IN')}</span>
             </div>
             
             {!isQuote && (
                <div className="flex md:flex-col justify-between md:justify-center items-center md:items-end w-full md:w-auto gap-1">
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Balance Due</span>
                   <span className={`text-xl font-black ${isPaid ? 'text-primary' : 'text-amber-500'}`}>₹{balance.toLocaleString('en-IN')}</span>
                </div>
             )}
             
             <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                <button
                   onClick={() => handleViewPdf(invoice)}
                   disabled={loadingPdfId === invoice.id}
                   className="w-full sm:w-auto px-6 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                   {loadingPdfId === invoice.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                   <span>View PDF</span>
                </button>
                <button
                   onClick={() => handleDownloadPdf(invoice)}
                   disabled={loadingPdfId === invoice.id}
                   className="w-full sm:w-auto px-6 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                   {loadingPdfId === invoice.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                   <span>Download PDF</span>
                </button>
                {isQuote ? (
                   <button
                      onClick={async () => {
                         const statusStr = invoice.status as string;
                         if (!['Approved', 'ACCEPTED', 'Accepted', 'Paid', 'Agreement Completed'].includes(statusStr)) {
                            try {
                               await api.acceptQuotation(invoice.id, invoice);
                            } catch (err) {
                               console.warn("Quotation acceptance helper error:", err);
                            }
                            navigate('/agreements');
                         }
                      }}
                      className={`w-full sm:w-auto px-6 py-4 ${['Approved', 'ACCEPTED', 'Accepted', 'Paid', 'Agreement Completed'].includes(invoice.status as string) ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-primary text-black hover:opacity-90'} text-xs font-bold uppercase tracking-widest rounded-xl transition-colors active:scale-95`}
                      disabled={['Approved', 'ACCEPTED', 'Accepted', 'Paid', 'Agreement Completed'].includes(invoice.status as string)}
                   >
                      {['Approved', 'ACCEPTED', 'Accepted', 'Paid', 'Agreement Completed'].includes(invoice.status as string) ? 'Accepted' : 'Accept Quotation'}
                   </button>
                ) : (
                   <button
                      onClick={() => !isPaid && !isSubmitted ? setActivePaymentInvoice(invoice) : null}
                      className={`w-full sm:w-auto px-8 py-4 ${isPaid ? 'bg-white text-black' : isSubmitted ? 'bg-primary/10 border border-primary/20 text-primary' : 'bg-primary text-black'} text-xs font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition-colors active:scale-95 shadow-xl disabled:opacity-50`}
                      disabled={isPaid || isSubmitted}
                   >
                      {isPaid ? 'View Receipt' : isSubmitted ? 'Verification Pending' : 'Pay Now'}
                   </button>
                )}
             </div>
          </div>
       </div>
     );
  };

  return (
    <div className="p-8 md:p-12 animate-ios-slide-up max-w-[1400px] mx-auto pb-32">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Billing & Documents</h1>
        <p className="text-xl text-zinc-400 font-medium">Financial Statements, Quotations, and Secure Payments</p>
      </div>

      <div className="space-y-12">
        {/* QUOTATIONS */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <h2 className="text-sm font-black uppercase text-zinc-400 tracking-[0.2em]">Quotations ({quotesOnly.length})</h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="space-y-6">
             {quotesOnly.map((invoice, i) => renderCard(invoice, i, true))}
             {quotesOnly.length === 0 && (
                <div className="py-16 text-center glass-panel border border-dashed rounded-[2rem] border-white/5">
                   <p className="text-xs font-bold uppercase tracking-widest text-zinc-700">No active quotations generated yet</p>
                </div>
             )}
          </div>

          {/* Uploaded Quotation Documents */}
          {loadingFiles ? (
            <div className="py-6 flex flex-col items-center justify-center bg-white/[0.01] border border-white/5 rounded-2xl">
              <div className="w-5 h-5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-2" />
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Checking for documents...</p>
            </div>
          ) : quotationFiles.length > 0 ? (
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h3 className="text-xs font-black uppercase text-zinc-500 tracking-[0.15em] px-2">Quotation Documents ({quotationFiles.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quotationFiles.map((file: any) => (
                  <div key={file.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-white truncate uppercase tracking-wider mb-1" title={file.fileName}>{file.fileName}</h4>
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                          {formatBytes(file.size || 0)} • {formatDate(file.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => api.downloadProjectFile(file.id, file.fileName)}
                      className="p-3 bg-white/5 hover:bg-white text-zinc-400 hover:text-black rounded-xl transition-all border border-white/10 shrink-0"
                      title="Download Quotation Document"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* INVOICES */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <h2 className="text-sm font-black uppercase text-zinc-400 tracking-[0.2em]">Invoices ({invoicesOnly.length})</h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="space-y-6">
             {invoicesOnly.map((invoice, i) => renderCard(invoice, i, false))}
             {invoicesOnly.length === 0 && (
                <div className="py-16 text-center glass-panel border border-dashed rounded-[2rem] border-white/5">
                   <p className="text-xs font-bold uppercase tracking-widest text-zinc-700">No active invoices generated yet</p>
                </div>
             )}
          </div>

          {/* Uploaded Invoice Documents */}
          {loadingFiles ? (
            <div className="py-6 flex flex-col items-center justify-center bg-white/[0.01] border border-white/5 rounded-2xl">
              <div className="w-5 h-5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-2" />
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Checking for documents...</p>
            </div>
          ) : invoiceFiles.length > 0 ? (
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h3 className="text-xs font-black uppercase text-zinc-500 tracking-[0.15em] px-2">Invoice Documents ({invoiceFiles.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invoiceFiles.map((file: any) => (
                  <div key={file.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-white truncate uppercase tracking-wider mb-1" title={file.fileName}>{file.fileName}</h4>
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                          {formatBytes(file.size || 0)} • {formatDate(file.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => api.downloadProjectFile(file.id, file.fileName)}
                      className="p-3 bg-white/5 hover:bg-white text-zinc-400 hover:text-black rounded-xl transition-all border border-white/10 shrink-0"
                      title="Download Invoice Document"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
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
                <div className="text-center space-y-2">
                   <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">Invoice Number: {activePaymentInvoice.id}</p>
                   <h3 className="text-4xl font-black text-emerald-400 font-mono">₹{((activePaymentInvoice.totalAmount || 0) - (activePaymentInvoice.paidAmount || 0)).toLocaleString('en-IN')}</h3>
                </div>

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

                <div className="md:hidden">
                   <a 
                     href={`upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(BUSINESS_NAME)}&am=${(activePaymentInvoice.totalAmount || 0) - (activePaymentInvoice.paidAmount || 0)}&cu=INR&tn=${activePaymentInvoice.id}`}
                     className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-black font-black uppercase text-sm rounded-xl active:scale-95 transition-transform"
                   >
                     <ExternalLink size={18} /> Open UPI App
                   </a>
                </div>

                <div className="hidden md:flex justify-center">
                   <button 
                     onClick={() => copyToClipboard(`upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(BUSINESS_NAME)}&am=${(activePaymentInvoice.totalAmount || 0) - (activePaymentInvoice.paidAmount || 0)}&cu=INR&tn=${activePaymentInvoice.id}`, 'Payment Link')}
                     className="text-xs font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20 transition-colors"
                   >
                      <Copy size={14} /> Copy Payment Link
                   </button>
                </div>

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
