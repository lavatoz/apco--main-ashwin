import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileSignature, ShieldCheck, Clock, X, Download, CheckCircle2, FileText } from 'lucide-react';
import type { Client } from '../../types';
import { api } from '../../services/api';
import { generateAgreementPDF } from '../../utils/pdfGenerator';
import { generateTimelineEvent } from '../../utils/workflowUtils';
import { advanceProjectWorkflow } from '../../utils/workflowEngine';
import { useCompanyForClient } from '../../hooks/useCompanySettings';
import ClientPageLoader from './ClientPageLoader';

const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

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

interface ClientAgreementsProps {
  client: Client | null;
}

const ClientAgreements: React.FC<ClientAgreementsProps> = ({ client: initialClient }) => {
  const [client, setClient] = useState<Client | null>(initialClient);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  
  const [agreementFiles, setAgreementFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  useEffect(() => {
    const fetchAgreements = async () => {
      if (!client) return;
      setLoadingFiles(true);
      try {
        const allProjects = await api.getProjects();
        const clientProjects = allProjects.filter(p => p.clientId === client.id);
        const mainProject = clientProjects[0];
        if (mainProject) {
          const filesData = await api.getFilesByProject(mainProject.id, 'Agreements');
          setAgreementFiles(filesData || []);
        }
      } catch (err) {
        console.error("Failed to fetch agreement files", err);
      } finally {
        setLoadingFiles(false);
      }
    };
    fetchAgreements();
  }, [client?.id]);

  const settings = useCompanyForClient(client);

  if (!client) return <ClientPageLoader />;

  const agreement = client.activeAgreement;

  const handleAcceptAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreement || !signatureName.trim()) return;

    setIsSigning(true);
    try {
      const timestamp = new Date().toISOString();
      const updatedAgreement = {
        ...agreement,
        status: 'accepted' as const,
        acceptedAt: timestamp
      };

      const timelineEvent = generateTimelineEvent(
        'Agreement Signed',
        `Electronically signed by ${signatureName.trim()}`
      );

      const updatedClient: Client = {
        ...client,
        activeAgreement: updatedAgreement,
        portal: {
          ...client.portal,
          timeline: [...(client.portal?.timeline || []), timelineEvent],
          deliverables: client.portal?.deliverables || [],
          internalSpends: client.portal?.internalSpends || []
        }
      };

      // 1. Save to backend
      await api.saveClient(updatedClient);
      
      // 2. Update local state
      setClient(updatedClient);

      // 3. Update project workflow if it's currently at "Booked"
      const storedProjects = await api.getProjects();
      const mainProject = storedProjects.find(p => p.clientId === client.id);
      if (mainProject) {
        await advanceProjectWorkflow(mainProject.id, 'Agreement Signed', 'Client digitally signed agreement');
      }
      
      setIsViewerOpen(false);
    } catch (err) {
      console.error('Failed to sign agreement', err);
    } finally {
      setIsSigning(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!agreement || !settings) return;
    await generateAgreementPDF(agreement, client, settings);
  };

  return (
    <div className="p-8 md:p-12 animate-ios-slide-up max-w-[1400px] mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Agreements</h1>
        <p className="text-xl text-zinc-400 font-medium">Legal Contracts & Terms</p>
      </div>

      <div className="glass-panel p-10 squircle-lg max-w-4xl relative overflow-hidden">
        {agreement ? (
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="flex items-start gap-6 relative z-10">
              <div className={`p-4 rounded-2xl ${agreement.status === 'accepted' ? 'bg-primary/10 text-primary' : 'bg-primary/10 text-primary'}`}>
                {agreement.status === 'accepted' ? <ShieldCheck className="w-8 h-8" /> : <Clock className="w-8 h-8 animate-pulse" />}
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-2">{agreement.title || 'Project Agreement'}</h3>
                <p className="text-sm font-medium text-zinc-400 mb-4">
                  {agreement.status === 'accepted' 
                    ? `Signed electronically on ${agreement.acceptedAt ? new Date(agreement.acceptedAt).toLocaleDateString('en-GB') : 'N/A'}` 
                    : 'Requires your digital signature to proceed.'}
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-md">
                   <span className={`w-2 h-2 rounded-full ${agreement.status === 'accepted' ? 'bg-primary' : 'bg-primary'}`}></span>
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Version {agreement.version}</span>
                </div>
              </div>
            </div>
            <div className="w-full md:w-auto relative z-10">
              {agreement.status === 'accepted' ? (
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
            
            {agreement.status === 'accepted' && (
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

      {/* Uploaded Agreements Registry */}
      {loadingFiles ? (
        <div className="py-12 flex flex-col items-center justify-center max-w-4xl mt-12 bg-white/[0.01] border border-white/5 rounded-2xl">
          <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Retrieving documents...</p>
        </div>
      ) : agreementFiles.length > 0 ? (
        <div className="space-y-6 max-w-4xl mt-12">
          <div className="flex items-center gap-4 px-2">
            <h2 className="text-sm font-black uppercase text-zinc-400 tracking-[0.2em]">Agreement Documents ({agreementFiles.length})</h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agreementFiles.map((file: any) => (
              <div key={file.id} className="p-5 glass-panel border border-white/5 rounded-2xl flex items-center justify-between gap-4 bg-white/[0.01]">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-white truncate uppercase tracking-wider mb-1" title={file.fileName}>{file.fileName}</h4>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                      {formatBytes(file.size || 0)} • {formatDate(file.uploadedAt)}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => api.downloadProjectFile(file.id, file.fileName)}
                  className="p-3 bg-white/5 hover:bg-white text-zinc-400 hover:text-black rounded-xl transition-all border border-white/10 shrink-0"
                  title="Download Contract"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* AGREEMENT VIEWER MODAL */}
      {isViewerOpen && agreement && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-ios-fade-in">
          <div className="bg-[#09090b] border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-ios-slide-up relative">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.02]">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white mb-1">{agreement.title || 'Agreement Viewer'}</h2>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Version {agreement.version}</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Assigned: {new Date(agreement.assignedAt || Date.now()).toLocaleDateString('en-GB')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {agreement.status === 'accepted' && (
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
                  {agreement.body}
                </div>
              </div>
            </div>

            {/* Modal Footer (Sign or View) */}
            <div className="p-8 border-t border-white/5 bg-black/40 shrink-0">
              <div className="max-w-3xl mx-auto">
                {agreement.status === 'accepted' ? (
                  <div className="flex items-center justify-between p-6 bg-primary/10 border border-primary/20 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-primary mb-1">Electronically Signed</p>
                        <p className="text-lg font-black text-white">{client.name || client.projectName}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1">
                          {new Date(agreement.acceptedAt!).toLocaleString('en-GB')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleAcceptAgreement} className="space-y-6">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-white mb-2">Electronic Signature</h4>
                      <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-4">
                        By typing your full name below, you electronically sign and agree to the terms outlined above.
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
                    <div className="flex justify-end gap-4">
                      <button 
                        type="button"
                        onClick={() => setIsViewerOpen(false)}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={!signatureName.trim() || isSigning}
                        className="px-8 py-3 bg-primary hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all"
                      >
                        {isSigning ? (
                          <>Processing...</>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" /> Accept Agreement
                          </>
                        )}
                      </button>
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

