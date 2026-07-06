import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Download, Loader, Lock, Unlock, Layers, Edit3, Send, X, AlertTriangle } from 'lucide-react';
import { api, getAccessToken, API_URL } from '../../services/api';
import type { Project } from '../../types';

const GALLERY_STATUS_ORDER = [
  'UPLOADED',
  'SELECTION_IN_PROGRESS',
  'SELECTION_SUBMITTED',
  'READY_FOR_EDITING',
  'EDITING',
  'EDITED',
  'DELIVERED'
];

const getStatusLabel = (s: string) => {
  switch (s) {
    case 'UPLOADED': return 'Gallery Uploaded';
    case 'SELECTION_IN_PROGRESS': return 'Selection In Progress';
    case 'SELECTION_SUBMITTED': return 'Selection Submitted';
    case 'READY_FOR_EDITING': return 'Ready for Editing';
    case 'EDITING': return 'Editing';
    case 'EDITED': return 'Edited';
    case 'DELIVERED': return 'Completed';
    default: return s;
  }
};

const ProjectSelectionsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'selection' | 'editing' | 'album' | 'delivery'>('selection');

  // Active Project Data
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Gallery status & counts
  const [status, setStatus] = useState<string>('UPLOADED');
  const [locked, setLocked] = useState(false);
  const [updatingLock, setUpdatingLock] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Lightbox
  const [previewPhoto, setPreviewPhoto] = useState<any | null>(null);

  const accessToken = getAccessToken();

  // Load projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.getProjects();
        setProjects(data || []);
      } catch (err) {
        console.error("Failed to load projects", err);
      }
    };
    fetchProjects();
  }, []);

  // Fetch only selected photos for the active project
  useEffect(() => {
    const fetchSelectionPhotos = async () => {
      if (!selectedProjectId) return;
      setLoading(true);
      try {
        // Fetch with favoritesOnly = true
        const res = await api.getProjectGalleryPhotos(selectedProjectId, 1, 100, true);
        setStatus(res.status);
        setLocked(res.selectionLocked);
        setSelectedCount(res.selectedCount);
        setReviewedCount(res.reviewedCount);
        setTotalCount(res.totalCount);
        setPhotos(res.photos || []);
      } catch (err) {
        console.error("Failed to load selections", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSelectionPhotos();
  }, [selectedProjectId]);

  const activeProject = projects.find(p => p.id === selectedProjectId) || null;

  // Status transitions
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedProjectId || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await api.updateGalleryStatus(selectedProjectId, newStatus);
      setStatus(res.status);
      setLocked(res.selectionLocked);
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleToggleLock = async () => {
    if (!selectedProjectId || updatingLock) return;
    setUpdatingLock(true);
    const targetStatus = locked ? 'SELECTION_IN_PROGRESS' : 'SELECTION_SUBMITTED';
    try {
      const res = await api.updateGalleryStatus(selectedProjectId, targetStatus);
      setStatus(res.status);
      setLocked(res.selectionLocked);
    } catch (err: any) {
      console.error("Lock/Unlock toggle error:", err);
      setToastMessage(locked ? 'Failed to unlock gallery.' : 'Failed to lock gallery.');
    } finally {
      setUpdatingLock(false);
    }
  };

  // ZIP download handler
  const handleDownloadZip = async () => {
    if (!selectedProjectId || !activeProject || downloading) return;
    setDownloading(true);
    try {
      await api.downloadSelectedPhotosZip(selectedProjectId, activeProject.name);
    } catch (err: any) {
      alert("ZIP preparation failed: " + (err.message || "Server error"));
    } finally {
      setDownloading(false);
    }
  };

  // Landing View: Project List & Manage Selection buttons
  if (!selectedProjectId) {
    return (
      <div className="space-y-8 animate-ios-slide-up max-w-[1600px] mx-auto pb-24">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
            Client Selections
          </h1>
          <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] mt-2">
            Review and manage client selection progress
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {projects.map((p) => (
            <div key={p.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-white/[0.04] transition-all">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[8px] font-black uppercase tracking-widest text-zinc-500">
                    {p.brand || 'APCO'}
                  </span>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                    Client: {(p as any).client?.name || 'Unknown'}
                  </span>
                </div>
                <h4 className="text-lg font-black uppercase text-white tracking-tight">{p.name}</h4>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setSelectedProjectId(p.id)}
                  className="touch-target px-6 py-3 bg-white text-black hover:bg-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Manage Selection
                </button>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
              <ImageIcon className="w-12 h-12 text-zinc-800 mx-auto mb-4 animate-pulse" />
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                No Projects Found
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Detailed workflow view (renders after selecting a project)
  return (
    <div className="space-y-8 animate-ios-slide-up max-w-[1600px] mx-auto pb-24">
      {toastMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[300] bg-red-950/90 border border-red-500/20 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-ios-slide-up backdrop-blur-xl">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-xs font-black uppercase tracking-wider text-red-200">{toastMessage}</span>
        </div>
      )}
      {/* Header and Back Button */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
            {activeProject?.name || 'Gallery Curation'}
          </h1>
          <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] mt-2">
             Curation Workflow Control Panel
          </p>
        </div>

        <button
          onClick={() => setSelectedProjectId('')}
          className="touch-target px-5 py-3 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
        >
          &larr; Back to Projects
        </button>
      </div>

      {/* Sub-Tab Navigation (Future-Proof Structure) */}
      <div className="flex items-center gap-2 border-b border-white/5 overflow-x-auto no-scrollbar pb-2">
        {[
          { id: 'selection', label: 'Client Selection', icon: ImageIcon, enabled: true },
          { id: 'editing', label: 'Editing Progress', icon: Edit3, enabled: false },
          { id: 'album', label: 'Album Progress', icon: Layers, enabled: false },
          { id: 'delivery', label: 'Delivery Progress', icon: Send, enabled: false }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              disabled={!tab.enabled}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`touch-target px-6 py-3 rounded-t-2xl font-black uppercase text-[10px] tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? 'bg-zinc-900 text-white border-t border-x border-white/5 shadow-md z-10'
                  : tab.enabled
                  ? 'text-zinc-600 hover:text-zinc-300 hover:bg-white/5 border-t border-x border-transparent'
                  : 'text-zinc-800 cursor-not-allowed opacity-30'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {!tab.enabled && <span className="text-[7px] text-zinc-600 lowercase border border-white/10 px-1 rounded">future</span>}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader className="w-8 h-8 text-zinc-700 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Summary dashboard and actions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-8 squircle-lg border border-white/5 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-3">
                Workflow Overview
              </h3>

              {/* Progress Stepper */}
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Curation Status</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="text-sm font-black uppercase tracking-wider text-white">
                      {getStatusLabel(status)}
                    </span>
                  </div>
                </div>

                {/* Stage Progression Selector */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                    Progress Workflow Status
                  </label>
                  <div className="relative">
                    <select
                      value={status}
                      disabled={updatingStatus}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-white/20 transition-all appearance-none"
                    >
                      {GALLERY_STATUS_ORDER.map(s => {
                        const isCurrent = s === status;
                        const isNext = GALLERY_STATUS_ORDER.indexOf(s) === GALLERY_STATUS_ORDER.indexOf(status) + 1;
                        return (
                          <option key={s} value={s} disabled={!isCurrent && !isNext} className="bg-zinc-950">
                            {getStatusLabel(s)} {isCurrent ? '(Current)' : isNext ? '(Next Allowed)' : '(Locked)'}
                          </option>
                        );
                      })}
                    </select>
                    {updatingStatus && (
                      <div className="absolute inset-y-0 right-4 flex items-center">
                        <Loader className="w-4 h-4 text-zinc-500 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest mb-1">Reviewed</p>
                  <p className="text-lg font-black text-indigo-400">{reviewedCount} / {totalCount}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest mb-1">Selected</p>
                  <p className="text-lg font-black text-rose-500">{selectedCount}</p>
                </div>
              </div>

              {/* Download selected ZIP */}
              {selectedCount > 0 && (
                <button
                  onClick={handleDownloadZip}
                  disabled={downloading}
                  className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {downloading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Compiling ZIP...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download Selected ZIP
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Gallery Control Section */}
            <div className="glass-panel p-8 squircle-lg border border-white/5 space-y-6">
              <div className="border-b border-white/5 pb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">
                  Client Gallery
                </h3>
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-wider mt-1">Access Control</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Selection Status</span>
                  <span className="text-xs font-black uppercase text-white">{getStatusLabel(status)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Gallery Access</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider ${
                    locked 
                      ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    {locked ? (
                      <>
                        <Lock className="w-3 h-3 text-red-400" />
                        Locked
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Open for Client
                      </>
                    )}
                  </span>
                </div>

                <button
                  onClick={handleToggleLock}
                  disabled={updatingLock || loading}
                  className={`touch-target w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 border ${
                    locked
                      ? 'bg-emerald-500 border-emerald-500 text-black hover:bg-emerald-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                  }`}
                >
                  {updatingLock ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : locked ? (
                    <>
                      <Unlock className="w-4 h-4" />
                      Unlock Gallery
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Lock Gallery
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Grid of client selected photos */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-8 squircle-lg border border-white/5 space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="text-xs font-black uppercase text-zinc-500 tracking-[0.2em]">
                  Client Selections List
                </h3>
                <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2.5 py-1 rounded-lg">
                  {photos.length} photos selected
                </span>
              </div>

              {photos.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                  <Lock className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                    Awaiting Client Selections Submission
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-950 border border-white/[0.03] hover:border-indigo-500/50 transition-all duration-300 shadow-md cursor-pointer"
                      onClick={() => setPreviewPhoto(photo)}
                    >
                      <img
                        src={`${API_URL}/files/${photo.fileId}/thumbnail?token=${accessToken}`}
                        alt={photo.fileName}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Dark overlay showing filename on bottom */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                      
                      {/* Filename is rendered prominently on hover for staff editing operations */}
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <p className="text-[9px] font-mono font-black text-white uppercase tracking-wider truncate" title={photo.fileName}>
                          {photo.fileName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 md:p-16 animate-ios-slide-up"
          onClick={() => setPreviewPhoto(null)}
        >
          <button
            className="absolute top-8 right-8 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all z-[210] border border-white/10"
            onClick={() => setPreviewPhoto(null)}
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative w-full max-w-5xl h-full flex flex-col items-center justify-center gap-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded-3xl border border-white/5 bg-zinc-950/50 shadow-2xl">
              <img
                src={`${API_URL}/files/${previewPhoto.fileId}/thumbnail?token=${accessToken}`}
                alt={previewPhoto.fileName}
                className="max-w-full max-h-full object-contain animate-ios-zoom-in"
              />
            </div>

            <div className="flex items-center justify-between w-full max-w-2xl px-4">
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest truncate max-w-md">
                Filename: {previewPhoto.fileName}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSelectionsPage;
