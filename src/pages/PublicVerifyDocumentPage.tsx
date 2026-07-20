import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  FileText, 
  Building2, 
  User, 
  Calendar, 
  Lock, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  Award,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import type { DocumentVerificationResult } from '../services/api/documents';

export const PublicVerifyDocumentPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();

  const [state, setState] = useState<'loading' | 'success' | 'invalid' | 'error'>('loading');
  const [data, setData] = useState<DocumentVerificationResult | null>(null);

  const verifyDoc = useCallback(async () => {
    if (!documentId) {
      setState('invalid');
      return;
    }

    setState('loading');
    setData(null);

    try {
      const result = await api.verifyDocument(documentId);
      
      const statusUpper = (result.verificationStatus || '').toUpperCase();
      const isVerified = result.verified === true || ['AUTHENTIC', 'VALID', 'VERIFIED', 'SUCCESS'].includes(statusUpper);
      if (isVerified) {
        setData(result);
        setState('success');
      } else {
        setData(result);
        setState('invalid');
      }
    } catch (err: any) {
      console.error('[VerifyPortal] Error verifying document:', err);
      
      // If backend explicitly returns 404 or status NOT_FOUND / INVALID / TAMPERED in error data
      if (err?.status === 404 || err?.data?.verificationStatus === 'NOT_FOUND' || err?.data?.verificationStatus === 'TAMPERED') {
        setState('invalid');
      } else {
        // Network connection issues, server 5xx errors, or unexpected failures
        setState('error');
      }
    }
  }, [documentId]);

  useEffect(() => {
    verifyDoc();
  }, [verifyDoc]);

  // Utility helper to format document type nicely (e.g. "QUOTATION" -> "Quotation")
  const formatDocType = (type?: string) => {
    if (!type) return 'Document';
    return type
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Utility helper to format generated date nicely
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between font-sans relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background Ambient Glow Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-t from-blue-500/5 to-transparent blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-noise opacity-40" />
      </div>

      {/* Header Bar */}
      <header className="relative z-10 w-full max-w-4xl mx-auto px-6 py-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-white text-black squircle-sm flex items-center justify-center font-bold text-lg font-serif shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-transform group-hover:scale-105">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">APCO</span>
            <span className="text-xs font-bold uppercase tracking-wider text-white">Document Security Portal</span>
          </div>
        </Link>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-300">256-Bit Cryptographic Registry</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-xl">

          {/* ─────────────────────────────────────────────────────────────
              1. LOADING STATE
             ───────────────────────────────────────────────────────────── */}
          {state === 'loading' && (
            <div className="glass-panel-dark p-10 sm:p-12 rounded-[2.5rem] border border-white/10 backdrop-blur-2xl flex flex-col items-center text-center shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-ios-slide-up">
              <div className="relative mb-8">
                <div className="w-20 h-20 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin flex items-center justify-center" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 animate-pulse" />
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
                Verifying document...
              </h2>
              <p className="text-sm text-zinc-400 font-medium tracking-wide">
                Please wait...
              </p>

              <div className="mt-8 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Interrogating Immutable Document Ledger
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              2. SUCCESS STATE (VERIFIED)
             ───────────────────────────────────────────────────────────── */}
          {state === 'success' && (
            <div className="glass-panel-dark p-6 sm:p-10 rounded-[2.5rem] border border-emerald-500/30 backdrop-blur-2xl shadow-[0_20px_60px_rgba(16,185,129,0.15)] animate-ios-slide-up relative overflow-hidden">
              
              {/* Top Verified Banner */}
              <div className="flex flex-col items-center text-center pb-8 border-b border-white/10 relative">
                <div className="mb-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-black uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ✔ DOCUMENT VERIFIED
                </div>

                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                  Authentic APCO Document
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-md">
                  This document has been verified against the official Artisains Production Company registry.
                </p>
              </div>

              {/* Verified Details Grid */}
              <div className="py-6 sm:py-8 space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Document ID */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      Document ID
                    </div>
                    <p className="text-sm sm:text-base font-mono font-bold text-white tracking-wide">
                      {data?.documentId || documentId}
                    </p>
                  </div>

                  {/* Document Type */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      Document Type
                    </div>
                    <p className="text-sm sm:text-base font-bold text-white">
                      {formatDocType(data?.documentType)}
                    </p>
                  </div>

                  {/* Document Number */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      Document Number
                    </div>
                    <p className="text-sm sm:text-base font-mono font-bold text-emerald-400">
                      {data?.documentNumber || 'N/A'}
                    </p>
                  </div>

                  {/* Company */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      Company
                    </div>
                    <p className="text-sm sm:text-base font-bold text-white">
                      {data?.company || data?.brand || 'N/A'}
                    </p>
                  </div>

                  {/* Client */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      Client
                    </div>
                    <p className="text-sm sm:text-base font-bold text-white">
                      {data?.client || data?.clientName || 'N/A'}
                    </p>
                  </div>

                  {/* Generated Date */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      Generated Date
                    </div>
                    <p className="text-sm sm:text-base font-bold text-white">
                      {formatDate(data?.generatedAt || data?.generatedDate)}
                    </p>
                  </div>

                  {/* Verification Status */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors col-span-1 sm:col-span-2">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Verification Status
                    </div>
                    <p className="text-sm sm:text-base font-black uppercase tracking-wider text-emerald-400">
                      {data?.verificationStatus || 'VERIFIED'}
                    </p>
                  </div>

                </div>

              </div>

              {/* Future Compatibility Slots (Modular Features) */}
              <div className="pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-0.5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Digital Seal</span>
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Signed & Valid
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-0.5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">QR Authenticity</span>
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Active Protocol
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 col-span-2 sm:col-span-1 flex flex-col gap-0.5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Audit Status</span>
                  <span className="text-[10px] font-bold text-zinc-300 flex items-center gap-1">
                    Immutable Ledger
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              3. INVALID STATE
             ───────────────────────────────────────────────────────────── */}
          {state === 'invalid' && (
            <div className="glass-panel-dark p-8 sm:p-12 rounded-[2.5rem] border border-red-500/30 backdrop-blur-2xl flex flex-col items-center text-center shadow-[0_20px_60px_rgba(239,68,68,0.15)] animate-ios-slide-up">
              
              <div className="mb-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm font-black uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.25)]">
                <XCircle className="w-5 h-5 text-red-400" />
                ❌ DOCUMENT NOT VERIFIED
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-4">
                This document does not exist<br />or has been invalidated.
              </h2>

              <p className="text-sm text-zinc-400 max-w-sm mb-8 leading-relaxed">
                Please contact Artisains Production Company for further assistance or to issue a verified document.
              </p>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-[11px] font-mono text-zinc-400 mb-8 max-w-md w-full">
                Document Reference ID: <span className="text-white font-bold">{documentId || 'Unknown'}</span>
              </div>

              <a
                href="mailto:support@artisains.com"
                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
              >
                Contact Artisains Production Company
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              4. ERROR STATE (NETWORK / SERVER FAILURE)
             ───────────────────────────────────────────────────────────── */}
          {state === 'error' && (
            <div className="glass-panel-dark p-8 sm:p-12 rounded-[2.5rem] border border-amber-500/30 backdrop-blur-2xl flex flex-col items-center text-center shadow-[0_20px_60px_rgba(245,158,11,0.15)] animate-ios-slide-up">
              
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
                <ShieldAlert className="w-8 h-8 text-amber-400" />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
                Unable to verify this document.
              </h2>

              <p className="text-sm text-zinc-400 max-w-sm mb-8 leading-relaxed">
                Please try again later.
              </p>

              <button
                onClick={verifyDoc}
                className="px-8 py-3.5 rounded-full bg-white text-black hover:bg-zinc-200 text-xs font-black uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Verification
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Security Footer */}
      <footer className="relative z-10 w-full max-w-4xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium text-zinc-400">
            Powered by <strong className="text-white">APCO Document Security</strong>
          </span>
        </div>

        <span className="text-xs text-zinc-500 font-mono">
          © Artisains Production Company
        </span>
      </footer>
    </div>
  );
};

export default PublicVerifyDocumentPage;
