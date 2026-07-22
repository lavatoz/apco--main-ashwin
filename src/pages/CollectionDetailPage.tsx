import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCollection, type PublicCollectionDetail } from '../services/gallery';
import AnimatedPageWrapper from '../components/gallery/AnimatedPageWrapper';
import CollectionNavigation from '../components/gallery/CollectionNavigation';
import CollectionHero from '../components/gallery/CollectionHero';
import ScrollProgress from '../components/gallery/ScrollProgress';
import { updateSEOMetadata } from '../utils/seo';
import { ArrowLeft, Compass, RefreshCw } from 'lucide-react';

const EditorialGallery = lazy(() => import('../components/gallery/EditorialGallery'));
const Lightbox = lazy(() => import('../components/gallery/Lightbox'));
const RelatedCollections = lazy(() => import('../components/gallery/RelatedCollections'));
const CollectionFooterNavigation = lazy(() => import('../components/gallery/CollectionFooterNavigation'));
const EmptyGalleryState = lazy(() => import('../components/gallery/EmptyGalleryState'));

const ComponentLoader: React.FC = () => (
  <div className="w-full py-20 flex justify-center items-center bg-black">
    <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
  </div>
);

export const CollectionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [detail, setDetail] = useState<PublicCollectionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchCollection = async () => {
    if (!slug) return;
    setLoading(true);
    setError('');
    try {
      const data = await getCollection(slug);
      setDetail(data);

      if (data && data.collection) {
        updateSEOMetadata(
          data.seo?.title || `${data.collection.title} Photography`,
          data.seo?.description || data.collection.description || '',
          data.collection.heroImage || data.collection.coverImage || ''
        );
      }
    } catch (err: any) {
      console.error('Failed to fetch collection detail:', err);
      setError(err.message || 'Collection not found or network request failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    setLightboxIndex(null);
    fetchCollection();
  }, [slug]);

  if (loading) {
    return (
      <AnimatedPageWrapper>
        <div className="min-h-screen flex flex-col justify-center items-center bg-black text-white p-8">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mb-4" />
          <p className="text-xs font-mono uppercase tracking-[0.25em] text-zinc-500">Loading Gallery...</p>
        </div>
      </AnimatedPageWrapper>
    );
  }

  if (error || !detail || !detail.collection) {
    return (
      <AnimatedPageWrapper>
        <CollectionNavigation title="Collection Not Found" />
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-black">
          <Compass className="w-16 h-16 text-zinc-600 mb-6 animate-pulse" />
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-4 font-serif">
            Collection Not Found
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest max-w-md leading-relaxed mb-8">
            {error || 'The collection segment you are seeking does not exist or has been relocated.'}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={fetchCollection}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="group flex items-center gap-3 px-8 py-3 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Return to Portfolio</span>
            </button>
          </div>
        </div>
      </AnimatedPageWrapper>
    );
  }

  const { collection } = detail;

  // Map backend model to luxury UI props format
  const mappedPhotos = (collection.images || []).map((img, idx) => ({
    id: img.id,
    url: img.imageUrl,
    title: img.caption || img.altText || `Photo ${idx + 1}`,
    caption: img.caption || undefined,
    aspectRatio: (idx % 4 === 0 ? 'portrait' : idx % 4 === 1 ? 'landscape' : idx % 4 === 2 ? 'square' : 'tall') as any,
  }));

  const mappedCollection = {
    id: collection.id,
    slug: collection.slug,
    title: collection.title,
    description: collection.description || '',
    heroImage: collection.heroImage || collection.coverImage || (mappedPhotos[0]?.url || ''),
    coverImage: collection.coverImage || collection.heroImage || (mappedPhotos[0]?.url || ''),
    photoCount: mappedPhotos.length,
    category: collection.category,
    photos: mappedPhotos,
  };

  const hasPhotos = mappedPhotos.length > 0;

  return (
    <AnimatedPageWrapper>
      {/* Apple-style Scroll Progress Bar */}
      <ScrollProgress />

      {/* Sticky Header Navigation */}
      <CollectionNavigation
        title={mappedCollection.title}
        photoCount={mappedCollection.photoCount}
      />

      {/* Hero Section */}
      <CollectionHero collection={mappedCollection as any} />

      {/* Main Gallery or Empty State */}
      <Suspense fallback={<ComponentLoader />}>
        {hasPhotos ? (
          <EditorialGallery
            photos={mappedPhotos}
            onImageClick={(idx) => setLightboxIndex(idx)}
          />
        ) : (
          <EmptyGalleryState />
        )}
      </Suspense>

      {/* Fullscreen Lightbox Viewer */}
      {lightboxIndex !== null && hasPhotos && (
        <Suspense fallback={<ComponentLoader />}>
          <Lightbox
            photos={mappedPhotos}
            initialIndex={lightboxIndex}
            collectionTitle={mappedCollection.title}
            onClose={() => setLightboxIndex(null)}
          />
        </Suspense>
      )}

      {/* Related Collections */}
      <Suspense fallback={<ComponentLoader />}>
        <RelatedCollections currentSlug={mappedCollection.slug} />
      </Suspense>

      {/* Previous / Next Collection Looping Footer */}
      <Suspense fallback={<ComponentLoader />}>
        <CollectionFooterNavigation currentSlug={mappedCollection.slug} />
      </Suspense>
    </AnimatedPageWrapper>
  );
};

export default CollectionDetailPage;
