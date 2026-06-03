import React from 'react';
import { type Invoice, type Client, type CompanyProfile } from '../types';
import { quoteTemplates, invoiceTemplates, getTemplate } from '../templates/registry';
import { type CustomTemplateMetadata } from '../templates/types';
import { X, Printer, Download } from 'lucide-react';
import { generateInvoicePDF } from '../utils/pdfGenerator';

interface DocumentPreviewModalProps {
  documentData: Invoice | any;
  client: Client;
  company: CompanyProfile;
  type: 'quote' | 'invoice';
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ documentData, client, company, type, onClose }) => {
  const registry = type === 'quote' ? quoteTemplates : invoiceTemplates;
  const templateId = type === 'quote' ? company.defaultQuoteTemplate : company.defaultInvoiceTemplate;
  const templateDef = getTemplate(registry, templateId || 'default_v1', 'default_v1');

  const handleDownload = async () => {
    // Generate PDF using existing pdfGenerator logic
    // We will update pdfGenerator to handle these new templates natively next.
    await generateInvoicePDF(documentData, client, company);
  };

  const handlePrint = () => {
    window.print();
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
         <div id="document-preview-container" className="print:w-full print:max-w-none print:shadow-none shadow-2xl relative w-full max-w-[210mm] min-h-[297mm]">
            {templateDef.metadata.type === 'react' && templateDef.component ? (
               <templateDef.component company={company} client={client} document={documentData} />
            ) : templateDef.metadata.type === 'canva_image' ? (
               <CustomImageRenderer metadata={templateDef.metadata as CustomTemplateMetadata} documentData={documentData} client={client} company={company} />
            ) : (
               <div className="p-12 text-center text-zinc-500">
                  <p>Unsupported template type.</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

// Sub-component to render uploaded image with mapped fields
const CustomImageRenderer: React.FC<{ metadata: CustomTemplateMetadata, documentData: any, client: Client, company: CompanyProfile }> = ({ metadata, documentData, client, company }) => {
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
