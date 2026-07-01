import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit3, Trash2, Archive, CheckCircle2, 
  AlertTriangle, X, FileText, Clock, Layers, Building,
  BookOpen, Code2, Folder, Eye, Copy
} from 'lucide-react';
import { useCompanySettings } from '../../hooks/useCompanySettings';

export interface AgreementDocumentItem {
  id: string;
  name: string;
  brand: string;
  version: string;
  status: 'Active' | 'Draft' | 'Archived';
  updatedAt: string;
  assignedCount: number;
  description: string;
  content: string;
}

const INITIAL_AGREEMENTS: AgreementDocumentItem[] = [
  {
    id: 'agr_aaha_wedding',
    name: 'Wedding Photography Agreement',
    brand: 'Aaha Kalyanam',
    version: '1.2.0',
    status: 'Active',
    updatedAt: '2026-06-29',
    assignedCount: 14,
    description: 'Comprehensive wedding photography & videography agreement for luxury celebrations.',
    content: `HOW WE WORK: SERVICE TERMS & CONDITIONS

1. Booking & Payment Policy
● Advance: To confirm the booking and secure the date, a non-refundable advance amount—as specified in the quotation or invoice—must be paid.
● Main Payment: The payment schedule and milestone amounts must be cleared strictly as specified in the quotation or invoice provided to the client.
● Final Settlement: The remaining balance as per the invoice is strictly due on the day the final outputs, including the album, are handed over.

2. Delivery Timeline
● Standard Timeline & Delays: Highlight photos delivered on event day or following day. Full deliverables and album handed over within 1 to 14 weeks.

3. Editing, Photo Selection & Corrections
● Photo Selection & Album Design: Our team will manually select the best shots for portraits. Client sorting required for family photos. Official album design timeline begins once client submits selected shots.`
  },
  {
    id: 'agr_aaha_engagement',
    name: 'Engagement Agreement',
    brand: 'Aaha Kalyanam',
    version: '1.0.0',
    status: 'Active',
    updatedAt: '2026-06-25',
    assignedCount: 5,
    description: 'Agreement terms for engagement ceremonies and pre-wedding portrait shoots.',
    content: `ENGAGEMENT CEREMONY AGREEMENT TERMS

1. Coverage Scope & Hours
● Coverage spans up to 5 hours for the engagement ceremony and portraits.
● Standard deliverable package includes 50 graded digital portraits and a 3-minute highlight cinematic reel.`
  },
  {
    id: 'agr_aaha_reception',
    name: 'Reception Agreement',
    brand: 'Aaha Kalyanam',
    version: '1.0.0',
    status: 'Active',
    updatedAt: '2026-06-24',
    assignedCount: 3,
    description: 'Evening reception party and celebratory dinner coverage terms.',
    content: `RECEPTION COVERAGE AGREEMENT

1. Event Timing & Output Delivery
● Event highlights delivered within 48 hours for immediate social media sharing.`
  },
  {
    id: 'agr_tinytoes_newborn',
    name: 'Newborn Agreement',
    brand: 'Tiny Toes',
    version: '1.0.0',
    status: 'Active',
    updatedAt: '2026-06-20',
    assignedCount: 8,
    description: 'Safety protocols, studio comfort guidelines, and infant portrait terms.',
    content: `TINY TOES NEWBORN PORTRAIT AGREEMENT

1. Session Guidelines & Infant Safety
● Studio environment and temperature will be meticulously sanitized and heated for baby comfort.`
  },
  {
    id: 'agr_tinytoes_birthday',
    name: 'Birthday Agreement',
    brand: 'Tiny Toes',
    version: '1.0.0',
    status: 'Active',
    updatedAt: '2026-06-18',
    assignedCount: 4,
    description: 'Milestone birthday celebration and family party shoot agreement.',
    content: `TINY TOES BIRTHDAY SHOOT TERMS

1. Event Coverage & Candid Captures
● Unlimited candid captures during the party event with high-res digital delivery within 10 days.`
  }
];

