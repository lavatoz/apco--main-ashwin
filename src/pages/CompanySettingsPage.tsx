import React, { useState } from 'react';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { type CompanyProfile } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import { quoteTemplates, invoiceTemplates, agreementTemplates, proposalTemplates } from '../templates/registry';
import { 
  Building, Palette, CreditCard, FileText, Upload, Trash2, 
  CheckCircle2, Plus, X, 
  Star, Settings as Gear, Shield, Copy, Check, Info,
  Eye, EyeOff, Edit3, Save, AlertTriangle, QrCode, Hash, FileImage
} from 'lucide-react';
import { saveCustomTemplate } from '../templates/registry';
import { TemplateEditor } from '../components/TemplateEditor';

const CompanySettingsPage: React.FC = () => {
  const { companies, saveCompanies, globalSettings, saveGlobalSettings } = useCompanySettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyProfile | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPdfPassword, setShowPdfPassword] = useState(false);
  const [isEditingPdfPassword, setIsEditingPdfPassword] = useState(false);
  const [tempPassword, setTempPassword] = useState(globalSettings.pdfOwnerPassword || '');
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    tone: 'default' | 'danger';
    onConfirm: () => void;
  } | null>(null);
  const [dismissedTip, setDismissedTip] = useState(() => localStorage.getItem('artisans_dismissed_pdf_tip') === 'true');
  const [selectedGlobalColor, setSelectedGlobalColor] = useState(() => localStorage.getItem('artisans_primary_color') || '#3B82F6');

  const presetColors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Amber', value: '#F59E0B' },
    { name: 'Teal', value: '#14B8A6' },
  ];

  const handleGlobalColorChange = (color: string) => {
    setSelectedGlobalColor(color);
    localStorage.setItem('artisans_primary_color', color);
    window.dispatchEvent(new CustomEvent('primary-color-changed'));
  };

  // Form State for Modal
  const [formData, setFormData] = useState<Partial<CompanyProfile>>({});

  const openModal = (company: CompanyProfile | null = null) => {
    if (company) {
      setEditingCompany(company);
      setFormData(company);
    } else {
      setEditingCompany(null);
      setFormData({
        id: `comp_${new Date().getTime()}`,
        companyName: '',
        tagline: '',
        projectType: '',
        logo: '',
        email: '',
        phone: '',
        address: '',
        gstin: '',
        pan: '',
        website: '',
        invoicePrefix: '',
        upiId: '',
        bankDetails: { accountName: '', accountNumber: '', ifsc: '', bankName: '' },
        paymentTerms: 'Due on Receipt',
        invoiceNotes: 'Thank you for your business.',
        primaryColor: '#10b981',
        isDefault: companies.length === 0,
        createdAt: new Date().toISOString()
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCompany(null);
    setFormData({});
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedCompanies: CompanyProfile[];

    if (editingCompany) {
      updatedCompanies = companies.map(c => c.id === editingCompany.id ? (formData as CompanyProfile) : c);
    } else {
      updatedCompanies = [...companies, formData as CompanyProfile];
    }

    // If this is set as default, unset others
    if (formData.isDefault) {
      updatedCompanies = updatedCompanies.map(c => ({
        ...c,
        isDefault: c.id === formData.id
      }));
    }

    saveCompanies(updatedCompanies);
    setSuccessMsg(editingCompany ? "Company updated ✓" : "New company added ✓");
    closeModal();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDeleteCompany = (id: string, name: string) => {
    if (companies.length <= 1) {
      alert("You must have at least one company profile.");
      return;
    }
    setPendingConfirm({
      title: 'Delete Company',
      message: `Delete "${name}"? Existing invoices using this project type will fallback to the default company.`,
      confirmLabel: 'Delete',
      tone: 'danger',
      onConfirm: () => {
        const filtered = companies.filter(c => c.id !== id);
        if (!filtered.some(c => c.isDefault) && filtered[0]) {
          filtered[0].isDefault = true;
        }
        saveCompanies(filtered);
        setSuccessMsg("Company removed ✓");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    });
  };

  const handleSetDefault = (id: string) => {
    const updated = companies.map(c => ({
      ...c,
      isDefault: c.id === id
    }));
    saveCompanies(updated);
    setSuccessMsg("Default company updated ✓");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const savePdfPassword = () => {
    saveGlobalSettings({ ...globalSettings, pdfOwnerPassword: tempPassword.trim() });
    setIsEditingPdfPassword(false);
    setSuccessMsg("Security protocol updated ✓");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size exceeds 2MB limit.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const projectTypes = Array.from(new Set(companies.map(c => c.projectType))).filter(Boolean);

  return (
    <>
    <ConfirmDialog
      isOpen={!!pendingConfirm}
      title={pendingConfirm?.title || ''}
      message={pendingConfirm?.message || ''}
      confirmLabel={pendingConfirm?.confirmLabel || 'Confirm'}
      tone={pendingConfirm?.tone || 'default'}
      onCancel={() => setPendingConfirm(null)}
      onConfirm={() => {
        const action = pendingConfirm?.onConfirm;
        setPendingConfirm(null);
        action?.();
      }}
    />
    <div className="max-w-7xl mx-auto pb-32 animate-ios-fade-in font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
           <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-3 transition-colors hover:text-blue-400">
              Settings
           </h1>
           <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em]">
              Central Multi-Brand Configuration & Ecology
           </p>
        </div>
        {successMsg && (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-6 py-4 rounded-[2rem] animate-ios-slide-up shadow-2xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">{successMsg}</span>
          </div>
        )}
      </div>

      {/* Companies Grid */}
      <section className="space-y-10">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
           <Building className="w-6 h-6 text-blue-500" />
           <h2 className="text-xl font-black text-white uppercase tracking-widest">Brand Portals</h2>
           <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-zinc-400 uppercase">{companies.length} Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {companies.map((company) => (
              <div 
                key={company.id}
                className={`glass-panel p-8 squircle-lg border transition-all duration-500 group relative flex flex-col h-full ${
                  company.isDefault 
                    ? 'border-emerald-500/30 bg-emerald-500/[0.02] ring-1 ring-emerald-500/10' 
                    : 'border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]'
                }`}
              >
                {company.isDefault && (
                  <div className="absolute -top-3 -right-3 px-4 py-2 bg-emerald-500 text-black rounded-full shadow-2xl flex items-center gap-2 transform group-hover:scale-110 transition-transform cursor-help" title="Primary platform entity">
                    <Star className="w-3 h-3 fill-black" />
                    <span className="text-xs font-bold uppercase tracking-widest">Default</span>
                  </div>
                )}

                <div className="flex items-start gap-6 mb-8">
                   <div className="relative shrink-0">
                      {company.logo ? (
                         <img src={company.logo} alt={company.companyName} className="w-20 h-20 rounded-2xl object-cover border border-white/10 shadow-xl" />
                      ) : (
                         <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-3xl font-black text-zinc-700">
                            {company.companyName.charAt(0)}
                         </div>
                      )}
                      {company.primaryColor && (
                        <div 
                          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg border-2 border-black shadow-lg" 
                          style={{ backgroundColor: company.primaryColor }} 
                        />
                      )}
                   </div>
                   <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter truncate leading-tight mb-1">{company.companyName}</h3>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest truncate">{company.tagline || 'No tagline set'}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                         <span className="px-2 py-1 bg-white/5 rounded-md text-[10px] font-bold text-zinc-400 uppercase tracking-widest border border-white/5">TYPE: {company.projectType}</span>
                         <span className="px-2 py-1 bg-white/5 rounded-md text-[10px] font-bold text-zinc-400 uppercase tracking-widest border border-white/5">PFX: {company.invoicePrefix}</span>
                      </div>
                   </div>
                </div>

                <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => openModal(company)}
                        className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all active:scale-90"
                        title="Edit Configuration"
                      >
                         <Gear className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCompany(company.id, company.companyName)}
                        className="p-3 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-xl transition-all active:scale-90"
                        title="Delete Portal"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                   {!company.isDefault && (
                      <button 
                        onClick={() => handleSetDefault(company.id)}
                        className="px-5 py-3 bg-white/5 hover:bg-emerald-500 hover:text-black text-xs font-bold text-zinc-400 uppercase tracking-widest rounded-xl transition-all active:scale-95"
                      >
                         Make Default
                      </button>
                   )}
                </div>
              </div>
           ))}

           {/* Add New Card */}
           <button 
             onClick={() => openModal()}
             className="glass-panel p-8 squircle-lg border-2 border-dashed border-white/5 hover:border-white/10 bg-transparent hover:bg-white/[0.01] transition-all flex flex-col items-center justify-center gap-6 group"
           >
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-black transition-all duration-500">
                 <Plus className="w-8 h-8" />
              </div>
              <div className="text-center">
                 <p className="text-lg font-black text-white uppercase tracking-tighter mb-1">Initialize New Brand</p>
                 <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Deploy a separate business vertical</p>
              </div>
           </button>
        </div>
      </section>

      {/* Global Preferences */}
      <section className="mt-20 space-y-10">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
           <Palette className="w-6 h-6 text-amber-500" />
           <h2 className="text-xl font-black text-white uppercase tracking-widest">Global Ecology</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="glass-panel p-10 squircle-lg border border-white/5 bg-white/[0.01] flex items-center justify-between">
              <div>
                 <p className="text-lg font-black text-white uppercase tracking-tighter mb-1">Platform Language</p>
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">Default localization for international portals</p>
              </div>
              <select className="bg-black border border-white/10 rounded-xl px-6 py-3 text-sm font-bold text-white outline-none">
                 <option>English (Universal)</option>
                 <option>Hindi (Localized)</option>
              </select>
           </div>
           
           <div className="glass-panel p-10 squircle-lg border border-white/5 bg-white/[0.01] flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div>
                 <p className="text-lg font-black text-white uppercase tracking-tighter mb-1">Primary Color Scheme</p>
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">System-wide UI accent protocol</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                 <div className="flex items-center gap-2 p-2 bg-black/40 rounded-2xl border border-white/5">
                    {presetColors.map(color => (
                       <button
                         key={color.value}
                         onClick={() => handleGlobalColorChange(color.value)}
                         className={`w-7 h-7 rounded-full transition-all hover:scale-110 active:scale-90 relative ${selectedGlobalColor === color.value ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}
                         style={{ backgroundColor: color.value }}
                         title={color.name}
                       />
                    ))}
                 </div>

                 <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                    <div className="relative group">
                       <input 
                         type="color" 
                         value={selectedGlobalColor}
                         onChange={(e) => handleGlobalColorChange(e.target.value)}
                         className="w-10 h-10 bg-transparent border-none cursor-pointer outline-none overflow-hidden rounded-lg"
                       />
                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-white text-black text-[10px] font-bold uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Custom Picker</div>
                    </div>
                    <div className="hidden sm:block">
                       <p className="text-xs font-bold text-white uppercase tracking-widest leading-none">Custom</p>
                       <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">{selectedGlobalColor}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* PDF Security Section - Premium Protection */}
        {!dismissedTip && (
           <div className="mb-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-[2rem] flex items-center justify-between gap-6 animate-ios-slide-up">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-blue-500/20 rounded-2xl">
                    <Shield className="w-5 h-5 text-blue-400" />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-white uppercase tracking-widest leading-none mb-2">Security Hub Protocol</p>
                    <p className="text-xs font-bold text-zinc-400">Set a personal password for your invoice PDFs. Default is 'Artisans@2026'.</p>
                 </div>
              </div>
              <button 
                onClick={() => {
                   localStorage.setItem('artisans_dismissed_pdf_tip', 'true');
                   setDismissedTip(true);
                }}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-xs font-bold text-white uppercase tracking-widest rounded-xl transition-all"
              >
                 Got it
              </button>
           </div>
        )}

        <div className="glass-panel p-10 squircle-lg border border-emerald-500/10 bg-emerald-500/[0.01] relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
              <Shield className="w-40 h-40 text-emerald-500" />
           </div>
           
           <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-12 relative z-10">
              <div className="max-w-xl">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                       <Shield className="w-5 h-5 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">PDF Tamper Protection</h3>
                 </div>
                 <p className="text-sm font-bold text-zinc-400 mb-6 leading-relaxed">
                    Invoices are encrypted with 128-bit AES. View/Print is permitted, but Editing/Extraction requires your owner password.
                 </p>
                 <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                       <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                       <div>
                          <p className="text-xs font-bold text-white uppercase tracking-widest mb-1">Ecology Rules</p>
                          <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.15em] leading-relaxed">
                             This password protects the integrity of your finances. Clients do NOT need this to view or pay.
                          </p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex-1 max-w-md w-full">
                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                       <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest block">PDF Owner Password</label>
                       {!isEditingPdfPassword && (
                          <button 
                            onClick={() => {
                               setTempPassword(globalSettings.pdfOwnerPassword || '');
                               setIsEditingPdfPassword(true);
                            }}
                            className="text-xs font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                          >
                             <Edit3 className="w-3 h-3" />
                             Change
                          </button>
                       )}
                    </div>
                    
                    <div className="relative group/field">
                       <input 
                         type={showPdfPassword || isEditingPdfPassword ? 'text' : 'password'} 
                         className={`w-full bg-black border rounded-2xl p-6 text-sm font-mono font-bold text-white outline-none transition-all pr-24 ${isEditingPdfPassword ? 'border-emerald-500' : 'border-white/10 focus:border-white/20'}`}
                         value={isEditingPdfPassword ? tempPassword : (globalSettings.pdfOwnerPassword || '')} 
                         onChange={e => setTempPassword(e.target.value)}
                         readOnly={!isEditingPdfPassword}
                         placeholder="No password set (Unprotected)"
                       />
                       <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          {!isEditingPdfPassword && (
                             <>
                                <button 
                                  onClick={() => setShowPdfPassword(!showPdfPassword)}
                                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                                >
                                   {showPdfPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button 
                                  onClick={() => {
                                     navigator.clipboard.writeText(globalSettings.pdfOwnerPassword || '');
                                     setCopied(true);
                                     setTimeout(() => setCopied(false), 2000);
                                  }}
                                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                                >
                                   {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                             </>
                          )}
                       </div>
                    </div>

                    {isEditingPdfPassword && (
                       <div className="animate-ios-slide-up space-y-4">
                          {/* Strength Meter */}
                          <div className="space-y-2">
                             <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-bold uppercase text-zinc-600 tracking-widest">Entropy Score</span>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                   tempPassword.length === 0 ? 'text-zinc-600' :
                                   tempPassword.length < 6 ? 'text-red-500' : 
                                   tempPassword.length < 10 ? 'text-amber-500' : 'text-emerald-500'
                                }`}>
                                   {tempPassword.length === 0 ? 'Void' : tempPassword.length < 6 ? 'Vulnerable' : tempPassword.length < 10 ? 'Standard' : 'Fortress'}
                                </span>
                             </div>
                             <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 ${
                                     tempPassword.length < 6 ? 'bg-red-500' : 
                                     tempPassword.length < 10 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(100, (tempPassword.length / 12) * 100)}%` }}
                                />
                             </div>
                          </div>

                          {/* Validation Warnings */}
                          <div className="space-y-2">
                             {tempPassword && tempPassword.length < 6 && (
                                <div className="flex gap-2 text-red-400 text-xs font-bold uppercase tracking-widest bg-red-400/5 p-3 rounded-xl border border-red-400/10">
                                   <AlertTriangle className="w-3 h-3 shrink-0" />
                                   <span>Password is too short for peak security.</span>
                                </div>
                             )}
                             {tempPassword && ['password', 'admin', '1234', 'test'].some(w => tempPassword.toLowerCase().includes(w)) && (
                                <div className="flex gap-2 text-amber-500 text-xs font-bold uppercase tracking-widest bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                                   <AlertTriangle className="w-3 h-3 shrink-0" />
                                   <span>Common pattern detected. Use a unique sequence.</span>
                                </div>
                             )}
                             {!tempPassword && (
                                <div className="flex gap-2 text-amber-600 text-xs font-bold uppercase tracking-widest bg-amber-600/5 p-3 rounded-xl border border-amber-600/10">
                                   <Shield className="w-3 h-3 shrink-0 opacity-50" />
                                   <span>Clear field to disable PDF encryption entirely.</span>
                                </div>
                             )}
                          </div>

                          <div className="flex gap-3 pt-2">
                             <button 
                               onClick={() => {
                                  if (!tempPassword.trim()) {
                                      setPendingConfirm({
                                        title: 'Disable PDF Security',
                                        message: 'Invoices will no longer be encrypted if PDF security is disabled.',
                                        confirmLabel: 'Disable',
                                        tone: 'danger',
                                        onConfirm: savePdfPassword
                                      });
                                      return;
                                  }
                                  saveGlobalSettings({...globalSettings, pdfOwnerPassword: tempPassword.trim()});
                                  setIsEditingPdfPassword(false);
                                  setSuccessMsg("Security protocol updated ✓");
                                  setTimeout(() => setSuccessMsg(null), 3000);
                               }}
                               className="flex-1 py-4 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2"
                             >
                                <Save className="w-3 h-3" />
                                Save Protocol
                             </button>
                             <button 
                               onClick={() => setIsEditingPdfPassword(false)}
                               className="px-6 py-4 bg-white/5 text-zinc-500 text-xs font-bold uppercase tracking-widest rounded-2xl"
                             >
                                Cancel
                             </button>
                          </div>
                       </div>
                    )}

                    {!isEditingPdfPassword && (
                       <div className="animate-ios-fade-in space-y-6 pt-4 border-t border-white/5">
                          <div className="flex items-center justify-between px-1">
                             <p className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Defensive Layers</p>
                             <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest">Active Protection</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                             {/* Watermark Toggle */}
                             <button 
                               onClick={() => saveGlobalSettings({...globalSettings, pdfWatermarkEnabled: !globalSettings.pdfWatermarkEnabled})}
                               className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 text-left ${globalSettings.pdfWatermarkEnabled ? 'bg-white/5 border-white/20' : 'bg-transparent border-white/5 opacity-50'}`}
                             >
                                <Palette className={`w-4 h-4 ${globalSettings.pdfWatermarkEnabled ? 'text-amber-500' : 'text-zinc-600'}`} />
                                <div>
                                   <p className="text-xs font-bold text-white uppercase tracking-widest">Watermark</p>
                                   <p className="text-[10px] font-bold text-zinc-500 uppercase">Diagonal Brand Trace</p>
                                </div>
                             </button>

                             {/* QR Toggle */}
                             <button 
                               onClick={() => saveGlobalSettings({...globalSettings, pdfQrEnabled: !globalSettings.pdfQrEnabled})}
                               className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 text-left ${globalSettings.pdfQrEnabled ? 'bg-white/5 border-white/20' : 'bg-transparent border-white/5 opacity-50'}`}
                             >
                                <QrCode className={`w-4 h-4 ${globalSettings.pdfQrEnabled ? 'text-blue-500' : 'text-zinc-600'}`} />
                                <div>
                                   <p className="text-xs font-bold text-white uppercase tracking-widest">QR Verify</p>
                                   <p className="text-[10px] font-bold text-zinc-500 uppercase">Live Authenticity Link</p>
                                </div>
                             </button>

                             {/* Hash Toggle */}
                             <button 
                               onClick={() => saveGlobalSettings({...globalSettings, pdfHashEnabled: !globalSettings.pdfHashEnabled})}
                               className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 text-left ${globalSettings.pdfHashEnabled ? 'bg-white/5 border-white/20' : 'bg-transparent border-white/5 opacity-50'}`}
                             >
                                <Hash className={`w-4 h-4 ${globalSettings.pdfHashEnabled ? 'text-emerald-500' : 'text-zinc-600'}`} />
                                <div>
                                   <p className="text-xs font-bold text-white uppercase tracking-widest">Data Hash</p>
                                   <p className="text-[10px] font-bold text-zinc-500 uppercase">Unique Data Fingerprint</p>
                                </div>
                             </button>

                             {/* Secure Render Toggle */}
                             <button 
                               onClick={() => saveGlobalSettings({...globalSettings, pdfSecureRenderEnabled: !globalSettings.pdfSecureRenderEnabled})}
                               className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 text-left ${globalSettings.pdfSecureRenderEnabled ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-transparent border-white/5 opacity-50'}`}
                             >
                                <FileImage className={`w-4 h-4 ${globalSettings.pdfSecureRenderEnabled ? 'text-emerald-500' : 'text-zinc-600'}`} />
                                <div>
                                   <p className="text-xs font-bold text-white uppercase tracking-widest">Secure Render</p>
                                   <p className="text-[10px] font-bold text-zinc-500 uppercase">Image-based PDF (Fortress)</p>
                                </div>
                             </button>
                          </div>
                          
                          <div className="flex items-start gap-2 px-2 opacity-60">
                             <Info className="w-3 h-3 text-zinc-500 mt-0.5" />
                             <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                                Note: Enabling 'Secure Render' creates larger files (~300-500KB) and renders text unselectable to prevent extraction.
                             </p>
                          </div>
                          
                          <div className="flex items-center gap-2 px-2">
                             <Shield className="w-3 h-3 text-emerald-500" />
                             <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                {globalSettings.pdfOwnerPassword ? '128-bit AES Encryption Active' : 'Encryption Bypass Active (Insecure)'}
                             </span>
                          </div>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-12">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl animate-ios-fade-in" onClick={closeModal} />
           <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto glass-panel border border-white/10 rounded-[3rem] shadow-4xl animate-ios-slide-up no-scrollbar">
              
              <div className="sticky top-0 z-10 p-8 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                       <Building className="w-6 h-6" />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                          {editingCompany ? 'Recalibrate Brand' : 'Deploy Brand Instance'}
                       </h2>
                       <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Portal ID: {formData.id}</p>
                    </div>
                 </div>
                 <button onClick={closeModal} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              <form onSubmit={handleSaveCompany} className="p-10 space-y-12 pb-20">
                 
                 {/* Branding Section */}
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-4 space-y-6">
                       <div className="relative group mx-auto">
                          <div className="logo-checkerboard relative w-full aspect-square max-w-[240px] rounded-[2.5rem] overflow-hidden border-2 border-white/10 bg-zinc-900 group-hover:border-white/20 transition-all shadow-2xl flex items-center justify-center">
                             {formData.logo ? (
                                <img src={formData.logo} alt="Preview" className="w-full h-full object-cover" />
                             ) : (
                                <div className="text-center space-y-4 opacity-50">
                                   <Upload className="w-10 h-10 mx-auto text-zinc-500" />
                                   <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">No Asset Staged</p>
                                </div>
                             )}
                             <input type="file" id="logo-up" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                             <label htmlFor="logo-up" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 cursor-pointer">
                                <Plus className="w-10 h-10 text-white" />
                                <span className="text-xs font-bold uppercase tracking-widest text-white">Select New Icon</span>
                             </label>
                          </div>
                       </div>
                       <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                             Asset Constraints: <br/>
                             <span className="text-white mt-1 block">PNG / SVG / JPG (Max 2MB)</span>
                             <span className="text-zinc-600 block mt-1">Recommended: 1:1 Aspect Ratio</span>
                          </p>
                       </div>
                    </div>

                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-[0.2em] px-1">Brand Designation *</label>
                          <input 
                            required 
                            type="text" 
                            className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-blue-500 shadow-inner outline-none transition-all" 
                            value={formData.companyName} 
                            onChange={e => setFormData(p => ({...p, companyName: e.target.value}))}
                            placeholder="e.g. Aaha Kalyanam"
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-[0.2em] px-1">Communication Tagline</label>
                          <input 
                            type="text" 
                            className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-blue-500 outline-none transition-all" 
                            value={formData.tagline} 
                            onChange={e => setFormData(p => ({...p, tagline: e.target.value}))}
                            placeholder="e.g. Weddings That Tell Your Story"
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-[0.2em] px-1">Vector Link (Project Type) *</label>
                          <div className="relative group">
                             <input 
                               required 
                               type="text" 
                               list="projectTypes"
                               className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-blue-500 outline-none transition-all uppercase" 
                               value={formData.projectType} 
                               onChange={e => setFormData(p => ({...p, projectType: e.target.value.toUpperCase()}))}
                               placeholder="e.g. WEDDING"
                             />
                             <datalist id="projectTypes">
                                {projectTypes.map(t => <option key={t} value={t} />)}
                             </datalist>
                             <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-2">Links clients with this brand automatically</p>
                          </div>
                       </div>
                       <div className="space-y-3">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-[0.2em] px-1">Invoice Prefix *</label>
                          <input 
                            required 
                            type="text" 
                            className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-blue-500 outline-none transition-all uppercase" 
                            value={formData.invoicePrefix} 
                            onChange={e => setFormData(p => ({...p, invoicePrefix: e.target.value.toUpperCase()}))}
                            placeholder="e.g. AK"
                          />
                          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-2">{formData.invoicePrefix || 'XX'}-0001-2026</p>
                       </div>
                    </div>
                 </div>

                 {/* Business Details Section */}
                 <div className="space-y-8">
                    <div className="flex items-center gap-4 border-l-2 border-blue-500 pl-4 py-1">
                       <Shield className="w-5 h-5 text-blue-500" />
                       <h3 className="text-sm font-black uppercase tracking-widest text-white">Business Intelligence Registry</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                       <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Professional Email</label>
                          <input type="email" className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Support Phone</label>
                          <input type="text" className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.phone} onChange={e => setFormData(p => ({...p, phone: e.target.value}))} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Website Vector</label>
                          <input type="text" className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.website} onChange={e => setFormData(p => ({...p, website: e.target.value}))} placeholder="www.domain.com" />
                       </div>
                       <div className="md:col-span-3 space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Base Operational Address</label>
                          <textarea rows={3} className="w-full bg-black border border-white/10 rounded-[2rem] p-6 text-sm font-bold text-white focus:border-white/20 outline-none resize-none" value={formData.address} onChange={e => setFormData(p => ({...p, address: e.target.value}))} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Taxation Index (GSTIN)</label>
                          <input type="text" className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none uppercase" value={formData.gstin} onChange={e => setFormData(p => ({...p, gstin: e.target.value.toUpperCase()}))} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Permanent Account (PAN)</label>
                          <input type="text" className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none uppercase" value={formData.pan} onChange={e => setFormData(p => ({...p, pan: e.target.value.toUpperCase()}))} />
                       </div>
                       <div className="space-y-2 flex flex-col justify-end">
                          <div className="bg-black/60 border border-white/5 rounded-2xl p-3 flex items-center justify-between">
                             <div>
                                <label className="text-xs font-bold uppercase text-white tracking-widest block">Palette Index</label>
                             </div>
                             <input type="color" className="w-10 h-10 bg-transparent border-none cursor-pointer outline-none" value={formData.primaryColor} onChange={e => setFormData(p => ({...p, primaryColor: e.target.value}))} />
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Settlement Registry Section */}
                 <div className="space-y-8">
                    <div className="flex items-center gap-4 border-l-2 border-emerald-500 pl-4 py-1">
                       <CreditCard className="w-5 h-5 text-emerald-500" />
                       <h3 className="text-sm font-black uppercase tracking-widest text-white">Settlement Registry</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                       <div className="lg:col-span-2 space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">UPI ID (VPA)</label>
                          <input type="text" className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.upiId} onChange={e => setFormData(p => ({...p, upiId: e.target.value}))} placeholder="business@vpa" />
                       </div>
                       <div className="lg:col-span-2 space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Bank Name</label>
                          <input type="text" className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.bankDetails?.bankName} onChange={e => setFormData(p => ({...p, bankDetails: {...(p.bankDetails as any), bankName: e.target.value}}))} />
                       </div>
                       <div className="lg:col-span-2 space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Account Holder Designation</label>
                          <input type="text" className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.bankDetails?.accountName} onChange={e => setFormData(p => ({...p, bankDetails: {...(p.bankDetails as any), accountName: e.target.value}}))} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Account Number</label>
                          <input type="text" className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.bankDetails?.accountNumber} onChange={e => setFormData(p => ({...p, bankDetails: {...(p.bankDetails as any), accountNumber: e.target.value}}))} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Routing Index (IFSC)</label>
                          <input type="text" className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none uppercase" value={formData.bankDetails?.ifsc} onChange={e => setFormData(p => ({...p, bankDetails: {...(p.bankDetails as any), ifsc: e.target.value.toUpperCase()}}))} />
                       </div>
                    </div>
                 </div>

                 {/* Document Protocols Section */}
                 <div className="space-y-8">
                    <div className="flex items-center justify-between border-l-2 border-amber-500 pl-4 py-1">
                       <div className="flex items-center gap-4">
                          <FileText className="w-5 h-5 text-amber-500" />
                          <h3 className="text-sm font-black uppercase tracking-widest text-white">Document Protocols & Templates</h3>
                       </div>
                       <button
                         type="button"
                         onClick={() => setShowTemplateEditor(true)}
                         className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded text-[10px] font-bold uppercase tracking-widest transition-colors"
                       >
                         <Plus className="w-3 h-3" /> Custom PDF Template
                       </button>
                    </div>
                    
                    {showTemplateEditor && (
                       <TemplateEditor 
                          onSave={(metadata) => {
                             saveCustomTemplate(metadata);
                             setShowTemplateEditor(false);
                          }}
                          onCancel={() => setShowTemplateEditor(false)}
                       />
                    )}
                    
                    {/* Template Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-white/5">
                       <div className="space-y-3">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Quote Template</label>
                          <select 
                            className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none cursor-pointer appearance-none"
                            value={formData.defaultQuoteTemplate || 'default_v1'}
                            onChange={e => setFormData(p => ({...p, defaultQuoteTemplate: e.target.value}))}
                          >
                             {Object.keys(quoteTemplates).length === 0 ? <option value="default_v1">Default Layout</option> : null}
                             {Object.values(quoteTemplates).map(t => (
                                <option key={t.metadata.id} value={t.metadata.id}>{t.metadata.name} (v{t.metadata.version})</option>
                             ))}
                          </select>
                       </div>
                       <div className="space-y-3">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Invoice Template</label>
                          <select 
                            className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none cursor-pointer appearance-none"
                            value={formData.defaultInvoiceTemplate || 'default_v1'}
                            onChange={e => setFormData(p => ({...p, defaultInvoiceTemplate: e.target.value}))}
                          >
                             {Object.keys(invoiceTemplates).length === 0 ? <option value="default_v1">Default Layout</option> : null}
                             {Object.values(invoiceTemplates).map(t => (
                                <option key={t.metadata.id} value={t.metadata.id}>{t.metadata.name} (v{t.metadata.version})</option>
                             ))}
                          </select>
                       </div>
                       <div className="space-y-3">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Agreement Terms</label>
                          <select 
                            className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none cursor-pointer appearance-none"
                            value={formData.defaultAgreementTemplate || 'default_v1'}
                            onChange={e => setFormData(p => ({...p, defaultAgreementTemplate: e.target.value}))}
                          >
                             {Object.values(agreementTemplates).map(t => (
                                <option key={t.metadata.id} value={t.metadata.id}>{t.metadata.name} (v{t.metadata.version})</option>
                             ))}
                          </select>
                       </div>
                       <div className="space-y-3">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Proposal Template</label>
                          <select 
                            className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none cursor-pointer appearance-none"
                            value={formData.defaultProposalTemplate || 'default_v1'}
                            onChange={e => setFormData(p => ({...p, defaultProposalTemplate: e.target.value}))}
                          >
                             {Object.keys(proposalTemplates).length === 0 ? <option value="default_v1">Default Layout</option> : null}
                             {Object.values(proposalTemplates).map(t => (
                                <option key={t.metadata.id} value={t.metadata.id}>{t.metadata.name} (v{t.metadata.version})</option>
                             ))}
                          </select>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Baseline Payment Terms</label>
                          <select 
                            className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none cursor-pointer appearance-none"
                            value={formData.paymentTerms}
                            onChange={e => setFormData(p => ({...p, paymentTerms: e.target.value}))}
                          >
                             <option value="Due on Receipt">Due on Receipt (Standard)</option>
                             <option value="Net 7">Net 7 Logic</option>
                             <option value="Net 15">Net 15 Logic</option>
                             <option value="Net 30">Net 30 Logic</option>
                             <option value="50% Advance, 50% on Delivery">50/50 Multi-Stage Evolution</option>
                             <option value="Custom...">Defined Strategy...</option>
                          </select>
                       </div>
                       <div className="space-y-3">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Base Document Notes</label>
                          <input type="text" className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.invoiceNotes} onChange={e => setFormData(p => ({...p, invoiceNotes: e.target.value}))} />
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center justify-between pt-10 border-t border-white/5">
                    <label className="flex items-center gap-4 cursor-pointer group">
                       <div className="relative">
                          <input 
                            type="checkbox" 
                            className="peer hidden" 
                            checked={formData.isDefault} 
                            onChange={e => setFormData(p => ({...p, isDefault: e.target.checked}))}
                            disabled={editingCompany?.isDefault}
                          />
                          <div className="w-12 h-6 bg-zinc-800 rounded-full border border-white/10 peer-checked:bg-emerald-500 transition-all p-1">
                             <div className={`w-4 h-4 bg-white rounded-full transition-all transform ${formData.isDefault ? 'translate-x-6' : 'translate-x-0'}`} />
                          </div>
                       </div>
                       <div>
                          <p className="text-xs font-bold text-white uppercase tracking-widest">Set as Primary Brand</p>
                          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Only one brand can be primary across the ecosystem</p>
                       </div>
                    </label>

                    <div className="flex items-center gap-4">
                       <button 
                         type="button" 
                         onClick={closeModal}
                         className="px-8 py-5 bg-white/5 text-zinc-400 hover:text-white rounded-3xl text-xs font-bold uppercase tracking-widest transition-all"
                       >
                          Abort
                       </button>
                       <button 
                         type="submit"
                         className="px-12 py-5 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded-3xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                       >
                          Deploy Settings
                       </button>
                    </div>
                 </div>

              </form>
           </div>
        </div>
      )}

      <style>{`
        .logo-checkerboard {
          background-image: linear-gradient(45deg, #18181b 25%, transparent 25%),
                          linear-gradient(-45deg, #18181b 25%, transparent 25%),
                          linear-gradient(45deg, transparent 75%, #18181b 75%),
                          linear-gradient(-45deg, transparent 75%, #18181b 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
    </>
  );
};

export default CompanySettingsPage;
