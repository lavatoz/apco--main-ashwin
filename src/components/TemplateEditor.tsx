import React, { useState, useRef } from 'react';
import { type CustomTemplateMetadata, type TemplateFieldMap } from '../templates/types';
import { Save, Image as ImageIcon, Eye, EyeOff, GripHorizontal } from 'lucide-react';

interface TemplateEditorProps {
  onSave: (metadata: CustomTemplateMetadata) => void;
  onCancel: () => void;
  initialData?: CustomTemplateMetadata;
}

const DEFAULT_FIELDS: Record<keyof TemplateFieldMap, { label: string; defaultX: number; defaultY: number }> = {
  clientName: { label: 'Client Name', defaultX: 10, defaultY: 20 },
  invoiceNumber: { label: 'Invoice No.', defaultX: 70, defaultY: 10 },
  date: { label: 'Date', defaultX: 70, defaultY: 15 },
  dueDate: { label: 'Due Date', defaultX: 70, defaultY: 20 },
  itemsTable: { label: 'Items Table', defaultX: 10, defaultY: 40 },
  total: { label: 'Total Amount', defaultX: 70, defaultY: 80 },
  advancePaid: { label: 'Advance Paid', defaultX: 70, defaultY: 85 },
  balanceDue: { label: 'Balance Due', defaultX: 70, defaultY: 90 },
  qrCode: { label: 'QR Code', defaultX: 80, defaultY: 75 },
  upiDetails: { label: 'UPI Details', defaultX: 10, defaultY: 85 }
};

