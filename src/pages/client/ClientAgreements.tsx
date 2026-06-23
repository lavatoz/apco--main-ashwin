import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FileSignature, ShieldCheck, Clock, X, Download, CheckCircle2, FileText, AlertTriangle } from 'lucide-react';
import type { Client } from '../../types';
import { api } from '../../services/api';
import { generateAgreementPDF } from '../../utils/pdfGenerator';
import { generateTimelineEvent } from '../../utils/workflowUtils';
import { advanceProjectWorkflow } from '../../utils/workflowEngine';
import { useCompanyForClient } from '../../hooks/useCompanySettings';
import ClientPageLoader from './ClientPageLoader';


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

// Custom Signature Pad Canvas Component
interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set styling for signatures (white ink on black canvas)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Adapt coordinates relative to scale factors of canvas bounding box
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSave('');
  };

  return (
    <div className="space-y-2">
      <div className="border border-white/10 rounded-xl overflow-hidden bg-black/40">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-[200px] cursor-crosshair touch-none"
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Draw your signature above</span>
        <button
          type="button"
          onClick={clearCanvas}
          className="px-3 py-1 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-md text-[10px] font-black uppercase tracking-widest transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

const SecureSignatureImage: React.FC<{ agreementId: string; className?: string }> = ({ agreementId, className }) => {
  const [src, setSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    const load = async () => {
      try {
        const blob = await api.getStandaloneAgreementSignatureImageBlob(agreementId);
        if (active) {
          objectUrl = URL.createObjectURL(blob);
          setSrc(objectUrl);
        }
      } catch (err) {
        console.error("Failed to load signature image", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [agreementId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-2">
        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest animate-pulse">Loading...</span>
      </div>
    );
  }

  if (!src) {
    return (
      <div className="flex items-center justify-center p-2 border border-white/5 bg-zinc-950/20 rounded-xl">
        <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">N/A</span>
      </div>
    );
  }

  return <img src={src} alt="Client Signature" className={className} />;
};

interface ClientAgreementsProps {

  client: Client | null;
}

const ClientAgreements: React.FC<ClientAgreementsProps> = ({ client: initialClient }) => {
  const [client, setClient] = useState<Client | null>(initialClient);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  const [currentAgreement, setCurrentAgreement] = useState<any | null>(null);
  const [agreementSignature, setAgreementSignature] = useState<any | null>(null);
  const [agreementDocuments, setAgreementDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Document upload state
  const [uploadDocType, setUploadDocType] = useState('AADHAAR');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const fetchStandaloneData = async () => {
    if (!client) return;
    setLoading(true);
    try {
      const data = await api.getClientStandaloneAgreement(client.id);
      const latest = data[0] || null;
      setCurrentAgreement(latest);

      if (latest) {
        // Fetch signature if available
        const sig = await api.getStandaloneAgreementSignature(latest.id);
        setAgreementSignature(sig);

        // Fetch documents
        const docs = await api.getStandaloneAgreementDocuments(latest.id);
        setAgreementDocuments(docs);
      }
    } catch (err) {
      console.error('Failed to fetch standalone agreements data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandaloneData();
  }, [client?.id]);

  const settings = useCompanyForClient(client);

  if (!client) return <ClientPageLoader />;
  if (loading) return <ClientPageLoader />;

  const handleUploadDocument = async () => {
    if (!currentAgreement || !uploadFile) return;
    setIsUploadingDoc(true);
    try {
      await api.uploadStandaloneAgreementDocument(currentAgreement.id, uploadDocType, uploadFile);
      setUploadFile(null);
      // Reload documents list
      const docs = await api.getStandaloneAgreementDocuments(currentAgreement.id);
      setAgreementDocuments(docs);
    } catch (err: any) {
      console.error('Failed to upload document', err);
      alert(err.message || 'Failed to upload document.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!currentAgreement) return;
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.deleteStandaloneAgreementDocument(docId);
      // Reload documents list
      const docs = await api.getStandaloneAgreementDocuments(currentAgreement.id);
      setAgreementDocuments(docs);
    } catch (err: any) {
      console.error('Failed to delete document', err);
      alert(err.message || 'Failed to delete document.');
    }
  };

  const handleSignAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAgreement || !signatureName.trim() || !signatureDataUrl) return;

    setIsSigning(true);
    try {
      // 1. Submit signature
      const sig = await api.signStandaloneAgreement(currentAgreement.id, signatureName.trim(), signatureDataUrl);
      setAgreementSignature(sig);

      const timelineEvent = generateTimelineEvent(
        'Agreement Signed',
        `Standalone agreement digitally signed by ${signatureName.trim()}`
      );

      const updatedClient: Client = {
        ...client,
        portal: {
          ...client.portal,
          timeline: [...(client.portal?.timeline || []), timelineEvent],
          deliverables: client.portal?.deliverables || [],
          internalSpends: client.portal?.internalSpends || []
        }
      };
      
      // Update local client states
      setClient(updatedClient);

      // 3. Advancing the project workflow if it exists and is at stage "Booked"
      const storedProjects = await api.getProjects();
      const mainProject = storedProjects.find(p => p.clientId === client.id);
      if (mainProject) {
        await advanceProjectWorkflow(mainProject.id, 'Agreement Signed', 'Client digitally signed standalone agreement');
      }

      // Reload standalone agreements layout
      await fetchStandaloneData();
      setIsViewerOpen(false);
    } catch (err: any) {
      console.error('Failed to sign standalone agreement', err);
      alert(err.message || 'Failed to sign agreement.');
    } finally {
      setIsSigning(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!currentAgreement || !settings) return;
    const pdfAgreementData: any = {
      title: currentAgreement.title,
      body: currentAgreement.generatedContent,
      version: Number(currentAgreement.template?.version || 1),
      assignedAt: currentAgreement.assignedAt,
      status: currentAgreement.status.toLowerCase(),
      acceptedAt: currentAgreement.signedAt || undefined,
    };
    await generateAgreementPDF(pdfAgreementData, client, settings);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'SIGNED':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'REVOKED':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
  };

  return (
    <div className="p-8 md:p-12 animate-ios-slide-up max-w-[1400px] mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Agreements</h1>
        <p className="text-xl text-zinc-400 font-medium">Legal Contracts & Terms</p>
      </div>

      <div className="glass-panel p-10 squircle-lg max-w-4xl relative overflow-hidden">
        {currentAgreement ? (
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="flex items-start gap-6 relative z-10">
              <div className={`p-4 rounded-2xl ${currentAgreement.status === 'SIGNED' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-500'}`}>
                {currentAgreement.status === 'SIGNED' ? <ShieldCheck className="w-8 h-8" /> : <Clock className="w-8 h-8 animate-pulse" />}
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-2">{currentAgreement.title || 'Project Agreement'}</h3>
                <p className="text-sm font-medium text-zinc-400 mb-4">
                  {currentAgreement.status === 'SIGNED' 
                    ? `Signed electronically on ${currentAgreement.signedAt ? new Date(currentAgreement.signedAt).toLocaleDateString('en-GB') : 'N/A'}` 
                    : 'Requires your digital signature to proceed.'}
                </p>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${getStatusBadgeClass(currentAgreement.status)}`}>
                   <span>{currentAgreement.status}</span>
                </div>
              </div>
            </div>
            <div className="w-full md:w-auto relative z-10">
              {currentAgreement.status === 'SIGNED' ? (
                <button 
                  onClick={() => setIsViewerOpen(true)}
                  className="w-full px-8 py-4 bg-white/10 text-white hover:bg-white/20 transition-all font-bold text-xs uppercase tracking-widest rounded-xl"
                >
                  View Agreement
                </button>
              ) : (
                <button 
                  onClick={() => setIsViewerOpen(true)}
                  className="w-full px-8 py-4 bg-white text-black hover:bg-zinc-200 transition-all font-bold text-xs uppercase tracking-widest rounded-xl shadow-xl flex items-center justify-center gap-2"
                >
                  <FileSignature className="w-4 h-4" /> Review & Sign
                </button>
              )}
            </div>
            
            {currentAgreement.status === 'SIGNED' && (
              <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none">
                <ShieldCheck className="w-64 h-64" />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 relative z-10">
            <FileSignature className="w-16 h-16 text-zinc-600 mx-auto mb-6" />
            <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">No Active Agreements</h3>
            <p className="text-sm font-medium text-zinc-400 max-w-sm mx-auto">Your production team will provision a digital contract here when required.</p>
          </div>
        )}
      </div>

      {/* Uploaded Identity Verification Documents Registry */}
      {currentAgreement && (
        <div className="space-y-6 max-w-4xl mt-12 animate-ios-slide-up">
          <div className="flex items-center gap-4 px-2">
            <h2 className="text-sm font-black uppercase text-zinc-400 tracking-[0.2em]">Identity Documents ({agreementDocuments.length})</h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          {/* Upload Form (only if agreement is PENDING) */}
          {currentAgreement.status === 'PENDING' && (
            <div className="glass-panel p-6 border border-white/5 rounded-2xl bg-white/[0.01] flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Document Type</label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full bg-[#1c1c1e] border border-white/10 rounded-xl p-3 text-white font-bold focus:border-white/30 focus:outline-none transition-colors text-sm uppercase"
                >
                  <option value="AADHAAR">Aadhaar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="DRIVING_LICENSE">Driving License</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="OTHER">Other ID Proof</option>
                </select>
              </div>

              <div className="flex-1 w-full space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Select File (PDF, JPG, PNG)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white focus:outline-none transition-colors text-sm file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-black hover:file:bg-emerald-600 cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={handleUploadDocument}
                disabled={!uploadFile || isUploadingDoc}
                className="w-full sm:w-auto px-8 py-3 bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-xs uppercase tracking-widest rounded-xl shadow-xl shrink-0"
              >
                {isUploadingDoc ? 'Uploading...' : 'Upload ID'}
              </button>
            </div>
          )}

          {/* Documents list */}
          {agreementDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agreementDocuments.map((doc: any) => (
                <div key={doc.id} className="p-5 glass-panel border border-white/5 rounded-2xl flex items-center justify-between gap-4 bg-white/[0.01]">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-white truncate uppercase tracking-wider mb-1">
                        {doc.documentType.replace('_', ' ')}
                      </h4>
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                        Uploaded {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => api.downloadStandaloneAgreementDocument(doc.id, `${doc.documentType.toLowerCase()}.pdf`)}
                      className="p-3 bg-white/5 hover:bg-white text-zinc-400 hover:text-black rounded-xl transition-all border border-white/10"
                      title="Download document"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {currentAgreement.status === 'PENDING' && (
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-3 bg-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded-xl transition-all border border-white/10"
                        title="Delete document"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white/[0.01] border border-white/5 rounded-2xl">
              <p className="text-xs text-zinc-500 font-medium">No identity documents uploaded yet.</p>
            </div>
          )}
        </div>
      )}

      {/* AGREEMENT VIEWER MODAL */}
      {isViewerOpen && currentAgreement && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-ios-fade-in">
          <div className="bg-[#09090b] border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-ios-slide-up relative">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.02]">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white mb-1">{currentAgreement.title || 'Agreement Viewer'}</h2>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Version {currentAgreement.template?.version || '1.0'}</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Assigned: {new Date(currentAgreement.assignedAt || Date.now()).toLocaleDateString('en-GB')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {currentAgreement.status === 'SIGNED' && (
                  <button 
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-colors text-[10px] font-black uppercase tracking-widest"
                  >
                    <Download className="w-3 h-3" /> Download PDF
                  </button>
                )}
                <button 
                  onClick={() => setIsViewerOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body (Agreement Text) */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-black/20">
              <div className="max-w-3xl mx-auto">
                <div className="prose prose-invert prose-p:text-zinc-300 prose-p:leading-relaxed prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight max-w-none font-medium whitespace-pre-wrap">
                  {currentAgreement.generatedContent}
                </div>
              </div>
            </div>

            {/* Modal Footer (Sign or View) */}
            <div className="p-8 border-t border-white/5 bg-black/40 shrink-0">
              <div className="max-w-3xl mx-auto">
                {currentAgreement.status === 'SIGNED' ? (
                  <div className="flex items-center justify-between p-6 bg-primary/10 border border-primary/20 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-primary mb-1">Digitally Signed</p>
                        <p className="text-lg font-black text-white">{agreementSignature?.signerName}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1">
                          {agreementSignature?.signedAt ? new Date(agreementSignature.signedAt).toLocaleString('en-GB') : ''}
                        </p>
                      </div>
                    </div>
                    {agreementSignature?.signatureImageUrl && (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2 shrink-0">
                        <SecureSignatureImage 
                          agreementId={currentAgreement.id}
                          className="max-h-12 w-auto filter invert brightness-200"
                        />
                      </div>
                    )}

                  </div>
                ) : (
                  <form onSubmit={handleSignAgreement} className="space-y-6">
                    {agreementDocuments.length === 0 ? (
                      <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 mb-1">Identity Verification Required</h4>
                          <p className="text-[11px] font-medium text-zinc-400 leading-normal">
                            Please upload at least one identity document (such as Aadhaar, PAN Card, Driving License, or Passport) on the main Agreements screen before you can sign this contract.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-white mb-2">Electronic Signature</h4>
                            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-4">
                              By typing your full legal name below, you agree to the terms outlined in this contract.
                            </p>
                            <input 
                              type="text" 
                              required
                              placeholder="Type your full legal name"
                              value={signatureName}
                              onChange={(e) => setSignatureName(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold text-lg focus:border-white/30 focus:outline-none transition-colors"
                            />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-widest text-white mb-2">Draw Signature</h4>
                          <SignaturePad onSave={setSignatureDataUrl} />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end gap-4 mt-6">
                      <button 
                        type="button"
                        onClick={() => setIsViewerOpen(false)}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                      >
                        Cancel
                      </button>
                      {agreementDocuments.length > 0 && (
                        <button 
                          type="submit"
                          disabled={!signatureName.trim() || !signatureDataUrl || isSigning}
                          className="px-8 py-3 bg-primary hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all"
                        >
                          {isSigning ? (
                            <>Processing...</>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" /> Sign Agreement
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ClientAgreements;
