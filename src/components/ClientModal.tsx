import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  X, User, Mail, Phone, CalendarDays, Briefcase, Building2,
  MapPin, FileText, ChevronDown, ClipboardList, Home, Navigation
} from 'lucide-react';
import { type Client, type CompanyProfile } from '../types';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clientData: Client) => Promise<any>;
  companies: CompanyProfile[];
  clients: Client[];
  initialClient?: Client | null;
  preselectedBrandId?: string;
}

// ─── Reusable Field Components ───────────────────────────────────────────────

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.18em] px-1 flex items-center gap-1.5">
    {children}
  </label>
);

const inputBase =
  'w-full bg-white/5 border border-white/8 rounded-xl p-3.5 text-sm font-medium text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 focus:bg-white/8 transition-all disabled:opacity-40';

const selectBase =
  'w-full bg-zinc-800/60 border border-white/8 rounded-xl p-3.5 text-sm font-medium text-white focus:outline-none focus:border-white/20 transition-all disabled:opacity-40 appearance-none';

// ─── Section Heading (Full-create only) ──────────────────────────────────────

const SectionHeading = ({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) => (
  <div className="flex items-center gap-3 pt-2">
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <Icon className="w-4 h-4 text-zinc-400" />
    </div>
    <div className="flex-1">
      <p className="text-[11px] font-black uppercase text-white tracking-[0.2em]">{title}</p>
      {subtitle && (
        <p className="text-[9px] text-zinc-600 uppercase tracking-widest mt-0.5">{subtitle}</p>
      )}
    </div>
    <div className="flex-1 h-px bg-white/5" />
  </div>
);

// ─── Main Modal ───────────────────────────────────────────────────────────────

const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  companies,
  clients,
  initialClient = null,
  preselectedBrandId = 'All',
}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventDate: '',
    projectType: 'Wedding',
    companyId: '',
    projectName: '',
    locationType: '' as 'Bride' | 'Groom' | '',
    brideAddress: '',
    groomAddress: '',
    venueAddress: '',
    notes: '',
    address: '',
  });

  const isEditing = !!initialClient;

  // ── Initialise form data ────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setFormError(null);
      if (isEditing && initialClient) {
        setFormData({
          name: initialClient.name || '',
          email: initialClient.email || '',
          phone: initialClient.phone || '',
          eventDate: initialClient.eventDate || '',
          projectType: initialClient.projectType || 'Wedding',
          companyId: initialClient.companyId || initialClient.divisionId || '',
          projectName: initialClient.brand || '',
          locationType: initialClient.eventLogistics?.locationType || '',
          brideAddress: initialClient.eventLogistics?.brideAddress || '',
          groomAddress: initialClient.eventLogistics?.groomAddress || '',
          venueAddress: initialClient.eventLogistics?.venueAddress || '',
          notes: initialClient.notes || '',
          address: initialClient.address || '',
        });
      } else {
        const brandId =
          preselectedBrandId !== 'All'
            ? preselectedBrandId
            : companies.length === 1
            ? companies[0].id
            : '';
        const targetComp = companies.find(d => d.id === brandId);
        setFormData({
          name: '',
          email: '',
          phone: '',
          eventDate: '',
          projectType: 'Wedding',
          companyId: brandId || '',
          projectName:
            targetComp?.companyName ||
            (companies.length === 1 ? companies[0].companyName : ''),
          locationType: '',
          brideAddress: '',
          groomAddress: '',
          venueAddress: '',
          notes: '',
          address: '',
        });
      }
    }
  }, [isOpen, isEditing, initialClient, preselectedBrandId, companies]);

  // ── Scroll hint detection ───────────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setShowScrollHint(el.scrollHeight > el.clientHeight + 24 && el.scrollTop < 40);
    check();
    el.addEventListener('scroll', check);
    return () => el.removeEventListener('scroll', check);
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Submit handler ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyId || formData.companyId === 'All') {
      setFormError('Please select a specific Project Registry');
      return;
    }
    if (!formData.name.trim()) {
      setFormError('Client name is required');
      return;
    }
    if (formData.email) {
      const emailExists = clients.some(
        c =>
          c.email?.toLowerCase() === formData.email.toLowerCase() &&
          (!isEditing || c.id !== initialClient?.id)
      );
      if (emailExists) {
        setFormError('A client with this email already exists');
        return;
      }
    }

    setIsSubmitting(true);
    setFormError(null);

    const targetComp = companies.find(d => d.id === formData.companyId);

    const clientData: Client = {
      id: isEditing && initialClient ? initialClient.id : String(Date.now()),
      _id: isEditing && initialClient ? initialClient._id : `client-${Date.now()}`,
      projectName: formData.name,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      eventDate: formData.eventDate,
      projectType: formData.projectType,
      brand: targetComp?.companyName || formData.projectName || 'Unknown',
      divisionId: formData.companyId,
      companyId: formData.companyId,
      notes: formData.notes,
      address: formData.address,
      people: initialClient?.people || [],
      status: initialClient?.status || 'pending',
      createdAt:
        isEditing && initialClient ? initialClient.createdAt : new Date().toISOString(),
      eventLogistics: {
        locationType: (formData.locationType as 'Bride' | 'Groom') || undefined,
        brideAddress: formData.brideAddress,
        groomAddress: formData.groomAddress,
        venueAddress: formData.venueAddress,
      },
    };

    try {
      const result = await onSubmit(clientData);
      onClose();
      if (!isEditing) {
        const targetId = result?.id || clientData.id;
        navigate(`/client/${targetId}`);
      }
    } catch {
      setFormError('Failed to save client. Insufficient permissions or storage issue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCompany = companies.find(d => d.id === formData.companyId);
  const isTinyToes = selectedCompany?.companyName?.toLowerCase().includes('tiny toes') || false;



  // ════════════════════════════════════════════════════════════════════════════
  // FULL CREATE / EDIT — wide, sectioned onboarding form
  // ════════════════════════════════════════════════════════════════════════════
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 font-sans"
      style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl flex flex-col bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        style={{
          maxHeight: '92vh',
          animation: 'modal-scale-up 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Full Create Header ───────────────────────────────────── */}
        <div className="shrink-0 relative px-8 pt-8 pb-6 border-b border-white/6"
          style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.03) 0%,transparent 100%)' }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">
                  {isEditing ? 'Edit Client' : 'New Client Onboarding'}
                </h2>
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mt-1.5">
                  {isEditing
                    ? 'Update client profile and logistics'
                    : 'Complete client profile · All fields persist to Directory'}
                </p>
              </div>
            </div>
            <button
              disabled={isSubmitting}
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          {/* Field count badge */}
          {!isEditing && (
            <div className="mt-5 flex items-center gap-2 flex-wrap">
              {['Basic Info', 'Event Details', 'Location & Logistics', 'Notes'].map((s, i) => (
                <span
                  key={i}
                  className="text-[9px] font-black uppercase tracking-widest text-zinc-600 px-2.5 py-1 rounded-full border border-white/6 bg-white/3"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Scrollable Form Body ─────────────────────────────────── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-[10px] uppercase tracking-widest font-mono text-center">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} id="full-client-form" className="space-y-8">

            {/* ── SECTION 1: Basic Information ──────────────────────── */}
            <div className="space-y-4">
              <SectionHeading icon={User} title="Basic Information" subtitle="Identity & contact" />

              {/* Registry */}
              <div className="space-y-1.5">
                <FieldLabel><Building2 className="w-3 h-3" /> Project Registry *</FieldLabel>
                {preselectedBrandId !== 'All' ? (
                  <div className="w-full bg-white/3 border border-white/6 rounded-xl p-3.5 text-sm font-medium text-zinc-400 cursor-not-allowed flex items-center justify-between">
                    <span>{companies.find(d => d.id === preselectedBrandId)?.companyName || preselectedBrandId}</span>
                    <span className="text-[8px] opacity-30 uppercase tracking-widest">Locked</span>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      className={selectBase}
                      value={formData.companyId || ''}
                      onChange={e => {
                        const id = e.target.value;
                        const comp = companies.find(d => d.id === id);
                        setFormData(prev => ({ ...prev, companyId: id, projectName: comp?.companyName || '' }));
                      }}
                      disabled={isSubmitting}
                    >
                      {companies.length > 1 && <option value="" disabled>Select Registry</option>}
                      {companies.map(d => (
                        <option key={d.id} className="bg-zinc-900" value={d.id}>{d.companyName}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <FieldLabel><User className="w-3 h-3" /> Client Name *</FieldLabel>
                <input
                  className={inputBase}
                  placeholder="e.g. Rahul & Priya"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <FieldLabel><Mail className="w-3 h-3" /> Email <span className="opacity-40">(Optional)</span></FieldLabel>
                  <input
                    type="email"
                    className={inputBase}
                    placeholder="hello@example.com"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel><Phone className="w-3 h-3" /> Phone <span className="opacity-40">(Optional)</span></FieldLabel>
                  <input
                    className={inputBase}
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* ── SECTION 2: Event Information ──────────────────────── */}
            <div className="space-y-4">
              <SectionHeading icon={CalendarDays} title="Event Information" subtitle="Project type & date" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <FieldLabel><Briefcase className="w-3 h-3" /> Project Type *</FieldLabel>
                  <div className="relative">
                    <select
                      className={selectBase}
                      value={formData.projectType}
                      onChange={e => setFormData(prev => ({ ...prev, projectType: e.target.value }))}
                      disabled={isSubmitting}
                    >
                      <option value="Wedding" className="bg-zinc-900">Luxury Wedding</option>
                      <option value="Kids" className="bg-zinc-900">Kids & Maternity</option>
                      <option value="Corporate" className="bg-zinc-900">Corporate Production</option>
                      <option value="Fashion" className="bg-zinc-900">Fashion Editorial</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <FieldLabel><CalendarDays className="w-3 h-3" /> {isTinyToes ? 'Shoot Date' : 'Event Date'} <span className="opacity-40">(Optional)</span></FieldLabel>
                  <input
                    type="date"
                    className={inputBase + ' text-zinc-300'}
                    value={formData.eventDate}
                    onChange={e => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* ── SECTION 3: Location & Logistics ───────────────────── */}
            {!isTinyToes && (
              <div className="space-y-4">
                <SectionHeading icon={MapPin} title="Location & Logistics" subtitle="Event venue & party addresses" />

                {/* Location Type */}
                <div className="space-y-1.5">
                  <FieldLabel><Navigation className="w-3 h-3" /> Location Type <span className="opacity-40">(Optional)</span></FieldLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {(['', 'Bride', 'Groom'] as const).map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, locationType: opt }))}
                        disabled={isSubmitting}
                        className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                          formData.locationType === opt
                            ? 'bg-white text-black border-white'
                            : 'bg-white/5 text-zinc-500 border-white/8 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {opt === '' ? 'None' : opt + "'s Side"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bride addresses */}
                {formData.locationType === 'Bride' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl border border-white/6 bg-white/2">
                    <div className="space-y-1.5">
                      <FieldLabel><Home className="w-3 h-3" /> Bride Home Address</FieldLabel>
                      <textarea
                        className={inputBase + ' min-h-[90px] resize-none'}
                        placeholder={'House No. 12\nPark Avenue\nKochi, Kerala'}
                        value={formData.brideAddress}
                        onChange={e => setFormData(prev => ({ ...prev, brideAddress: e.target.value }))}
                        disabled={isSubmitting}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel><MapPin className="w-3 h-3" /> Venue Address</FieldLabel>
                      <textarea
                        className={inputBase + ' min-h-[90px] resize-none'}
                        placeholder={'Grand Ballroom\nHilton Chennai\nAnna Salai, Chennai'}
                        value={formData.venueAddress}
                        onChange={e => setFormData(prev => ({ ...prev, venueAddress: e.target.value }))}
                        disabled={isSubmitting}
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* Groom addresses */}
                {formData.locationType === 'Groom' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl border border-white/6 bg-white/2">
                    <div className="space-y-1.5">
                      <FieldLabel><Home className="w-3 h-3" /> Groom Home Address</FieldLabel>
                      <textarea
                        className={inputBase + ' min-h-[90px] resize-none'}
                        placeholder={'House No. 45\nMG Road\nBangalore, Karnataka'}
                        value={formData.groomAddress}
                        onChange={e => setFormData(prev => ({ ...prev, groomAddress: e.target.value }))}
                        disabled={isSubmitting}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel><MapPin className="w-3 h-3" /> Venue Address</FieldLabel>
                      <textarea
                        className={inputBase + ' min-h-[90px] resize-none'}
                        placeholder={'Grand Ballroom\nHilton Chennai\nAnna Salai, Chennai'}
                        value={formData.venueAddress}
                        onChange={e => setFormData(prev => ({ ...prev, venueAddress: e.target.value }))}
                        disabled={isSubmitting}
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* General address (always shown) */}
                <div className="space-y-1.5">
                  <FieldLabel><MapPin className="w-3 h-3" /> Billing / Mailing Address <span className="opacity-40">(Optional)</span></FieldLabel>
                  <textarea
                    className={inputBase + ' min-h-[80px] resize-none'}
                    placeholder={'House No. 24\nGreen Valley Road\nKochi, Kerala 682001'}
                    value={formData.address}
                    onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    disabled={isSubmitting}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* TinyToes: just billing address */}
            {isTinyToes && (
              <div className="space-y-4">
                <SectionHeading icon={MapPin} title="Address" subtitle="Billing or mailing address" />
                <div className="space-y-1.5">
                  <FieldLabel><MapPin className="w-3 h-3" /> Address <span className="opacity-40">(Optional)</span></FieldLabel>
                  <textarea
                    className={inputBase + ' min-h-[80px] resize-none'}
                    placeholder={'House No. 24\nGreen Valley Road\nKochi, Kerala'}
                    value={formData.address}
                    onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    disabled={isSubmitting}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* ── SECTION 4: Additional Notes ───────────────────────── */}
            <div className="space-y-4">
              <SectionHeading icon={FileText} title="Additional Notes" subtitle="Special requests, requirements, or context" />
              <textarea
                className={inputBase + ' min-h-[100px] resize-none'}
                placeholder="Any special requirements, dietary restrictions, style preferences, or important notes about this client..."
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                disabled={isSubmitting}
                rows={4}
              />
            </div>

            {/* Bottom spacer */}
            <div className="h-4" />
          </form>
        </div>

        {/* ── Scroll hint ──────────────────────────────────────────── */}
        {showScrollHint && (
          <div className="pointer-events-none absolute bottom-[72px] left-0 right-0 h-16 flex items-end justify-center pb-2"
            style={{ background: 'linear-gradient(to top,rgba(24,24,27,0.95),transparent)' }}
          >
            <div className="flex flex-col items-center gap-1 opacity-50">
              <ChevronDown className="w-4 h-4 text-zinc-400 animate-bounce" />
              <span className="text-[8px] uppercase tracking-widest text-zinc-500">Scroll for more</span>
            </div>
          </div>
        )}

        {/* ── Sticky Footer ────────────────────────────────────────── */}
        <div className="shrink-0 px-8 py-5 border-t border-white/6 flex gap-4 bg-zinc-900">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="flex-1 py-3.5 bg-white/5 hover:bg-white/8 text-zinc-500 hover:text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="full-client-form"
            disabled={isSubmitting}
            className="flex-[2] py-3.5 bg-white text-black hover:bg-zinc-100 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : isEditing ? '✓ Save Changes' : '+ Create Client'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ClientModal;