export const TemplateEditor: React.FC<TemplateEditorProps> = ({ onSave, onCancel, initialData }) => {
  const [templateName, setTemplateName] = useState(initialData?.name || 'New Custom Template');
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(initialData?.backgroundUrl || null);
  const [fields, setFields] = useState<TemplateFieldMap>(() => {
    if (initialData?.fieldMap) return initialData.fieldMap;
    const initialMap: any = {};
    (Object.keys(DEFAULT_FIELDS) as Array<keyof TemplateFieldMap>).forEach(key => {
      initialMap[key] = { x: DEFAULT_FIELDS[key].defaultX, y: DEFAULT_FIELDS[key].defaultY, visible: true, fontSize: 12, fontColor: '#000000', align: 'left' };
    });
    return initialMap;
  });

  const [activeTab, setActiveTab] = useState<'preview' | 'settings'>('preview');
  const [draggingField, setDraggingField] = useState<keyof TemplateFieldMap | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackgroundUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePointerDown = (e: React.PointerEvent, fieldKey: keyof TemplateFieldMap) => {
    e.stopPropagation();
    setDraggingField(fieldKey);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingField && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      let x = ((e.clientX - rect.left) / rect.width) * 100;
      let y = ((e.clientY - rect.top) / rect.height) * 100;
      
      // Constrain to bounds
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));

      setFields(prev => ({
        ...prev,
        [draggingField]: { ...prev[draggingField], x, y }
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingField) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setDraggingField(null);
    }
  };

  const toggleFieldVisibility = (fieldKey: keyof TemplateFieldMap) => {
    setFields(prev => ({
      ...prev,
      [fieldKey]: { ...prev[fieldKey], visible: !prev[fieldKey]?.visible }
    }));
  };

  const handleSave = () => {
    if (!backgroundUrl) {
      alert('Please upload a background image first.');
      return;
    }
    
    const newMetadata: CustomTemplateMetadata = {
      id: initialData?.id || `custom_${Date.now()}`,
      name: templateName,
      description: 'Custom uploaded PDF/Image template',
      version: '1.0',
      type: 'canva_image',
      documentType: 'invoice', // We can expand this to let user choose
      backgroundUrl,
      fieldMap: fields
    };
    
    onSave(newMetadata);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[9999] flex flex-col backdrop-blur-md animate-ios-fade-in text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-950">
        <div className="flex items-center gap-4">
          <input 
            type="text" 
            value={templateName} 
            onChange={e => setTemplateName(e.target.value)}
            className="bg-transparent text-xl font-bold border-b border-dashed border-white/30 focus:border-white focus:outline-none px-2 py-1"
          />
          <div className="flex bg-zinc-900 rounded-lg p-1">
             <button 
               onClick={() => setActiveTab('preview')}
               className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider ${activeTab === 'preview' ? 'bg-indigo-500 text-white' : 'text-zinc-500 hover:text-white'}`}
             >
                Visual Editor
             </button>
             <button 
               onClick={() => setActiveTab('settings')}
               className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider ${activeTab === 'settings' ? 'bg-indigo-500 text-white' : 'text-zinc-500 hover:text-white'}`}
             >
                Properties
             </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors">Cancel</button>
          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-black uppercase tracking-wider rounded-lg transition-colors">
            <Save className="w-4 h-4" /> Save Template
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar (Fields) */}
        <div className="w-64 bg-zinc-950 border-r border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Background</h3>
            <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-white/20 rounded-xl hover:border-indigo-500 hover:bg-indigo-500/10 cursor-pointer transition-all">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <ImageIcon className="w-5 h-5 text-zinc-400" />
              <span className="text-xs font-bold text-zinc-400">{backgroundUrl ? 'Change Image' : 'Upload Image'}</span>
            </label>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Available Fields</h3>
            <div className="space-y-2">
              {(Object.keys(DEFAULT_FIELDS) as Array<keyof TemplateFieldMap>).map(key => {
                 const field = fields[key];
                 return (
                   <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                     <span className="text-sm font-medium">{DEFAULT_FIELDS[key].label}</span>
                     <button onClick={() => toggleFieldVisibility(key)} className="p-1 text-zinc-500 hover:text-white">
                        {field?.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-zinc-700" />}
                     </button>
                   </div>
                 );
              })}
            </div>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 bg-zinc-900 overflow-auto flex items-center justify-center p-8 relative">
           {backgroundUrl ? (
             <div 
                ref={containerRef}
                className="relative bg-white shadow-2xl"
                style={{ width: '210mm', height: '297mm', maxHeight: '100%', aspectRatio: '210/297' }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
             >
                <img src={backgroundUrl} alt="Template Background" className="absolute inset-0 w-full h-full object-fill pointer-events-none opacity-50" />
                
                {/* Render Draggable Fields */}
                {(Object.keys(DEFAULT_FIELDS) as Array<keyof TemplateFieldMap>).map((key: keyof TemplateFieldMap) => {
                   const field = fields[key];
                   if (!field?.visible) return null;
                   
                   return (
                      <div
                        key={key}
                        className={`absolute flex items-center gap-2 p-1.5 rounded border border-indigo-500/50 bg-indigo-500/20 backdrop-blur-sm cursor-move shadow-sm text-[10px] font-bold text-indigo-900 select-none ${draggingField === key ? 'ring-2 ring-indigo-500 z-50' : 'z-10'}`}
                        style={{
                           left: `${field.x}%`,
                           top: `${field.y}%`,
                           transform: 'translate(-50%, -50%)',
                        }}
                        onPointerDown={(e) => handlePointerDown(e, key)}
                      >
                         <GripHorizontal className="w-3 h-3 text-indigo-700" />
                         [{DEFAULT_FIELDS[key].label}]
                      </div>
                   );
                })}
             </div>
           ) : (
             <div className="text-center text-zinc-500">
               <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
               <p className="text-sm font-bold uppercase tracking-widest">No Background Selected</p>
               <p className="text-xs mt-2 opacity-50">Upload an A4 proportioned image (PNG/JPG) to begin mapping.</p>
             </div>
           )}
        </div>

        {/* Right Sidebar (Properties) */}
        {activeTab === 'settings' && (
           <div className="w-72 bg-zinc-950 border-l border-white/10 flex flex-col p-4 animate-ios-slide-left">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Field Properties</h3>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">Select a field on the canvas to edit its specific properties like font size, color, and alignment (coming soon).</p>
              
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Document Type</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm mt-1 text-white">
                       <option value="invoice">Invoice</option>
                       <option value="quote">Quotation</option>
                    </select>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};
