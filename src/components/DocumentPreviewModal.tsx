import React, { useState, useEffect, useRef } from 'react';
import { type Invoice, type Client, type CompanyProfile } from '../types';
import { quoteTemplates, invoiceTemplates, getBrandQuoteTemplate, getBrandInvoiceTemplate } from '../templates/registry';
import { type CustomTemplateMetadata } from '../templates/types';
import { X, Printer, Download, Loader2 } from 'lucide-react';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { api } from '../services/api';

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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let active = true;
    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      try {
        if (type === 'quote') {
          const res = await api.generateQuotationPDF(documentData.id);
          if (res.success && res.fileId) {
            const blob = await api.getFileBlob(res.fileId);
            if (active) {
              const url = URL.createObjectURL(blob);
              setPdfUrl(url);
            }
          } else {
            if (active) {
              setError("Unable to load quotation PDF. Please try again later or contact an administrator.");
            }
          }
        } else {
          // Generate Invoice PDF on the fly using frontend jsPDF renderer
          const doc = await generateInvoicePDF(documentData, client, company, false);
          const blob = doc.output('blob');
          if (active) {
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
          }
        }
      } catch (err: any) {
        console.error(`[PREVIEW] Error generating/fetching ${type} PDF:`, err);
        if (active) {
          setError(`Unable to load ${type} PDF. Please try again later or contact an administrator.`);
        }
      } finally {
        if (active) {
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
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.focus();
        iframeRef.current.contentWindow?.print();
      } catch (err) {
        console.error("[PREVIEW] Iframe printing failed, falling back to window.print():", err);
        window.print();
      }
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[9999] flex flex-col backdrop-blur-md animate-ios-fade-in print:bg-white print:static print:z-0">
      {/* Header - Hidden on Print */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-950 print:hidden">
        <div>
          <h2 className="text-white font-bold tracking-widest uppercase">Document Preview</h2>
          <p className="text-zinc-500 text-xs mt-1">Using template: {templateDef.metadata.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors">
            <Download className="w-4 h-4" /> Download PDF
          </button>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8 print:p-0 flex justify-center bg-zinc-900 print:bg-white print:overflow-visible">
         <div className="w-full max-w-[210mm] min-h-[297mm] flex items-center justify-center">
           {loading ? (
             <div className="flex flex-col items-center justify-center text-zinc-400 gap-4">
               <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
               <p className="text-xs font-black uppercase tracking-[0.2em]">Generating Premium PDF...</p>
             </div>
           ) : error ? (
             <div className="p-12 text-center text-red-400 bg-red-950/20 border border-red-900/30 rounded-2xl max-w-md">
               <p className="font-black uppercase tracking-wider mb-2">Preview Generation Failed</p>
               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{error}</p>
             </div>
           ) : pdfUrl ? (
             <iframe
               ref={iframeRef}
               src={pdfUrl}
               className="w-full h-[297mm] border-0 rounded-2xl shadow-2xl bg-zinc-950"
               title={`${type === 'quote' ? 'Quotation' : 'Invoice'} ${documentData.id}`}
             />
           ) : null}
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
