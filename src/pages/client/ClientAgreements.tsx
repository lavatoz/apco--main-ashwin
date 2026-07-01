import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileSignature, ShieldCheck, Clock, X, Download, CheckCircle2, 
  FileText, AlertTriangle, Eye, Sparkles, PenTool
} from 'lucide-react';
import type { Client } from '../../types';
import { api } from '../../services/api';
import { generateAgreementPDF } from '../../utils/pdfGenerator';
import { generateTimelineEvent } from '../../utils/workflowUtils';
import { advanceProjectWorkflow } from '../../utils/workflowEngine';
import { useCompanyForClient } from '../../hooks/useCompanySettings';
import ClientPageLoader from './ClientPageLoader';
import { replaceAgreementPlaceholders } from '../../utils/agreementUtils';

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
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

interface ProcessedAgreementCard {
  id: string;
  title: string;
  brand: string;
  type: string;
  version: string;
  assignedAt: string;
  statusLabel: string;
  rawStatus: 'PENDING' | 'SIGNED' | 'EXPIRED' | 'CANCELLED';
  rawItem: any;
}

const ClientAgreements: React.FC<ClientAgreementsProps> = ({ client: initialClient }) => {
  const [client, setClient] = useState<Client | null>(initialClient);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  const [rawAgreements, setRawAgreements] = useState<any[]>([]);
  const [currentAgreement, setCurrentAgreement] = useState<any | null>(null);
  const [agreementSignature, setAgreementSignature] = useState<any | null>(null);
  const [agreementDocuments, setAgreementDocuments] = useState<any[]>([]);
  const [linkedQuote, setLinkedQuote] = useState<any | null>(null);
  const [linkedProject, setLinkedProject] = useState<any | null>(null);
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
      let list = Array.isArray(data) ? [...data] : [];

      // Include client's active agreement snapshot if available and not present in standalone list
      if (client.activeAgreement && !list.some((item: any) => item.id === client.activeAgreement?.templateId || item.linkedQuoteId === client.activeAgreement?.linkedQuoteId)) {
        list.push({
          id: client.activeAgreement.templateId || 'snapshot_agr',
          title: client.activeAgreement.title || 'Service Agreement',
          status: client.activeAgreement.status === 'accepted' ? 'SIGNED' : (client.activeAgreement.status === 'revoked' ? 'REVOKED' : 'PENDING'),
          generatedContent: client.activeAgreement.body || '',
          assignedAt: client.activeAgreement.assignedAt || new Date().toISOString(),
          signedAt: client.activeAgreement.acceptedAt,
          linkedQuoteId: client.activeAgreement.linkedQuoteId,
          version: client.activeAgreement.version || 1,
          isSnapshot: true
        } as any);
      }

      setRawAgreements(list);
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

  // Process and sort agreements list for the Dashboard
  const processedAgreements = useMemo<ProcessedAgreementCard[]>(() => {
    const defaultBrand = settings?.companyName || client?.brand || client?.projectType || 'Aaha Kalyanam';

    const mapped = rawAgreements.map((item: any) => {
      const statusStr = (item.status || '').toUpperCase();
      let rawStatus: 'PENDING' | 'SIGNED' | 'EXPIRED' | 'CANCELLED' = 'PENDING';
      let statusLabel = 'Pending Signature';

      if (statusStr === 'SIGNED' || statusStr === 'ACCEPTED') {
        rawStatus = 'SIGNED';
        statusLabel = 'Signed';
      } else if (statusStr === 'REVOKED' || statusStr === 'CANCELLED') {
        rawStatus = 'CANCELLED';
        statusLabel = 'Cancelled';
      } else if (statusStr === 'EXPIRED') {
        rawStatus = 'EXPIRED';
        statusLabel = 'Expired';
      }

      const versionStr = item.template?.version 
        ? `v${item.template.version}.0` 
        : (item.version ? `v${item.version}.0` : 'v1.0');

      return {
        id: item.id || item.templateId || 'agr_id',
        title: item.title || item.template?.name || 'Wedding Photography & Videography Agreement',
        brand: item.template?.brand || item.brand || defaultBrand,
        type: item.template?.type || item.type || 'Photography & Videography',
        version: versionStr,
        assignedAt: item.assignedAt || item.createdAt || new Date().toISOString(),
        statusLabel,
        rawStatus,
        rawItem: item
      };
    });

    // Order by: 1. Pending Signature first, 2. Newest assigned date, 3. Oldest
    return mapped.sort((a, b) => {
      if (a.rawStatus === 'PENDING' && b.rawStatus !== 'PENDING') return -1;
      if (a.rawStatus !== 'PENDING' && b.rawStatus === 'PENDING') return 1;
      return new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime();
    });
  }, [rawAgreements, settings, client]);

  const pendingAgreements = useMemo(() => {
    return processedAgreements.filter(a => a.rawStatus === 'PENDING');
  }, [processedAgreements]);

  const isSinglePending = pendingAgreements.length === 1;
  const singlePendingAgreement = isSinglePending ? pendingAgreements[0] : null;

  // Open viewer or signature mode for a selected agreement card
  const handleOpenAgreement = async (card: ProcessedAgreementCard, isSigningFocus = false) => {
    const item = card.rawItem;
    setCurrentAgreement(item);
    setIsViewerOpen(true);

    if (isSigningFocus && card.rawStatus === 'PENDING') {
      setSignatureName('');
      setSignatureDataUrl('');
    }

    if (!item.isSnapshot) {
      try {
        const sig = await api.getStandaloneAgreementSignature(item.id);
        setAgreementSignature(sig);

        const docs = await api.getStandaloneAgreementDocuments(item.id);
        setAgreementDocuments(docs);

        if (item.linkedQuoteId) {
          const q = await api.getQuoteById(item.linkedQuoteId);
          setLinkedQuote(q);
          const pId = q?.projectId || q?.project?.id;
          if (pId) {
            const p = await api.getProjectById(pId);
            setLinkedProject(p);
          }
        }
      } catch (err) {
        console.error('Failed to load agreement details', err);
      }
    }
  };

  const displayedAgreementContent = useMemo(() => {
    if (!currentAgreement) return '';
    const content = currentAgreement.generatedContent || currentAgreement.body || '';
    return replaceAgreementPlaceholders(content, {
      client,
      quotation: linkedQuote,
      project: linkedProject,
      agreement: currentAgreement,
      company: settings,
    });
  }, [currentAgreement, client, linkedQuote, linkedProject, settings]);

  if (!client || loading) return <ClientPageLoader />;

  const handleUploadDocument = async () => {
    if (!currentAgreement || !uploadFile || currentAgreement.isSnapshot) return;
    setIsUploadingDoc(true);
    try {
      await api.uploadStandaloneAgreementDocument(currentAgreement.id, uploadDocType, uploadFile);
      setUploadFile(null);
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
    if (!currentAgreement || currentAgreement.isSnapshot) return;
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.deleteStandaloneAgreementDocument(docId);
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
      if (!currentAgreement.isSnapshot) {
        const sig = await api.signStandaloneAgreement(currentAgreement.id, signatureName.trim(), signatureDataUrl);
        setAgreementSignature(sig);
      }

      const timelineEvent = generateTimelineEvent(
        'Agreement Signed',
        `Standalone agreement digitally signed by ${signatureName.trim()}`
      );

      const updatedClient: Client = {
        ...client,
        activeAgreement: currentAgreement.isSnapshot ? {
          ...client.activeAgreement!,
          status: 'accepted',
          acceptedAt: new Date().toISOString()
        } : client.activeAgreement,
        portal: {
          ...client.portal,
          timeline: [...(client.portal?.timeline || []), timelineEvent],
          deliverables: client.portal?.deliverables || [],
          internalSpends: client.portal?.internalSpends || []
        }
      };

      if (currentAgreement.isSnapshot) {
        await api.saveClient(updatedClient);
      }
      
      setClient(updatedClient);

      if (currentAgreement.linkedQuoteId) {
        try {
          const q = await api.getQuoteById(currentAgreement.linkedQuoteId);
          if (q) {
            await api.saveQuote({ ...q, status: 'Approved' });
          }
        } catch (e) {
          console.warn('Quote status sync after agreement sign failed:', e);
        }
      }

      const storedProjects = await api.getProjects();
      const mainProject = storedProjects.find(p => p.clientId === client.id);
      if (mainProject) {
        await advanceProjectWorkflow(mainProject.id, 'Agreement Signed', 'Client digitally signed agreement');
      }

      await fetchStandaloneData();
      setIsViewerOpen(false);
    } catch (err: any) {
      console.error('Failed to sign agreement', err);
      alert(err.message || 'Failed to sign agreement.');
    } finally {
      setIsSigning(false);
    }
  };

  const handleDownloadPDF = async (card?: ProcessedAgreementCard) => {
    const agr = card ? card.rawItem : currentAgreement;
    if (!agr || !settings) return;
    try {
      const linkedQuoteId = agr.linkedQuoteId;
      let quotation: any = null;
      let project: any = null;

      if (linkedQuoteId) {
        quotation = await api.getQuoteById(linkedQuoteId);
        const projectId = quotation?.projectId || quotation?.project?.id;
        if (projectId) {
          project = await api.getProjectById(projectId);
        }
      }

      const pdfAgreementData: any = {
        title: agr.title || 'Service Agreement',
        body: replaceAgreementPlaceholders(agr.generatedContent || agr.body || '', {
          client,
          quotation,
          project,
          agreement: agr,
          company: settings
        }),
        version: Number(agr.template?.version || agr.version || 1),
        assignedAt: agr.assignedAt,
        status: (agr.status || '').toLowerCase(),
        acceptedAt: agr.signedAt || agr.acceptedAt || undefined,
        quotation: {
          clientName: client.name || client.projectName || quotation?.client?.name || 'Valued Client',
          eventName: project?.name || client.projectName || 'Wedding Photography & Videography',
          eventDate: project?.client?.events?.[0]?.date || client?.weddingDate || client?.eventDate || '',
          totalAmount: project?.financials?.total || project?.totalAmount || quotation?.totalAmount || 0,
          advanceAmount: project?.financials?.paid || quotation?.paidAmount || 0,
          balanceAmount: project?.financials?.balance || 0
        }
      };
      await generateAgreementPDF(pdfAgreementData, client, settings);
    } catch (err: any) {
      console.error("Failed to generate Agreement PDF:", err);
      alert(err.message || "Failed to generate Agreement PDF.");
    }
  };

  const getStatusBadgeClass = (statusLabel: string) => {
    switch (statusLabel) {
      case 'Signed':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Cancelled':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'Expired':
        return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
  };

  return (
    <div className="p-8 md:p-12 animate-ios-slide-up max-w-[1400px] mx-auto pb-32">
      {/* Page Header */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <FileSignature className="w-5 h-5" />
            </span>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">Client Portal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Agreement Dashboard</h1>
          <p className="text-lg text-zinc-400 font-medium">Review, Manage & Digitally Confirm Your Production Contracts</p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-3">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Agreements</p>
            <p className="text-xl font-black text-white">{processedAgreements.length}</p>
          </div>
        </div>
      </div>

      {/* REQUIREMENT 4: Single Pending Highlighted Card */}
      {isSinglePending && singlePendingAgreement && (
        <div className="mb-12 glass-panel p-8 md:p-10 squircle-lg border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/[0.05] via-transparent to-primary/[0.02] relative overflow-hidden shadow-2xl animate-ios-slide-up">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="w-48 h-48 text-amber-400" />
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between relative z-10">
            <div className="flex items-start gap-6">
              <div className="p-4 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-md text-[10px] font-black uppercase tracking-widest border border-amber-500/30 animate-pulse">
                    Action Required
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Assigned: {formatDate(singlePendingAgreement.assignedAt)}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
                  {singlePendingAgreement.title}
                </h2>
                <p className="text-sm font-medium text-zinc-400 max-w-xl">
                  Your digital contract for <span className="text-white font-bold">{singlePendingAgreement.brand}</span> requires review and e-signature before production setup can be finalized.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto shrink-0">
              <button
                onClick={() => handleOpenAgreement(singlePendingAgreement, false)}
                className="w-full sm:w-auto px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/10"
              >
                <Eye className="w-4 h-4" /> View Agreement
              </button>
              <button
                onClick={() => handleOpenAgreement(singlePendingAgreement, true)}
                className="w-full sm:w-auto px-8 py-4 bg-primary text-black hover:bg-emerald-400 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95"
              >
                <PenTool className="w-4 h-4" /> Continue Signing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUIREMENTS 2, 3, 5: Agreement Dashboard List/Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-sm font-black uppercase text-zinc-400 tracking-[0.2em]">All Assigned Agreements ({processedAgreements.length})</h2>
          <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Ordered by Status & Recency</span>
        </div>

        {processedAgreements.length === 0 ? (
          <div className="glass-panel p-16 squircle-lg text-center border border-white/5 bg-white/[0.01]">
            <FileSignature className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">No Agreements Provisioned</h3>
            <p className="text-sm font-medium text-zinc-400 max-w-sm mx-auto">
              Your production team will provision digital contracts here when required.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {processedAgreements.map((card) => (
              <div 
                key={card.id} 
                className={`glass-panel p-8 squircle-lg border transition-all duration-300 relative flex flex-col justify-between ${
                  card.rawStatus === 'PENDING' 
                    ? 'border-amber-500/20 bg-white/[0.02] hover:border-amber-500/40' 
                    : 'border-white/5 bg-white/[0.01] hover:border-white/15'
                }`}
              >
                <div className="space-y-6">
                  {/* Card Header Metadata */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-widest">
                        {card.brand}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-white/5 text-zinc-400 text-[9px] font-black uppercase tracking-widest">
                        {card.version}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getStatusBadgeClass(card.statusLabel)}`}>
                      {card.statusLabel}
                    </span>
                  </div>

                  {/* Card Title & Info */}
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2 group-hover:text-primary transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs font-medium text-zinc-400">
                      Assigned on {formatDate(card.assignedAt)}
                    </p>
                  </div>
                </div>

                {/* Card Actions (REQUIREMENT 3) */}
                <div className="pt-8 mt-8 border-t border-white/5 flex items-center justify-end gap-3">
                  {card.rawStatus === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handleOpenAgreement(card, false)}
                        className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-colors flex items-center gap-2 border border-white/10"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Agreement
                      </button>
                      <button
                        onClick={() => handleOpenAgreement(card, true)}
                        className="px-6 py-3 bg-primary text-black hover:bg-emerald-400 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors shadow-lg flex items-center gap-2"
                      >
                        <PenTool className="w-3.5 h-3.5" /> Continue Signing
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleOpenAgreement(card, false)}
                        className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-colors flex items-center gap-2 border border-white/10"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Agreement
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(card)}
                        className="px-5 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors border border-indigo-500/20 flex items-center gap-2"
                      >
                        <Download className="w-3.5 h-3.5" /> Download PDF
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AGREEMENT VIEWER & SIGNING MODAL (REQUIREMENT 6: Preserves all signing/PDF/doc logic) */}
      {isViewerOpen && currentAgreement && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-ios-fade-in">
          <div className="bg-[#09090b] border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-ios-slide-up relative">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.02]">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white mb-1">
                  {currentAgreement.title || 'Agreement Viewer'}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Version {currentAgreement.template?.version || currentAgreement.version || '1.0'}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Assigned: {formatDate(currentAgreement.assignedAt || Date.now())}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {(currentAgreement.status === 'SIGNED' || currentAgreement.status === 'accepted') && (
                  <button 
                    onClick={() => handleDownloadPDF()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-colors text-[10px] font-black uppercase tracking-widest"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
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
                {currentAgreement && !currentAgreement.linkedQuoteId && !currentAgreement.isSnapshot && (
                  <div className="mb-6 p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 mb-1">Legacy Agreement Notice</h4>
                      <p className="text-[11px] font-medium text-zinc-300 leading-normal">
                        This contract operates on legacy standalone parameters. PDF download is available once linked to your primary quotation.
                      </p>
                    </div>
                  </div>
                )}
                <div className="prose prose-invert prose-p:text-zinc-300 prose-p:leading-relaxed prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight max-w-none font-medium whitespace-pre-wrap">
                  {displayedAgreementContent}
                </div>

                {/* Identity Verification Documents Registry inside Modal */}
                {!currentAgreement.isSnapshot && (
                  <div className="space-y-6 mt-12 pt-8 border-t border-white/10">
                    <div className="flex items-center gap-4">
                      <h3 className="text-xs font-black uppercase text-zinc-400 tracking-[0.2em]">Identity Verification Documents ({agreementDocuments.length})</h3>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>

                    {(currentAgreement.status === 'PENDING' || currentAgreement.status === 'pending') && (
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

                    {agreementDocuments.length > 0 && (
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
                              {(currentAgreement.status === 'PENDING' || currentAgreement.status === 'pending') && (
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
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer (Sign or View) */}
            <div className="p-8 border-t border-white/5 bg-black/40 shrink-0">
              <div className="max-w-3xl mx-auto">
                {(currentAgreement.status === 'SIGNED' || currentAgreement.status === 'accepted') ? (
                  <div className="flex items-center justify-between p-6 bg-primary/10 border border-primary/20 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-primary mb-1">Digitally Signed</p>
                        <p className="text-lg font-black text-white">{agreementSignature?.signerName || client.name}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1">
                          {agreementSignature?.signedAt ? formatDate(agreementSignature.signedAt) : (currentAgreement.signedAt ? formatDate(currentAgreement.signedAt) : 'Signature Verified')}
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
                    {!currentAgreement.isSnapshot && agreementDocuments.length === 0 ? (
                      <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 mb-1">Identity Verification Required</h4>
                          <p className="text-[11px] font-medium text-zinc-400 leading-normal">
                            Please upload at least one identity document above (such as Aadhaar, PAN Card, Driving License, or Passport) before you can sign this contract.
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
                      {(currentAgreement.isSnapshot || agreementDocuments.length > 0) && (
                        <button 
                          type="submit"
                          disabled={!signatureName.trim() || !signatureDataUrl || isSigning}
                          className="px-8 py-3 bg-primary hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all font-bold"
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
