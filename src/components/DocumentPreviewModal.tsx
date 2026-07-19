import React, { useState, useEffect } from 'react';
import { type Invoice, type Client, type CompanyProfile } from '../types';
import { quoteTemplates, invoiceTemplates, getBrandQuoteTemplate, getBrandInvoiceTemplate } from '../templates/registry';
import { type CustomTemplateMetadata } from '../templates/types';
import { 
  X, 
  Printer, 
  Download, 
  Loader2, 
  Lock, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { api, API_URL, getAccessToken } from '../services/api';

// PDF.js (react-pdf) config
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface DocumentPreviewModalProps {
  documentData: Invoice | any;
  client: Client;
  company: CompanyProfile;
  type: 'quote' | 'invoice';
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ documentData, client, company, type, onClose }) => {
  const registry = type === 'quote' ? quoteTemplates : invoiceTemplates;
  const isAaha = (company.companyName || company.id || '').toLowerCase().includes('aaha');
  const docTemplateId = documentData?.templateId;
  const companyTemplateId = type === 'quote' ? company.defaultQuoteTemplate : company.defaultInvoiceTemplate;
  const templateId = isAaha 
    ? 'apco_master_v1'
    : ((docTemplateId && registry[docTemplateId]) ? docTemplateId : companyTemplateId);
    
  const brandResolver = type === 'quote' ? getBrandQuoteTemplate : getBrandInvoiceTemplate;
  const resolvedBrandTemplate = brandResolver(company.id || company.companyName);
  const templateDef = templateId && registry[templateId]
    ? registry[templateId]
    : resolvedBrandTemplate;

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PDF.js (react-pdf) viewer states
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1.25);
  
  // Custom password prompt states
  const [needsPassword, setNeedsPassword] = useState<boolean>(false);
  const [inputPassword, setInputPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordCallback, setPasswordCallback] = useState<((password: string | null) => void) | null>(null);

  useEffect(() => {
    let active = true;
    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      
      console.log("[PREVIEW] --- STARTING PDF PREVIEW FLOW ---");
      console.log("[PREVIEW] Step 1: User clicked Preview. Document type:", type, "ID:", documentData.id);

      try {
        let url = '';
        if (type === 'quote') {
          const token = getAccessToken();
          const generateUrl = `${API_URL}/quotations/${documentData.id}/generate-pdf`;
          
          console.log("[PREVIEW] Step 2: Requesting PDF Generation...");
          console.log("[PREVIEW] Request URL:", generateUrl);
          console.log("[PREVIEW] Request Method: POST");
          const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          };
          console.log("[PREVIEW] Request Headers:", headers);
          console.log("[PREVIEW] Request Payload: None (empty body for generate-pdf)");

          const response = await fetch(generateUrl, {
            method: 'POST',
            headers
          });

          console.log("[PREVIEW] Response Status:", response.status);
          const responseHeaders: Record<string, string> = {};
          response.headers.forEach((val, key) => {
            responseHeaders[key] = val;
          });
          console.log("[PREVIEW] Response Headers:", responseHeaders);

          const responseText = await response.text();
          let resData: any = {};
          try {
            resData = JSON.parse(responseText);
          } catch (e) {
            console.warn("[PREVIEW] Response body is not valid JSON:", responseText);
          }
          console.log("[PREVIEW] Response Body:", resData);

          if (!response.ok) {
            console.error("[PREVIEW] PDF Generation Request Failed:", responseText);
            throw new Error(`HTTP Status: ${response.status}\nBackend Error: ${resData.message || responseText}\nContent Type: ${responseHeaders['content-type'] || 'unknown'}`);
          }

          if (resData.success && resData.fileId) {
            console.log("[PREVIEW] PDF Generated Successfully. File ID:", resData.fileId);
            
            console.log("[PREVIEW] Step 3: Requesting PDF File Blob...");
            const downloadUrl = `${API_URL}/files/${resData.fileId}/download`;
            console.log("[PREVIEW] Download URL:", downloadUrl);
            console.log("[PREVIEW] Download Method: GET");
            
            const downloadHeaders = {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };
            console.log("[PREVIEW] Download Headers:", downloadHeaders);

            const downloadResponse = await fetch(downloadUrl, {
              method: 'GET',
              headers: downloadHeaders
            });

            console.log("[PREVIEW] Step 3 Validation: Response Type Check");
            console.log({
              status: downloadResponse.status,
              contentType: downloadResponse.headers.get("content-type")
            });

            const contentType = downloadResponse.headers.get("content-type") || '';
            
            if (contentType.includes("application/json") || contentType.includes("text/html")) {
              const downloadErrorText = await downloadResponse.text();
              console.error("[PREVIEW] Expected PDF but received error response:", downloadErrorText);
              
              let parsedError = downloadErrorText;
              try {
                const parsed = JSON.parse(downloadErrorText);
                parsedError = parsed.message || downloadErrorText;
              } catch (e) {}

              throw new Error(`HTTP Status: ${downloadResponse.status}\nBackend Error: ${parsedError}\nContent Type: ${contentType}`);
            }

            if (!downloadResponse.ok) {
              const downloadErrorText = await downloadResponse.text();
              throw new Error(`HTTP Status: ${downloadResponse.status}\nBackend Error: ${downloadErrorText}\nContent Type: ${contentType}`);
            }

            console.log("[PREVIEW] Step 4: Creating Blob from response...");
            const blob = await downloadResponse.blob();
            
            console.log("[PREVIEW] Step 4 Validation: Blob Check");
            console.log({
              size: blob.size,
              type: blob.type
            });

            if (blob.size === 0) {
              throw new Error(`HTTP Status: ${downloadResponse.status}\nBackend Error: Received 0-byte file.\nContent Type: ${contentType}\nBlob Size: 0`);
            }

            console.log("[PREVIEW] Step 5: Creating Object URL...");
            if (active) {
              url = URL.createObjectURL(blob);
              console.log("[PREVIEW] Step 5 Validation: Object URL created:", url);
            }
          } else {
            throw new Error(`HTTP Status: ${response.status}\nBackend Error: Missing fileId in response.\nContent Type: application/json`);
          }
        } else {
          // Generate Invoice PDF on the fly using frontend jsPDF renderer
          console.log("[PREVIEW] Generating Invoice PDF on the fly (frontend)...");
          const doc = await generateInvoicePDF(documentData, client, company, false);
          const blob = doc.output('blob');
          console.log("[PREVIEW] Frontend generated invoice PDF blob size:", blob.size);
          if (active) {
            url = URL.createObjectURL(blob);
          }
        }

        if (active) {
          setPdfUrl(url);
          console.log("[PREVIEW] PDF loaded successfully into component state.");
        }
      } catch (err: any) {
        console.error(`[PREVIEW] Error generating/fetching ${type} PDF:`, err);
        if (active) {
          setError(err.message || `Unable to load ${type} PDF.`);
          setLoading(false);
        }
      }
    };
    loadPdf();

    return () => {
      active = false;
    };
  }, [documentData.id, type, client, company]);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleDownload = async () => {
    if (type === 'quote') {
      try {
        const res = await api.generateQuotationPDF(documentData.id);
        if (res.success && res.fileId) {
          await api.downloadProjectFile(res.fileId, res.fileName || `Quotation_${documentData.id}.pdf`);
        } else {
          alert("Failed to generate quotation PDF.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to download backend-generated quotation PDF.");
      }
    } else {
      // Generate PDF using existing pdfGenerator logic
      await generateInvoicePDF(documentData, client, company);
    }
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    
    // Create a temporary hidden iframe to print
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';
    printFrame.src = pdfUrl;
    
    document.body.appendChild(printFrame);
    
    printFrame.onload = () => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch (err) {
        console.error('[PREVIEW] Print failed from iframe, falling back to window.print():', err);
        window.print();
      }
      // Cleanup after printing is done
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 5000);
    };
  };

  const handlePassword = (callback: (password: string | null) => void, reason: number) => {
    setNeedsPassword(true);
    setPasswordCallback(() => callback);
    if (reason === 2) { // INCORRECT_PASSWORD
      setPasswordError('Verification Failure: Invalid Password Key');
    }
  };

  const handleSubmitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordCallback) {
      passwordCallback(inputPassword);
    }
  };

  const handleClose = () => {
    if (passwordCallback) {
      passwordCallback(null);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[9999] flex flex-col backdrop-blur-md animate-ios-fade-in print:bg-white print:static print:z-0">
      {/* Header - Hidden on Print */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-950 print:hidden select-none">
        <div>
          <h2 className="text-white font-bold tracking-widest uppercase">Document Preview</h2>
          <p className="text-zinc-500 text-xs mt-1">Using template: {templateDef.metadata.name}</p>
        </div>

        {/* Center Page & Zoom Navigation (Only visible when document loaded and not password locked) */}
        {!needsPassword && !loading && numPages > 0 && (
          <div className="flex items-center gap-6">
            {/* Page Navigation */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                disabled={currentPage <= 1}
                className="p-1 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400 hover:text-white transition-colors"
                type="button"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold text-zinc-350 min-w-[70px] text-center">
                PAGE {currentPage} / {numPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, numPages))} 
                disabled={currentPage >= numPages}
                className="p-1 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400 hover:text-white transition-colors"
                type="button"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
              <button 
                onClick={() => setZoomScale(prev => Math.max(prev - 0.25, 0.5))} 
                disabled={zoomScale <= 0.5}
                className="p-1 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400 hover:text-white transition-colors"
                type="button"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold text-zinc-350 min-w-[50px] text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button 
                onClick={() => setZoomScale(prev => Math.min(prev + 0.25, 2.5))} 
                disabled={zoomScale >= 2.5}
                className="p-1 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400 hover:text-white transition-colors"
                type="button"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors">
            <Download className="w-4 h-4" /> Download PDF
          </button>
          <button onClick={handleClose} className="p-2 text-zinc-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8 print:p-0 flex justify-center bg-zinc-900 print:bg-white print:overflow-visible">
         <div className="w-full max-w-[210mm] min-h-[297mm] flex justify-center items-start relative">
           {/* Loading Indicator */}
           {loading && !needsPassword && (
             <div className="flex flex-col items-center justify-center text-zinc-400 gap-4 mt-20">
               <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
               <p className="text-xs font-black uppercase tracking-[0.2em]">Decrypting &amp; Loading PDF...</p>
             </div>
           )}

            {/* Error Message */}
            {error && (
              <div className="p-12 text-center text-red-400 bg-red-950/20 border border-red-900/30 rounded-2xl max-w-2xl mt-20 space-y-4">
                <p className="font-black uppercase tracking-wider mb-2 text-red-500">Preview Generation Failed</p>
                <div className="text-left text-xs font-mono bg-black/40 p-4 rounded-xl border border-white/5 space-y-2 overflow-x-auto text-zinc-300">
                  {error.split('\n').map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </div>
            )}

           {/* PDF Document Container - Remains mounted to keep decryption callback alive */}
           {pdfUrl && !error && (
             <div className={needsPassword ? 'hidden' : 'w-full flex justify-center'}>
                <Document
                  file={pdfUrl}
                  onLoadSuccess={({ numPages }) => {
                    console.log("[PREVIEW] PDF.js Callback: onLoadSuccess. Total pages:", numPages);
                    setNumPages(numPages);
                    setCurrentPage(1);
                    setNeedsPassword(false);
                    setLoading(false);
                  }}
                  onPassword={(callback, reason) => {
                    console.log("[PREVIEW] PDF.js Callback: onPassword. Reason:", reason);
                    handlePassword(callback, reason);
                  }}
                  onLoadError={(err) => {
                    console.error("[PREVIEW] PDF.js Callback: onLoadError. Full error:", err);
                    if (!needsPassword) {
                      setError(`PDF.js Load Error: ${err.message || 'Unknown error'}\n${JSON.stringify(err)}`);
                      setLoading(false);
                    }
                  }}
                  onSourceError={(err) => {
                    console.error("[PREVIEW] PDF.js Callback: onSourceError. Full error:", err);
                    setError(`PDF.js Source Error: ${err.message || 'Unknown source error'}\n${JSON.stringify(err)}`);
                    setLoading(false);
                  }}
                  loading={null}
                >
                 {!needsPassword && !loading && (
                   <Page
                     pageNumber={currentPage}
                     scale={zoomScale}
                     renderTextLayer={false}
                     renderAnnotationLayer={false}
                     className="shadow-2xl rounded-2xl overflow-hidden border border-white/5 bg-zinc-950"
                     loading={
                       <div className="flex flex-col items-center justify-center text-zinc-400 gap-4 min-h-[300px]">
                         <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                         <p className="text-xs font-black uppercase tracking-[0.2em]">Rendering page...</p>
                       </div>
                     }
                   />
                 )}
               </Document>
             </div>
           )}

           {/* Password Overlay */}
           {needsPassword && (
             <form 
               onSubmit={handleSubmitPassword}
               className="relative max-w-sm w-full bg-zinc-950/70 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-2xl text-center space-y-8 shadow-[0_24px_50px_rgba(0,0,0,0.8)] mt-12 z-20"
             >
               <div className="flex flex-col items-center gap-3">
                 <div className="p-5 bg-white/5 border border-white/5 rounded-[2rem] text-zinc-400">
                   <Lock className="w-10 h-10" />
                 </div>
                 <h1 className="text-2xl font-black uppercase tracking-tighter text-white">DECRYPT PREVIEW</h1>
                 <p className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase">Document password required</p>
               </div>

               <div className="space-y-4">
                 <div className="relative">
                   <input
                     type={showPassword ? 'text' : 'password'}
                     placeholder="ENTER DOCUMENT PASSWORD..."
                     value={inputPassword}
                     onChange={(e) => {
                       setInputPassword(e.target.value);
                       setPasswordError(null);
                     }}
                     className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-center font-mono font-bold text-white text-sm tracking-widest outline-none pr-12 focus:border-white/20 transition-all"
                     autoFocus
                   />
                   <button
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                   >
                     {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                   </button>
                 </div>
                 {passwordError && (
                   <p className="text-[9px] font-black uppercase text-red-500 tracking-widest">
                     {passwordError}
                   </p>
                 )}
               </div>

               <button
                 type="submit"
                 className="w-full flex items-center justify-center gap-2 py-4 bg-white text-black hover:bg-zinc-200 transition-colors font-black text-[10px] uppercase tracking-widest rounded-2xl"
               >
                 <span>Decrypt Access</span>
               </button>
             </form>
           )}
         </div>
      </div>
    </div>
  );
};

// Sub-component to render uploaded image with mapped fields
export const CustomImageRenderer: React.FC<{ metadata: CustomTemplateMetadata, documentData: any, client: Client, company: CompanyProfile }> = ({ metadata, documentData, client, company }) => {
   const fields = metadata.fieldMap;
   
   const items = documentData?.items || [];
   const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
   const tax = documentData?.taxPercent ? (subtotal * documentData.taxPercent) / 100 : 0;
   const total = subtotal + tax - (documentData?.discountValue || 0);
   const paidAmount = documentData?.paidAmount || 0;
   const balance = total - paidAmount;
   
   const renderField = (key: keyof CustomTemplateMetadata['fieldMap'], value: string | React.ReactNode) => {
      const config = fields[key];
      if (!config || !config.visible) return null;
      return (
         <div 
           key={key}
           className="absolute pointer-events-none"
           style={{
             left: `${config.x}%`,
             top: `${config.y}%`,
             transform: 'translate(-50%, -50%)',
             color: config.fontColor || '#000000',
             fontSize: `${config.fontSize || 12}px`,
             textAlign: config.align || 'left',
             width: config.width ? `${config.width}%` : 'auto',
             whiteSpace: 'nowrap'
           }}
         >
            {value}
         </div>
      );
   };

   return (
      <div className="relative w-full h-full min-h-[297mm] bg-white text-black font-sans">
         {metadata.backgroundUrl && (
            <img src={metadata.backgroundUrl} alt="Background" className="absolute inset-0 w-full h-full object-fill pointer-events-none" />
         )}
         
         {renderField('clientName', client?.projectName || client?.name || '')}
         {renderField('invoiceNumber', documentData?.id || '')}
         {renderField('date', documentData?.issueDate ? new Date(documentData.issueDate).toLocaleDateString('en-GB') : '')}
         {renderField('dueDate', documentData?.dueDate ? new Date(documentData.dueDate).toLocaleDateString('en-GB') : '')}
         {renderField('total', `₹${total.toLocaleString()}`)}
         {renderField('advancePaid', `₹${paidAmount.toLocaleString()}`)}
         {renderField('balanceDue', `₹${balance.toLocaleString()}`)}
         {renderField('upiDetails', company?.upiId || '')}
         
         {/* Items Table Custom Rendering */}
         {fields.itemsTable?.visible && (
            <div 
              className="absolute pointer-events-none"
              style={{
                left: `${fields.itemsTable.x}%`,
                top: `${fields.itemsTable.y}%`,
                transform: 'translateX(-50%)', // Only center X so it flows down
                width: fields.itemsTable.width ? `${fields.itemsTable.width}%` : '80%',
                color: fields.itemsTable.fontColor || '#000000',
                fontSize: `${fields.itemsTable.fontSize || 12}px`
              }}
            >
               <table className="w-full text-left">
                  <tbody>
                     {items.map((item: any, i: number) => (
                        <tr key={i} style={{ height: `${fields.itemsTable?.rowHeight || 30}px` }}>
                           <td>{item.description}</td>
                           <td className="text-center">{item.quantity}</td>
                           <td className="text-right">₹{item.price?.toLocaleString()}</td>
                           <td className="text-right">₹{(item.quantity * item.price).toLocaleString()}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>
   );
};