export const AgreementTemplateManager: React.FC = () => {
  const { companies } = useCompanySettings();

  const [agreements, setAgreements] = useState<AgreementDocumentItem[]>(() => {
    const saved = localStorage.getItem('artisans_agreement_library_documents');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_AGREEMENTS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [sortBy, setSortBy] = useState<'Recently Updated' | 'Name' | 'Version'>('Recently Updated');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editorModeTab, setEditorModeTab] = useState<'edit' | 'preview'>('edit');
  const [editingDoc, setEditingDoc] = useState<AgreementDocumentItem | null>(null); // null means new agreement
  const [formData, setFormData] = useState<Partial<AgreementDocumentItem>>({});
  
  const [previewModalDoc, setPreviewModalDoc] = useState<AgreementDocumentItem | null>(null);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<AgreementDocumentItem | null>(null);

  useEffect(() => {
    localStorage.setItem('artisans_agreement_library_documents', JSON.stringify(agreements));
  }, [agreements]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Derive dynamic brand list
  const dynamicBrands = React.useMemo(() => {
    const set = new Set<string>();
    set.add('Aaha Kalyanam');
    set.add('Tiny Toes');
    set.add('Artisans Production');

    if (companies && companies.length > 0) {
      companies.forEach(c => {
        if (c.companyName) set.add(c.companyName);
      });
    }

    agreements.forEach(a => {
      if (a.brand) set.add(a.brand);
    });

    return Array.from(set);
  }, [companies, agreements]);

  // Modal Handlers
  const handleOpenNewModal = (preselectedBrand?: string) => {
    setEditingDoc(null);
    setEditorModeTab('edit');
    setFormData({
      brand: preselectedBrand || dynamicBrands[0] || 'Aaha Kalyanam',
      name: '',
      version: '1.0.0',
      description: '',
      status: 'Draft',
      content: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (docItem: AgreementDocumentItem) => {
    setEditingDoc(docItem);
    setEditorModeTab('edit');
    setFormData(docItem);
    setIsModalOpen(true);
  };

  const handleSaveAgreement = (targetStatus: 'Draft' | 'Active') => {
    if (!formData.name?.trim() || !formData.content?.trim()) {
      showToast('Please provide an Agreement Name and Content');
      return;
    }

    const nowStr = new Date().toISOString().split('T')[0];

    if (editingDoc) {
      // Update existing agreement
      setAgreements(prev => prev.map(a => {
        if (a.id === editingDoc.id) {
          return {
            ...a,
            ...formData as AgreementDocumentItem,
            status: targetStatus,
            updatedAt: nowStr
          };
        }
        return a;
      }));
      showToast(`Agreement "${formData.name}" saved as ${targetStatus} ✓`);
    } else {
      // Create new agreement
      const newDoc: AgreementDocumentItem = {
        id: `agr_${Date.now()}`,
        name: formData.name.trim(),
        brand: formData.brand || 'Aaha Kalyanam',
        version: formData.version || '1.0.0',
        status: targetStatus,
        updatedAt: nowStr,
        assignedCount: 0,
        description: formData.description || '',
        content: formData.content || ''
      };

      setAgreements(prev => [newDoc, ...prev]);
      showToast(`New agreement "${newDoc.name}" added to ${newDoc.brand} Library as ${targetStatus} ✓`);
    }

    setIsModalOpen(false);
  };

  const handleDuplicate = (docItem: AgreementDocumentItem) => {
    const versionParts = docItem.version.split('.');
    const minorVersion = parseInt(versionParts[1] || '0', 10) + 1;
    const newVersion = `${versionParts[0] || '1'}.${minorVersion}.${versionParts[2] || '0'}`;

    const duplicated: AgreementDocumentItem = {
      ...docItem,
      id: `agr_${Date.now()}`,
      name: `${docItem.name} Copy`,
      version: newVersion,
      status: 'Draft',
      assignedCount: 0,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setAgreements(prev => [duplicated, ...prev]);
    showToast(`Duplicated into "${duplicated.name}" (Draft) ✓`);
  };

  const handleExecuteDeleteOrArchive = () => {
    if (!deleteConfirmDoc) return;
    const target = deleteConfirmDoc;

    if (target.assignedCount > 0) {
      // Archive if assigned to clients to protect active contracts
      setAgreements(prev => prev.map(a => a.id === target.id ? { ...a, status: 'Archived' } : a));
      showToast(`Agreement archived to protect ${target.assignedCount} active client contracts ✓`);
    } else {
      // Hard delete if never assigned
      setAgreements(prev => prev.filter(a => a.id !== target.id));
      showToast(`Agreement "${target.name}" deleted permanently ✓`);
    }

    setDeleteConfirmDoc(null);
  };

  const insertPlaceholderTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      content: (prev.content || '') + ` ${tag} `
    }));
  };

  return (
    <div className="space-y-12 animate-ios-fade-in font-sans">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-8 right-8 z-[1100] flex items-center gap-3 bg-primary text-black px-6 py-4 rounded-2xl shadow-2xl font-bold text-xs uppercase tracking-widest animate-ios-slide-up">
          <CheckCircle2 className="w-5 h-5 fill-black text-primary" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* DOCUMENT LIBRARY HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Agreement Document Repository
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-2">
            Agreement Library
          </h1>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em]">
            Manage agreement templates across all brand portals.
          </p>
        </div>
      </div>

      {/* TOP TOOLBAR: Search & Filters */}
      <div className="glass-panel p-6 squircle-lg border border-white/5 bg-white/[0.01] grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        
        {/* Search Box */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search agreement name or terms..."
            className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-xs font-bold text-white placeholder-zinc-600 outline-none focus:border-primary transition-all"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-primary transition-all appearance-none cursor-pointer"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All Statuses" className="bg-zinc-900 text-white">Filter: All Statuses</option>
            <option value="Active" className="bg-zinc-900 text-white">Active</option>
            <option value="Draft" className="bg-zinc-900 text-white">Draft</option>
            <option value="Archived" className="bg-zinc-900 text-white">Archived</option>
          </select>
          <Layers className="w-3.5 h-3.5 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-primary transition-all appearance-none cursor-pointer"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
          >
            <option value="Recently Updated" className="bg-zinc-900 text-white">Sort: Recently Updated</option>
            <option value="Name" className="bg-zinc-900 text-white">Sort: Name</option>
            <option value="Version" className="bg-zinc-900 text-white">Sort: Version</option>
          </select>
          <Clock className="w-3.5 h-3.5 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

      </div>

      {/* DYNAMIC BRAND LIBRARIES */}
      <div className="space-y-16">
        {dynamicBrands.map((brandName) => {
          // Filter agreements for this specific brand
          const brandAgreements = agreements.filter(a => {
            const matchesBrand = a.brand.toLowerCase() === brandName.toLowerCase();
            const matchesSearch = !searchQuery || 
              a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              a.content.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'All Statuses' || a.status.toLowerCase() === statusFilter.toLowerCase();
            return matchesBrand && matchesSearch && matchesStatus;
          }).sort((a, b) => {
            if (sortBy === 'Name') return a.name.localeCompare(b.name);
            if (sortBy === 'Version') return b.version.localeCompare(a.version);
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          });

          if (searchQuery && brandAgreements.length === 0) return null;

          return (
            <section key={brandName} className="space-y-6">
              
              {/* Brand Library Header with ➕ New Agreement Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-2xl text-primary">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                      {brandName}
                    </h2>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      {brandAgreements.length} Agreement Document{brandAgreements.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenNewModal(brandName)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white text-white hover:text-black font-bold uppercase text-xs rounded-xl tracking-widest transition-all shadow-lg flex items-center gap-2 self-start sm:self-auto active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>➕ New Agreement</span>
                </button>
              </div>

              {/* Agreement Cards Grid */}
              {brandAgreements.length === 0 ? (
                <div className="glass-panel p-8 text-center squircle-lg border border-dashed border-white/10 bg-white/[0.005] space-y-3">
                  <Folder className="w-8 h-8 text-zinc-600 mx-auto opacity-40" />
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">No agreement documents in {brandName} Library</p>
                  <button
                    onClick={() => handleOpenNewModal(brandName)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold uppercase text-[10px] rounded-lg tracking-widest transition-all inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> ➕ New Agreement
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {brandAgreements.map((agreementDoc) => (
                    <div
                      key={agreementDoc.id}
                      className="glass-panel p-6 squircle-lg border border-white/5 bg-white/[0.01] hover:border-white/15 hover:bg-white/[0.02] transition-all duration-300 flex flex-col justify-between group relative"
                    >
                      <div>
                        {/* Card Header metadata */}
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-xs font-mono font-bold text-zinc-400">
                              v{agreementDoc.version}
                            </span>
                          </div>

                          <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${
                            agreementDoc.status === 'Active' ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400' :
                            agreementDoc.status === 'Draft' ? 'bg-amber-950/60 border border-amber-500/30 text-amber-400' :
                            'bg-zinc-800 border border-zinc-700 text-zinc-400'
                          }`}>
                            {agreementDoc.status}
                          </span>
                        </div>

                        {/* Agreement Name */}
                        <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors leading-tight mb-2">
                          • {agreementDoc.name}
                        </h3>

                        {agreementDoc.description && (
                          <p className="text-xs text-zinc-400 leading-relaxed mb-4 line-clamp-2">
                            {agreementDoc.description}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-2 py-3 border-t border-white/5 text-[10px] text-zinc-500 font-medium">
                          <div>
                            <span className="block text-zinc-600 font-bold uppercase text-[9px]">Last Updated</span>
                            <span className="text-zinc-300 font-bold">{agreementDoc.updatedAt}</span>
                          </div>
                          <div>
                            <span className="block text-zinc-600 font-bold uppercase text-[9px]">Assigned Clients</span>
                            <span className="text-zinc-300 font-bold">{agreementDoc.assignedCount} Clients</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions: 👁 Preview, ✏ Edit, 📄 Duplicate, 🗑 Delete (NO Assign button!) */}
                      <div className="pt-4 border-t border-white/5 flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => setPreviewModalDoc(agreementDoc)}
                          className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg transition-all text-xs font-bold flex items-center gap-1"
                          title="Preview Agreement PDF"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          <span>👁 Preview</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(agreementDoc)}
                          className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all text-xs font-bold flex items-center gap-1"
                          title="Edit Agreement Document"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>✏ Edit</span>
                        </button>

                        <button
                          onClick={() => handleDuplicate(agreementDoc)}
                          className="p-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg transition-all"
                          title="Duplicate Agreement"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmDoc(agreementDoc)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                          title="Delete or Archive Agreement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </section>
          );
        })}
      </div>


      {/* ────────────────── EXPANSIVE FULL-DOCUMENT EDITOR MODAL (~90% VIEWPORT HEIGHT) ────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 md:p-6 pt-safe">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl animate-ios-fade-in" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-6xl h-[90vh] glass-panel border border-white/10 rounded-[2.5rem] shadow-4xl animate-ios-slide-up flex flex-col bg-zinc-950 overflow-hidden">
            
            {/* Modal Workspace Header */}
            <div className="p-4 md:p-6 border-b border-white/5 bg-zinc-950 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">
                    {editingDoc ? `Edit Agreement: ${editingDoc.name}` : 'Create New Agreement Document'}
                  </h2>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    90% Viewport Viewport Document Studio & Live PDF Renderer
                  </p>
                </div>
              </div>

              {/* Mode Toggle Tabs (Edit / Preview PDF) */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-black/60 p-1 border border-white/10 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setEditorModeTab('edit')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      editorModeTab === 'edit' ? 'bg-white text-black shadow' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> 📝 Document Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorModeTab('preview')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      editorModeTab === 'preview' ? 'bg-white text-black shadow' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> 📄 Live PDF Preview
                  </button>
                </div>

                <button onClick={() => setIsModalOpen(false)} className="p-2.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Warning Banner for Edit Mode */}
            {editingDoc && editorModeTab === 'edit' && (
              <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 flex items-center gap-3 text-amber-400 text-xs font-bold uppercase tracking-wider shrink-0">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Changes only affect future agreements. Previously signed agreements remain unchanged.</span>
              </div>
            )}

            {/* Workspace Content Body */}
            {editorModeTab === 'edit' ? (
              <form onSubmit={(e) => { e.preventDefault(); handleSaveAgreement((formData.status as any) || 'Active'); }} className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden">
                
                {/* Metadata Toolbar Controls */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 shrink-0 bg-white/[0.01] p-4 rounded-2xl border border-white/5">
                  
                  {/* Brand */}
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Brand *</label>
                    <select
                      required
                      className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-primary transition-all cursor-pointer"
                      value={formData.brand || dynamicBrands[0]}
                      onChange={e => setFormData(p => ({ ...p, brand: e.target.value }))}
                    >
                      {dynamicBrands.map(b => (
                        <option key={b} value={b} className="bg-zinc-900">{b}</option>
                      ))}
                    </select>
                  </div>

                  {/* Agreement Name */}
                  <div className="md:col-span-5 space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Agreement Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Wedding Photography Agreement"
                      className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-primary transition-all"
                      value={formData.name || ''}
                      onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>

                  {/* Version */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Version *</label>
                    <input
                      required
                      type="text"
                      placeholder="1.0.0"
                      className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-mono font-bold text-white outline-none focus:border-primary transition-all"
                      value={formData.version || ''}
                      onChange={e => setFormData(p => ({ ...p, version: e.target.value }))}
                    />
                  </div>

                  {/* Status */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Status *</label>
                    <select
                      className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-primary transition-all cursor-pointer"
                      value={formData.status || 'Draft'}
                      onChange={e => setFormData(p => ({ ...p, status: e.target.value as any }))}
                    >
                      <option value="Draft" className="bg-zinc-900">Draft</option>
                      <option value="Active" className="bg-zinc-900">Active (Published)</option>
                      <option value="Archived" className="bg-zinc-900">Archived</option>
                    </select>
                  </div>

                </div>

                {/* EXPANSIVE FULL-PAGE AGREEMENT CONTENT EDITOR */}
                <div className="flex-1 flex flex-col space-y-2 min-h-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 px-1">
                    <label className="text-xs font-bold uppercase text-white tracking-widest flex items-center gap-2">
                      <span>Agreement Content & Legal Clauses *</span>
                    </label>
                    
                    {/* Dynamic Tags Toolbar */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold mr-1">Insert Key:</span>
                      {['{{CLIENT_NAME}}', '{{EVENT_NAME}}', '{{EVENT_DATE}}', '{{TOTAL_AMOUNT}}', '{{ADVANCE_AMOUNT}}', '{{BALANCE_AMOUNT}}', '{{TODAY_DATE}}'].map(tag => (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => insertPlaceholderTag(tag)}
                          className="px-2 py-1 bg-white/5 hover:bg-primary/20 hover:text-primary border border-white/10 rounded text-[9px] font-mono font-bold text-zinc-400 transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Full-Height Monospace Editor Area */}
                  <textarea
                    required
                    placeholder="Type or paste the complete agreement document text, numbered clauses, delivery terms, and legal conditions here..."
                    className="flex-1 w-full bg-black/80 border border-white/10 rounded-2xl p-5 text-sm font-mono text-zinc-200 outline-none focus:border-primary transition-all leading-relaxed resize-none overflow-y-auto no-scrollbar shadow-inner"
                    value={formData.content || ''}
                    onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
                  />
                </div>

                {/* Bottom Action Bar */}
                <div className="flex justify-end gap-3 pt-3 border-t border-white/5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white font-bold uppercase text-xs rounded-xl tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveAgreement('Draft')}
                    className="px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold uppercase text-xs rounded-xl tracking-widest transition-all border border-amber-500/30"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveAgreement('Active')}
                    className="px-8 py-3 bg-white text-black hover:bg-zinc-200 font-black uppercase text-xs rounded-xl tracking-widest transition-all shadow-xl"
                  >
                    Publish Version (Active)
                  </button>
                </div>

              </form>
            ) : (
              /* PDF PREVIEW SHEET TAB */
              <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-white text-zinc-900 font-sans space-y-6 no-scrollbar">
                <div className="border-b pb-6 text-center space-y-2">
                  <h1 className="text-2xl font-serif font-bold tracking-widest uppercase text-zinc-900">
                    {(formData.brand || 'AAHA KALYANAM').toUpperCase()}
                  </h1>
                  <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
                    Operating Brand of Artisans Production Company
                  </p>
                  <div className="pt-4">
                    <h2 className="text-xl font-serif font-bold uppercase text-zinc-800 tracking-wide">
                      {formData.name || 'Untitled Agreement Document'}
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="border p-4 space-y-1">
                    <p className="font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Client Details (Sample Preview)</p>
                    <p><span className="font-bold">Client Name:</span> Priya & Rahul Anand</p>
                    <p><span className="font-bold">Email:</span> client@example.com</p>
                  </div>
                  <div className="border p-4 space-y-1">
                    <p className="font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Agreement Details</p>
                    <p><span className="font-bold">Brand:</span> {formData.brand || 'Aaha Kalyanam'}</p>
                    <p><span className="font-bold">Version:</span> v{formData.version || '1.0.0'}</p>
                  </div>
                </div>

                <div className="pt-4 space-y-4 flex-1">
                  <h3 className="font-serif font-bold text-base border-b pb-2 uppercase tracking-wide">
                    Terms & Conditions
                  </h3>
                  <div className="whitespace-pre-wrap text-xs text-zinc-700 leading-relaxed font-sans min-h-[200px]">
                    {formData.content || 'No text content defined for this document template.'}
                  </div>
                </div>

                <div className="pt-8 border-t grid grid-cols-2 gap-8 text-xs shrink-0">
                  <div className="space-y-6">
                    <p className="font-bold uppercase tracking-wider text-zinc-400 text-[10px]">CLIENT SIGNATURE</p>
                    <div className="border-b h-10 flex items-end pb-1 text-zinc-400 italic text-[11px]">[Pending Digital Execution]</div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold uppercase tracking-wider text-zinc-400 text-[10px]">SERVICE PROVIDER</p>
                    <div className="h-10 flex items-end">
                      <svg viewBox="0 0 300 80" className="h-8 text-zinc-800 fill-none stroke-current stroke-2">
                        <path d="M 10 60 C 30 20, 50 70, 70 30 C 80 10, 90 50, 110 40 C 130 30, 120 70, 150 20 C 170 10, 180 50, 200 35 C 220 20, 240 60, 280 15" />
                      </svg>
                    </div>
                    <p className="font-bold text-zinc-900 uppercase">ARTISANS PRODUCTION COMPANY</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}


      {/* ────────────────── 2. PREVIEW STANDALONE MODAL ────────────────── */}
      {previewModalDoc && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10 pt-safe">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl animate-ios-fade-in" onClick={() => setPreviewModalDoc(null)} />
          <div className="relative w-full max-w-4xl max-h-[90vh] glass-panel border border-white/10 rounded-[2.5rem] shadow-4xl animate-ios-slide-up flex flex-col bg-zinc-950 overflow-hidden">
            
            <div className="p-6 border-b border-white/5 bg-zinc-950 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold uppercase tracking-widest rounded-md">
                    Document Preview Mode
                  </span>
                  <span className="text-xs font-mono text-zinc-500">v{previewModalDoc.version}</span>
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight mt-1">
                  {previewModalDoc.name}
                </h2>
              </div>
              <button onClick={() => setPreviewModalDoc(null)} className="p-3 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-2xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 md:p-12 overflow-y-auto flex-1 no-scrollbar bg-white text-zinc-900 font-sans space-y-8">
              <div className="border-b pb-6 text-center space-y-2">
                <h1 className="text-2xl font-serif font-bold tracking-widest uppercase text-zinc-900">
                  {previewModalDoc.brand.toUpperCase()}
                </h1>
                <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
                  Operating Brand of Artisans Production Company
                </p>
                <div className="pt-4">
                  <h2 className="text-xl font-serif font-bold uppercase text-zinc-800 tracking-wide">
                    {previewModalDoc.name}
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="border p-4 space-y-1">
                  <p className="font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Client Details (Sample)</p>
                  <p><span className="font-bold">Client Name:</span> Priya & Rahul Anand</p>
                  <p><span className="font-bold">Email:</span> client@example.com</p>
                </div>
                <div className="border p-4 space-y-1">
                  <p className="font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Agreement Details</p>
                  <p><span className="font-bold">Document ID:</span> {previewModalDoc.id}</p>
                  <p><span className="font-bold">Version:</span> v{previewModalDoc.version}</p>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <h3 className="font-serif font-bold text-base border-b pb-2 uppercase tracking-wide">
                  Terms & Conditions
                </h3>
                <div className="whitespace-pre-wrap text-xs text-zinc-700 leading-relaxed font-sans">
                  {previewModalDoc.content || 'No text content defined for this template.'}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-zinc-950 flex justify-end shrink-0">
              <button
                onClick={() => setPreviewModalDoc(null)}
                className="px-8 py-3 bg-white text-black font-bold uppercase text-xs rounded-xl tracking-widest hover:bg-zinc-200 transition-all"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}


      {/* ────────────────── DELETE / ARCHIVE CONFIRMATION MODAL ────────────────── */}
      {deleteConfirmDoc && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10 pt-safe">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl animate-ios-fade-in" onClick={() => setDeleteConfirmDoc(null)} />
          <div className="relative w-full max-w-md glass-panel border border-white/10 rounded-[2.5rem] shadow-4xl animate-ios-slide-up p-8 text-center bg-zinc-950 space-y-6">
            
            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center border ${
              deleteConfirmDoc.assignedCount > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {deleteConfirmDoc.assignedCount > 0 ? <Archive className="w-8 h-8" /> : <Trash2 className="w-8 h-8" />}
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                {deleteConfirmDoc.assignedCount > 0 ? 'Archive Agreement' : 'Delete Agreement'}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {deleteConfirmDoc.assignedCount > 0 ? (
                  <>This agreement has already been assigned to <strong className="text-white">{deleteConfirmDoc.assignedCount} clients</strong>. To protect active contracts and signed records, this agreement will be <strong className="text-amber-400">Archived</strong> instead of permanently deleted.</>
                ) : (
                  <>Are you sure you want to permanently delete <strong className="text-white">"{deleteConfirmDoc.name}"</strong>? This agreement has never been assigned to any clients.</>
                )}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmDoc(null)}
                className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDeleteOrArchive}
                className={`flex-1 py-3.5 text-black font-black uppercase text-xs rounded-xl tracking-widest transition-all ${
                  deleteConfirmDoc.assignedCount > 0 ? 'bg-amber-400 hover:bg-amber-300' : 'bg-red-500 hover:bg-red-400 text-white'
                }`}
              >
                {deleteConfirmDoc.assignedCount > 0 ? 'Archive Agreement' : 'Delete Permanently'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
