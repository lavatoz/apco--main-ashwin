import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { type CompanyProfile } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import { quoteTemplates, invoiceTemplates, agreementTemplates, proposalTemplates } from '../templates/registry';
import { 
  Building, Palette, CreditCard, FileText, Upload, Trash2, 
  CheckCircle2, Plus, X, 
  Star, Settings as Gear, Shield, Check, Info,
  Languages, Eye
} from 'lucide-react';
import { saveCustomTemplate } from '../templates/registry';
import { TemplateEditor } from '../components/TemplateEditor';
import { ThemeStudio } from '../components/settings/ThemeStudio';
import { AgreementTemplateManager } from '../components/settings/AgreementTemplateManager';
import { THEME_PRESETS, GRAPHICS_PRESETS, TYPOGRAPHY_PRESETS } from '../utils/themeEngine';

const CompanySettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'agreements' ? 'agreements' : 'brands';

  const { companies, saveCompanies } = useCompanySettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyProfile | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    tone: 'default' | 'danger';
    onConfirm: () => void;
  } | null>(null);

  // Ensure ThemeStudio is imported
  // import { ThemeStudio } from '../components/settings/ThemeStudio';

  // Form State for Modal
  const [activeModalTab, setActiveModalTab] = useState<'identity' | 'theme' | 'portals' | 'notifications' | 'security'>('identity');
  const [formData, setFormData] = useState<Partial<CompanyProfile>>({});
  const [themeStudioBrandId, setThemeStudioBrandId] = useState<string>('');

  React.useEffect(() => {
    if (companies.length > 0 && !themeStudioBrandId) {
      setThemeStudioBrandId(companies.find(c => c.isDefault)?.id || companies[0].id);
    }
  }, [companies, themeStudioBrandId]);

  const openModal = (company: CompanyProfile | null = null, tab: 'identity' | 'theme' | 'portals' | 'notifications' | 'security' = 'identity') => {
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
        primaryColor: '#3B82F6',
        themePreset: 'artisans-noir',
        graphicsPreset: 'luxury-grain',
        typographyPreset: 'luxury',
        portalConfig: { clientPortal: true, staffPortal: true, publicBooking: true, productionWorkflow: true, revenueModule: true, marketingHub: true },
        isDefault: companies.length === 0,
        createdAt: new Date().toISOString()
      });
    }
    setActiveModalTab(tab);
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
    setSuccessMsg(editingCompany ? "Company updated âœ“" : "New company added âœ“");
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
        setSuccessMsg("Company removed âœ“");
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
    setSuccessMsg("Default company updated âœ“");
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
           <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-3 transition-colors hover:text-blue-400">
              Settings
           </h1>
           <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em]">
              Central Multi-Brand Configuration & Ecology
           </p>
        </div>
        {successMsg && (
          <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 px-6 py-4 rounded-[2rem] animate-ios-slide-up shadow-2xl">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-widest">{successMsg}</span>
          </div>
        )}
      </div>

      {/* Main Settings Navigation Tabs */}
      <div className="flex items-center gap-4 border-b border-white/5 pb-4 mb-10 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSearchParams({ tab: 'brands' })}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === 'brands'
              ? 'bg-white text-black shadow-xl scale-[1.02]'
              : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Brand Portals & Ecosystem</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'agreements' })}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === 'agreements'
              ? 'bg-white text-black shadow-xl scale-[1.02]'
              : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Agreement Templates</span>
        </button>
      </div>

      {activeTab === 'agreements' ? (
        <AgreementTemplateManager />
      ) : (
        <>
      {/* Companies Grid */}
      <section className="space-y-10">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
           <Building className="w-6 h-6 text-primary" />
           <h2 className="text-xl font-black text-white uppercase tracking-widest">Brand Portals</h2>
           <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-zinc-400 uppercase">{companies.length} Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {companies.map((company) => (
              <div 
                key={company.id}
                className={`glass-panel p-8 squircle-lg border transition-all duration-500 group relative flex flex-col h-full ${
                  company.isDefault 
                    ? 'border-primary/30 bg-primary/[0.02] ring-1 ring-primary/10' 
                    : 'border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]'
                }`}
              >
                {company.isDefault && (
                  <div className="absolute -top-3 -right-3 px-4 py-2 bg-primary text-black rounded-full shadow-2xl flex items-center gap-2 transform group-hover:scale-110 transition-transform cursor-help" title="Primary platform entity">
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
                        className="px-5 py-3 bg-white/5 hover:bg-primary hover:text-black text-xs font-bold text-zinc-400 uppercase tracking-widest rounded-xl transition-all active:scale-95"
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
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-black transition-all duration-500">
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
           <h2 className="text-xl font-black text-white uppercase tracking-widest">Global Settings</h2>
        </div>

          {/* Theme Management & General */}
          <div className="space-y-8">
             <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                   <Palette className="w-5 h-5 text-pink-500" />
                   <div>
                      <h3 className="text-lg font-bold text-white">Theme & Aesthetics</h3>
                      <p className="text-xs text-zinc-500">Configure visual themes, graphics presets, fonts, and brand colors.</p>
                   </div>
                </div>
                <select
                  value={themeStudioBrandId}
                  onChange={(e) => setThemeStudioBrandId(e.target.value)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold text-white outline-none uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id} className="bg-black text-white">{c.companyName}</option>
                  ))}
                </select>
             </div>

             {/* Theme Settings Panel */}
             {(() => {
                const selectedThemeComp = companies.find(c => c.id === themeStudioBrandId) || companies[0];
                if (!selectedThemeComp) return (
                   <div className="glass-panel p-8 text-center opacity-50 rounded-2xl border border-white/5">
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">No Brands Available</p>
                   </div>
                );

                return (
                  <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-white/10 transition-all space-y-6">
                    
                    {/* Theme Preset selector as compact selectable cards */}
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Theme Preset</h4>
                        <p className="text-[10px] text-zinc-500">Sets the base color mode and presets across brand portals</p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {THEME_PRESETS.map((preset) => {
                           const isSelected = selectedThemeComp.themePreset === preset.id;
                           return (
                             <button
                               type="button"
                               key={preset.id}
                               onClick={() => {
                                  const updated = companies.map(c => c.id === selectedThemeComp.id ? { ...c, themePreset: preset.id } : c);
                                  saveCompanies(updated);
                               }}
                               className={`p-3 rounded-xl border text-center transition-all ${
                                 isSelected 
                                   ? 'bg-pink-500/10 border-pink-500 text-pink-400 font-bold shadow-inner' 
                                   : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/15 hover:text-white'
                               }`}
                             >
                               <p className="text-[10px] uppercase font-bold tracking-wider truncate">{preset.name.replace(' (Default)', '')}</p>
                             </button>
                           );
                        })}
                      </div>
                    </div>

                    {/* Graphics Preset selector as compact selectable cards */}
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Graphics Engine</h4>
                        <p className="text-[10px] text-zinc-500">Controls layout visuals, shadow styles, blur intensities, and card glowing</p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {GRAPHICS_PRESETS.map((preset) => {
                           const isSelected = selectedThemeComp.graphicsPreset === preset.id;
                           return (
                             <button
                               type="button"
                               key={preset.id}
                               onClick={() => {
                                  const updated = companies.map(c => c.id === selectedThemeComp.id ? { ...c, graphicsPreset: preset.id } : c);
                                  saveCompanies(updated);
                               }}
                               className={`p-2.5 rounded-xl border text-center transition-all ${
                                 isSelected 
                                   ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold' 
                                   : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/15 hover:text-white'
                               }`}
                             >
                               <p className="text-[10px] uppercase font-bold tracking-wider truncate">{preset.name}</p>
                             </button>
                           );
                        })}
                      </div>
                    </div>

                    {/* Typography Preset selector as compact selectable cards */}
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Typography Settings</h4>
                        <p className="text-[10px] text-zinc-500">Selects primary typeface and editorial font combinations</p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {TYPOGRAPHY_PRESETS.map((preset) => {
                           const isSelected = selectedThemeComp.typographyPreset === preset.id;
                           return (
                             <button
                               type="button"
                               key={preset.id}
                               onClick={() => {
                                  const updated = companies.map(c => c.id === selectedThemeComp.id ? { ...c, typographyPreset: preset.id } : c);
                                  saveCompanies(updated);
                               }}
                               className={`p-3 rounded-xl border text-center transition-all ${
                                 isSelected 
                                   ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold' 
                                   : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/15 hover:text-white'
                               }`}
                             >
                               <p className="text-[10px] uppercase font-bold tracking-wider truncate">{preset.name}</p>
                             </button>
                           );
                        })}
                      </div>
                    </div>

                    {/* Accent Color Editor placed directly beneath Theme controls */}
                    <div className="space-y-3 pt-2">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Accent Color</h4>
                        <p className="text-[10px] text-zinc-500">Primary highlight color used across action items and branding variables</p>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                         <div className="flex items-center gap-4">
                            <div className="relative w-10 h-10 rounded-full border border-white/10 shadow-inner overflow-hidden flex items-center justify-center cursor-pointer">
                               <input 
                                  type="color" 
                                  className="absolute w-14 h-14 bg-transparent border-none cursor-pointer outline-none" 
                                  value={selectedThemeComp.primaryColor || '#3B82F6'} 
                                  onChange={e => {
                                     const updated = companies.map(c => c.id === selectedThemeComp.id ? { ...c, primaryColor: e.target.value } : c);
                                     saveCompanies(updated);
                                  }}
                               />
                            </div>
                            <div>
                               <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">Color Value</p>
                               <p className="text-xs font-mono font-bold text-white uppercase">{selectedThemeComp.primaryColor || '#3B82F6'}</p>
                            </div>
                         </div>
                         
                         <button
                           onClick={() => openModal(selectedThemeComp, 'theme')}
                           className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                           title="Edit Theme"
                         >
                           Advanced Theme Settings
                         </button>
                      </div>
                    </div>

                    {/* Bottom Action buttons */}
                    <div className="flex gap-4 pt-2 border-t border-white/5">
                       <button
                         onClick={() => openModal(selectedThemeComp, 'theme')}
                         className="flex-1 py-3 bg-white text-black hover:bg-zinc-200 text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-xl"
                       >
                         <Eye className="w-3.5 h-3.5" /> Preview & Apply Studio
                       </button>
                    </div>

                  </div>
                );
             })()}

             {/* Platform Language Card */}
             <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-white/10 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-white/5 rounded-xl text-zinc-400">
                      <Languages className="w-5 h-5 text-amber-500" />
                   </div>
                   <div>
                      <h4 className="text-sm font-bold text-white">Platform Language</h4>
                      <p className="text-[10px] text-zinc-500">Default localization for international portals</p>
                   </div>
                </div>
                <select className="glass-panel rounded-xl px-4 py-2 text-xs font-bold text-white outline-none border border-white/5 bg-black/60 cursor-pointer">
                   <option>English (Universal)</option>
                   <option>Hindi (Localized)</option>
                </select>
              </div>
           </div>
       </section>
       </>
      )}
      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 md:p-12 pt-safe md:pt-12">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md md:backdrop-blur-3xl animate-ios-fade-in" onClick={closeModal} />
           <div className="relative w-full h-full md:max-h-[90vh] md:w-full md:max-w-5xl overflow-y-auto glass-panel border border-white/10 rounded-none md:rounded-[3rem] shadow-4xl animate-ios-slide-up no-scrollbar flex flex-col bg-zinc-950/50 md:bg-transparent">
              
              <div className="sticky top-0 z-10 p-6 md:p-8 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl hidden md:block">
                       <Building className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">
                           {editingCompany ? 'Recalibrate Brand' : 'Deploy Brand Instance'}
                        </h2>
                        <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest truncate max-w-[200px] md:max-w-none">Portal ID: {formData.id}</p>
                    </div>
                 </div>
                 <button type="button" onClick={closeModal} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              {/* Tab Bar */}
              <div className="sticky top-[89px] md:top-[113px] z-10 px-6 md:px-8 flex overflow-x-auto no-scrollbar gap-8 border-b border-white/5 bg-zinc-950/95 backdrop-blur-xl pt-4">
                 <button type="button" onClick={() => setActiveModalTab('identity')} className={`pb-4 text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeModalTab === 'identity' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Brand Identity</button>
                 <button type="button" onClick={() => setActiveModalTab('theme')} className={`pb-4 text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeModalTab === 'theme' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Theme Studio</button>
                 <button type="button" onClick={() => setActiveModalTab('portals')} className={`pb-4 text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeModalTab === 'portals' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Portal Config</button>
                 <button type="button" onClick={() => setActiveModalTab('notifications')} className={`pb-4 text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeModalTab === 'notifications' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Notifications</button>
                 <button type="button" onClick={() => setActiveModalTab('security')} className={`pb-4 text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeModalTab === 'security' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Security</button>
              </div>

               <form onSubmit={handleSaveCompany} className="p-6 md:p-10 space-y-10 md:space-y-12 pb-safe md:pb-20 flex-1">
                 
                 {activeModalTab === 'identity' && (
                    <div className="space-y-12 animate-ios-fade-in">
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
                            className="w-full glass-panel rounded-2xl p-5 text-sm font-bold text-white focus:border-primary shadow-inner outline-none transition-all" 
                            value={formData.companyName} 
                            onChange={e => setFormData(p => ({...p, companyName: e.target.value}))}
                            placeholder="e.g. Aaha Kalyanam"
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-[0.2em] px-1">Communication Tagline</label>
                          <input 
                            type="text" 
                            className="w-full glass-panel rounded-2xl p-5 text-sm font-bold text-white focus:border-primary outline-none transition-all" 
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
                               className="w-full glass-panel rounded-2xl p-5 text-sm font-bold text-white focus:border-primary outline-none transition-all uppercase" 
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
                            className="w-full glass-panel rounded-2xl p-5 text-sm font-bold text-white focus:border-primary outline-none transition-all uppercase" 
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
                    <div className="flex items-center gap-4 border-l-2 border-primary pl-4 py-1">
                       <Shield className="w-5 h-5 text-primary" />
                       <h3 className="text-sm font-black uppercase tracking-widest text-white">Business Intelligence Registry</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                       <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Professional Email</label>
                          <input type="email" className="w-full glass-panel rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Support Phone</label>
                          <input type="text" className="w-full glass-panel rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.phone} onChange={e => setFormData(p => ({...p, phone: e.target.value}))} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Website Vector</label>
                          <input type="text" className="w-full glass-panel rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.website} onChange={e => setFormData(p => ({...p, website: e.target.value}))} placeholder="www.domain.com" />
                       </div>
                       <div className="md:col-span-3 space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Base Operational Address</label>
                          <textarea rows={3} className="w-full glass-panel rounded-[2rem] p-6 text-sm font-bold text-white focus:border-white/20 outline-none resize-none" value={formData.address} onChange={e => setFormData(p => ({...p, address: e.target.value}))} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Taxation Index (GSTIN)</label>
                          <input type="text" className="w-full glass-panel rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none uppercase" value={formData.gstin} onChange={e => setFormData(p => ({...p, gstin: e.target.value.toUpperCase()}))} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Permanent Account (PAN)</label>
                          <input type="text" className="w-full glass-panel rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none uppercase" value={formData.pan} onChange={e => setFormData(p => ({...p, pan: e.target.value.toUpperCase()}))} />
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
                    <div className="flex items-center gap-4 border-l-2 border-primary pl-4 py-1">
                       <CreditCard className="w-5 h-5 text-primary" />
                       <h3 className="text-sm font-black uppercase tracking-widest text-white">Settlement Registry</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                       <div className="lg:col-span-2 space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">UPI ID (VPA)</label>
                          <input type="text" className="w-full glass-panel rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.upiId} onChange={e => setFormData(p => ({...p, upiId: e.target.value}))} placeholder="business@vpa" />
                       </div>
                       <div className="lg:col-span-2 space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Bank Name</label>
                          <input type="text" className="w-full glass-panel rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.bankDetails?.bankName} onChange={e => setFormData(p => ({...p, bankDetails: {...(p.bankDetails as any), bankName: e.target.value}}))} />
                       </div>
                       <div className="lg:col-span-2 space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Account Holder Designation</label>
                          <input type="text" className="w-full glass-panel rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.bankDetails?.accountName} onChange={e => setFormData(p => ({...p, bankDetails: {...(p.bankDetails as any), accountName: e.target.value}}))} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Account Number</label>
                          <input type="text" className="w-full glass-panel rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.bankDetails?.accountNumber} onChange={e => setFormData(p => ({...p, bankDetails: {...(p.bankDetails as any), accountNumber: e.target.value}}))} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-600 tracking-widest px-1">Routing Index (IFSC)</label>
                          <input type="text" className="w-full glass-panel rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none uppercase" value={formData.bankDetails?.ifsc} onChange={e => setFormData(p => ({...p, bankDetails: {...(p.bankDetails as any), ifsc: e.target.value.toUpperCase()}}))} />
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
                            className="w-full glass-panel rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none cursor-pointer appearance-none"
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
                            className="w-full glass-panel rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none cursor-pointer appearance-none"
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
                            className="w-full glass-panel rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none cursor-pointer appearance-none"
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
                            className="w-full glass-panel rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none cursor-pointer appearance-none"
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
                            className="w-full glass-panel rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none cursor-pointer appearance-none"
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
                          <input type="text" className="w-full glass-panel rounded-2xl p-5 text-sm font-bold text-white focus:border-white/20 outline-none" value={formData.invoiceNotes} onChange={e => setFormData(p => ({...p, invoiceNotes: e.target.value}))} />
                       </div>
                    </div>
                  </div>
                 </div>
                 )}

                 {activeModalTab === 'theme' && (
                    <div className="animate-ios-fade-in">
                       <ThemeStudio 
                          company={formData as CompanyProfile}
                          onUpdate={(updated) => setFormData(p => ({ ...p, ...updated }))}
                       />
                    </div>
                 )}
                 
                 {activeModalTab === 'portals' && (
                    <div className="space-y-8 animate-ios-fade-in">
                       <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                          <Building className="w-5 h-5 text-purple-500" />
                          <h3 className="text-sm font-black uppercase tracking-widest text-white">Portal Configuration</h3>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {Object.entries({
                             clientPortal: ['Client Portal', 'External client access to proposals, invoices & gallery'],
                             staffPortal: ['Staff Portal', 'Internal access for assignees and crew'],
                             publicBooking: ['Public Booking', 'Public-facing booking engine and lead capture'],
                             productionWorkflow: ['Production Workflow', 'Kanban boards and task management'],
                             revenueModule: ['Revenue Module', 'Financial reporting and analytics'],
                             marketingHub: ['Marketing Hub', 'CRM, automations and lead tracking']
                          }).map(([key, [title, desc]]) => (
                             <button
                                key={key}
                                type="button"
                                onClick={() => setFormData(p => ({ 
                                   ...p, 
                                   portalConfig: { 
                                      ...(p.portalConfig || { clientPortal: true, staffPortal: true, publicBooking: true, productionWorkflow: true, revenueModule: true, marketingHub: true }), 
                                      [key]: !p.portalConfig?.[key as keyof typeof p.portalConfig]
                                   } 
                                }))}
                                className={`p-6 rounded-2xl border transition-all text-left flex items-start gap-4 ${
                                   formData.portalConfig?.[key as keyof typeof formData.portalConfig] !== false
                                      ? 'bg-white/5 border-white/20' 
                                      : 'bg-transparent border-white/5 opacity-50'
                                }`}
                             >
                                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                                   formData.portalConfig?.[key as keyof typeof formData.portalConfig] !== false
                                      ? 'bg-primary text-black' 
                                      : 'bg-white/10'
                                }`}>
                                   {formData.portalConfig?.[key as keyof typeof formData.portalConfig] !== false && <Check className="w-3 h-3" />}
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-white uppercase tracking-widest">{title}</p>
                                   <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">{desc}</p>
                                </div>
                             </button>
                          ))}
                       </div>
                    </div>
                 )}
                 
                 {activeModalTab === 'notifications' && (
                    <div className="animate-ios-fade-in p-8 border border-white/5 rounded-3xl text-center space-y-4">
                       <Info className="w-8 h-8 text-zinc-500 mx-auto" />
                       <h3 className="text-lg font-black uppercase tracking-widest text-white">Notifications</h3>
                       <p className="text-xs font-bold text-zinc-500 uppercase">Notification preferences will be deployed in a future update.</p>
                    </div>
                 )}
                 
                 {activeModalTab === 'security' && (
                    <div className="animate-ios-fade-in p-8 border border-white/5 rounded-3xl text-center space-y-4">
                       <Shield className="w-8 h-8 text-zinc-500 mx-auto" />
                       <h3 className="text-lg font-black uppercase tracking-widest text-white">Security</h3>
                       <p className="text-xs font-bold text-zinc-500 uppercase">Brand-specific security protocols will be deployed in a future update.</p>
                    </div>
                 )}

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
                          <div className="w-12 h-6 bg-zinc-800 rounded-full border border-white/10 peer-checked:bg-primary transition-all p-1">
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
                         className="px-6 md:px-8 py-4 md:py-5 bg-white/5 text-zinc-400 hover:text-white rounded-2xl md:rounded-3xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all touch-target"
                       >
                          Abort
                       </button>
                       <button 
                         type="submit"
                         className="px-8 md:px-12 py-4 md:py-5 bg-white text-black font-black uppercase text-[10px] md:text-xs tracking-[0.2em] rounded-2xl md:rounded-3xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 md:gap-3 touch-target"
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


