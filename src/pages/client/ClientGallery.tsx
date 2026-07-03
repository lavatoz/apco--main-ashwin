import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Image as ImageIcon, Heart, Check, Loader, X, Send, AlertTriangle } from 'lucide-react';
import type { Client, Project } from '../../types';
import { api, getAccessToken, API_URL } from '../../services/api';
import ClientPageLoader from './ClientPageLoader';

interface ClientGalleryProps {
  client: Client | null;
}

const ClientGallery: React.FC<ClientGalleryProps> = ({ client }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  
  // Progress & Workflow details
  const [status, setStatus] = useState<string>('UPLOADED');
  const [locked, setLocked] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // UI state
  const [savingId, setSavingId] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<any | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const accessToken = getAccessToken();

  // Load project initially
  useEffect(() => {
    const fetchProject = async () => {
      if (!client) return;
      try {
        const allProjects = await api.getProjects();
        const clientProjects = allProjects.filter(p => p.clientId === client.id);
        const mainProject = clientProjects[0];
        if (mainProject) {
          setProject(mainProject);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load client project", err);
        setLoading(false);
      }
    };
    fetchProject();
  }, [client]);

  // Fetch photos whenever tab, page, or project changes
  const fetchPhotos = useCallback(async (isInitial = false) => {
    if (!project) return;
    
    if (isInitial) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentPage = isInitial ? 1 : page;
      const res = await api.getProjectGalleryPhotos(project.id, currentPage, 40, activeTab === 'favorites');
      
      setStatus(res.status);
      setLocked(res.selectionLocked);
      setSelectedCount(res.selectedCount);
      setReviewedCount(res.reviewedCount);
      setTotalCount(res.totalCount);

      if (isInitial) {
        setPhotos(res.photos || []);
      } else {
        setPhotos(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPhotos = (res.photos || []).filter((p: any) => !existingIds.has(p.id));
          return [...prev, ...newPhotos];
        });
      }
      setHasMore(currentPage < res.totalPages);
    } catch (err) {
      console.error("Failed to load gallery photos", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [project, page, activeTab]);

  useEffect(() => {
    if (project) {
      fetchPhotos(true);
    }
  }, [project, activeTab]);

  // Trigger page change when scrolled to bottom (infinite scroll)
  const lastPhotoElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });

    if (node) observerRef.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  // Load next page
  useEffect(() => {
    if (page > 1 && project) {
      fetchPhotos(false);
    }
  }, [page]);

  // Toggle favorite
  const handleToggleFavorite = async (photo: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (locked || savingId) return;
    setSavingId(photo.id);
    try {
      const res = await api.toggleFavoritePhoto(project!.id, photo.id);
      
      // Update local state
      setPhotos(prev => prev.map(p => {
        if (p.id === photo.id) {
          return {
            ...p,
            isFavorite: res.favorited,
            isReviewed: true // favorited implies reviewed
          };
        }
        return p;
      }));

      // Adjust counts
      setSelectedCount(prev => res.favorited ? prev + 1 : prev - 1);
      if (!photo.isReviewed) {
        setReviewedCount(prev => prev + 1);
      }
      if (status === 'UPLOADED') {
        setStatus('SELECTION_IN_PROGRESS');
      }
    } catch (err) {
      console.error("Failed to toggle favorite", err);
    } finally {
      setSavingId(null);
    }
  };

  // Toggle review (checkmark)
  const handleToggleReview = async (photo: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (locked || savingId || photo.isFavorite) return; // selections are always reviewed
    setSavingId(photo.id);
    try {
      const res = await api.togglePhotoReviewState(project!.id, photo.id);
      
      // Update local state
      setPhotos(prev => prev.map(p => {
        if (p.id === photo.id) {
          return {
            ...p,
            isReviewed: res.reviewed
          };
        }
        return p;
      }));

      // Adjust reviewed count
      setReviewedCount(prev => res.reviewed ? prev + 1 : prev - 1);
      if (status === 'UPLOADED') {
        setStatus('SELECTION_IN_PROGRESS');
      }
    } catch (err) {
      console.error("Failed to toggle review", err);
    } finally {
      setSavingId(null);
    }
  };

  // Submit selections
  const handleSubmitSelection = async () => {
    if (!project) return;
    setSubmitting(true);
    try {
      const res = await api.submitPhotoSelection(project.id);
      setLocked(res.selectionLocked);
      setStatus(res.status);
      setShowConfirmModal(false);
    } catch (err) {
      console.error("Failed to submit selection", err);
      alert("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!client || loading) return <ClientPageLoader />;

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

  return (
    <div className="p-8 md:p-12 animate-ios-slide-up max-w-[1400px] mx-auto space-y-8">
      {/* Header and status display */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Gallery</h1>
          <p className="text-xl text-zinc-400 font-medium">Curated Asset Collections</p>
        </div>
        
        {/* Pipeline Status Stepper */}
        <div className="flex flex-col items-end gap-2">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 px-4 py-2 rounded-2xl border border-purple-500/20">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">
              {getStatusLabel(status)}
            </span>
          </div>
          {locked && (
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
              Selection Locked
            </span>
          )}
        </div>
      </div>

      {/* Progress Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-zinc-900/40 p-6 rounded-3xl border border-white/5">
        <div className="p-4 bg-black/30 rounded-2xl border border-white/[0.03]">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Total Assets</p>
          <p className="text-2xl font-black text-white">{totalCount} Photos</p>
        </div>
        <div className="p-4 bg-black/30 rounded-2xl border border-white/[0.03]">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Reviewed Progress</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-400">{reviewedCount}</span>
            <span className="text-xs text-zinc-600">/ {totalCount} reviewed</span>
          </div>
        </div>
        <div className="p-4 bg-black/30 rounded-2xl border border-white/[0.03]">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Favorites Selected</p>
          <p className="text-2xl font-black text-rose-500">{selectedCount} Photos</p>
        </div>
      </div>

      {/* Navigation and Submit button */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-white/5 pb-4">
        {/* Tabs */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'all' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Photos
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'favorites' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Favorites ({selectedCount})
          </button>
        </div>

        {/* Submit Action */}
        {!locked && project && (
          <button
            onClick={() => setShowConfirmModal(true)}
            className="w-full sm:w-auto px-8 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-rose-500/10 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            Submit Selection
          </button>
        )}
        {locked && (
          <div className="px-6 py-3 bg-zinc-800/40 text-zinc-500 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            Selection Submitted
          </div>
        )}
      </div>

      {/* Grid */}
      {photos.length === 0 ? (
        <div className="glass-panel p-20 squircle-lg text-center max-w-2xl mx-auto border border-dashed border-white/10">
          <ImageIcon className="w-12 h-12 text-zinc-700 mx-auto mb-6 animate-pulse" />
          <h2 className="text-xl font-black uppercase tracking-tight mb-3">No Photos Found</h2>
          <p className="text-zinc-500 text-xs leading-relaxed max-w-sm mx-auto">
            {activeTab === 'favorites' 
              ? "You haven't marked any photos as favorites yet. Click the heart icon on any photo in the 'All Photos' tab."
              : "Your curations are loading or currently empty. Please coordinate with production staff."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.map((photo, idx) => {
            const isLast = idx === photos.length - 1;
            const isSaving = savingId === photo.id;
            const thumbnailUrl = `${API_URL}/files/${photo.fileId}/thumbnail?token=${accessToken}`;

            return (
              <div
                ref={isLast ? lastPhotoElementRef : null}
                key={photo.id}
                className="group relative aspect-[3/4] rounded-[2rem] overflow-hidden bg-zinc-950 border border-white/[0.03] hover:border-zinc-800 transition-all duration-500 shadow-xl cursor-pointer"
                onClick={() => setPreviewPhoto(photo)}
              >
                {/* Lazy loaded thumbnail image */}
                <img
                  src={thumbnailUrl}
                  alt="Gallery Thumbnail"
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                />

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-40 group-hover:opacity-80 transition-opacity duration-500" />

                {/* Optional Metadata - Filename shows very subtly in info tag if hovered */}
                <div className="absolute top-4 left-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-y-2 group-hover:translate-y-0">
                  <span className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-[8px] font-mono text-zinc-500 border border-white/5">
                    {photo.fileName.length > 20 ? photo.fileName.substring(0, 17) + '...' : photo.fileName}
                  </span>
                </div>

                {/* Interactive Overlay Layer */}
                <div className="absolute inset-x-0 bottom-0 p-6 flex items-center justify-between translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                  {/* Mark Reviewed Checkmark (Disabled if locked) */}
                  {!locked ? (
                    <button
                      onClick={(e) => handleToggleReview(photo, e)}
                      disabled={isSaving || photo.isFavorite}
                      className={`p-3 rounded-2xl backdrop-blur-xl transition-all border flex items-center justify-center ${
                        photo.isFavorite
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-not-allowed'
                          : photo.isReviewed
                          ? 'bg-emerald-500 border-emerald-500 text-black'
                          : 'bg-black/40 hover:bg-black/60 border-white/10 text-zinc-400'
                      }`}
                      title={photo.isFavorite ? "Favorite photos are automatically marked as reviewed" : "Mark as Reviewed"}
                    >
                      {isSaving && photo.isReviewed && !photo.isFavorite ? (
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    <div />
                  )}

                  {/* Favorite Heart Control */}
                  {!locked && (
                    <button
                      onClick={(e) => handleToggleFavorite(photo, e)}
                      disabled={isSaving}
                      className={`p-3 rounded-2xl backdrop-blur-xl transition-all border flex items-center justify-center ${
                        photo.isFavorite
                          ? 'bg-rose-500 border-rose-500 text-white'
                          : 'bg-black/40 hover:bg-black/60 border-white/10 text-zinc-400 hover:text-rose-400'
                      }`}
                    >
                      {isSaving && photo.isFavorite ? (
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Heart className={`w-3.5 h-3.5 ${photo.isFavorite ? 'fill-white' : ''}`} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Infinite Scroll loading indicator */}
      {loadingMore && (
        <div className="flex justify-center items-center py-8">
          <Loader className="w-6 h-6 text-zinc-700 animate-spin" />
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
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest truncate max-w-md">
                Identifier: {previewPhoto.id}
              </p>
              
              <div className="flex items-center gap-3">
                {/* Heart Toggle Inside Lightbox */}
                {!locked && (
                  <button
                    onClick={(e) => {
                      handleToggleFavorite(previewPhoto, e);
                      // Sync favorite state to preview modal object
                      setPreviewPhoto((prev: any) => ({ ...prev, isFavorite: !prev.isFavorite, isReviewed: true }));
                    }}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      previewPhoto.isFavorite 
                        ? 'bg-rose-500 border-rose-500 text-white' 
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${previewPhoto.isFavorite ? 'fill-white' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Lock Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="glass-panel-dark max-w-md w-full p-8 squircle-lg border border-white/10 shadow-2xl space-y-6 animate-ios-slide-up">
            <div className="flex items-center gap-4 text-rose-500">
              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white">Lock Selection?</h3>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Final Verification protocol</p>
              </div>
            </div>
            
            <p className="text-zinc-400 text-sm leading-relaxed">
              Once submitted, your selection will be locked and can no longer be modified. Staff will begin editing based on this list.
            </p>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitSelection}
                disabled={submitting}
                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
              >
                {submitting ? (
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Confirm & Lock"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientGallery;
