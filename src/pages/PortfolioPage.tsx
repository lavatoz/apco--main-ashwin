import React, { useEffect, useState, lazy, Suspense } from 'react';
import { getCollection, getCollections, type PublicCollectionDetail } from '../services/gallery';
import AnimatedPageWrapper from '../components/gallery/AnimatedPageWrapper';
import CollectionNavigation from '../components/gallery/CollectionNavigation';
import CollectionHero from '../components/gallery/CollectionHero';
import ScrollProgress from '../components/gallery/ScrollProgress';
import { updateSEOMetadata } from '../utils/seo';
import { Compass, RefreshCw } from 'lucide-react';

const EditorialGallery = lazy(() => import('../components/gallery/EditorialGallery'));
const Lightbox = lazy(() => import('../components/gallery/Lightbox'));
const RelatedCollections = lazy(() => import('../components/gallery/RelatedCollections'));
const CollectionFooterNavigation = lazy(() => import('../components/gallery/CollectionFooterNavigation'));

const ComponentLoader: React.FC = () => (
  <div className="w-full py-20 flex justify-center items-center bg-black">
    <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
  </div>
);

export const PortfolioPage: React.FC = () => {
  const [detail, setDetail] = useState<PublicCollectionDetail | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchPortfolio = async () => {
    setLoading(true);
    setError('');
    try {
      // Try to fetch collection with slug 'portfolio'
      let data: PublicCollectionDetail | null = null;
      try {
        data = await getCollection('portfolio');
      } catch (portfolioErr) {
        // Fallback: get first available published collection
        const all = await getCollections();
        if (all && all.length > 0) {
          data = await getCollection(all[0].slug);
        }
      }

      if (data && data.collection) {
        setDetail(data);
        updateSEOMetadata(
          data.seo?.title || `${data.collection.title} Portfolio`,
          data.seo?.description || data.collection.description || 'Masterworks Portfolio',
          data.collection.heroImage || data.collection.coverImage || ''
        );
      } else {
        setError('No published collections available.');
      }
    } catch (err: any) {
      console.error('Failed to load portfolio:', err);
      setError(err.message || 'Failed to load portfolio collection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchPortfolio();
  }, []);

  if (loading) {
    return (
      <AnimatedPageWrapper>
        <div className="min-h-screen flex flex-col justify-center items-center bg-black text-white p-8">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mb-4" />
          <p className="text-xs font-mono uppercase tracking-[0.25em] text-zinc-500">Loading Masterworks Portfolio...</p>
        </div>
      </AnimatedPageWrapper>
    );
  }

  if (error || !detail || !detail.collection) {
    return (
      <AnimatedPageWrapper>
        <CollectionNavigation title="Masterworks Portfolio" />
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-black">
          <Compass className="w-16 h-16 text-zinc-600 mb-6 animate-pulse" />
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-4 font-serif">
            Portfolio Unavailable
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest max-w-md leading-relaxed mb-8">
            {error || 'No portfolio collections are currently published.'}
          </p>
          <button
            onClick={fetchPortfolio}
            className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Loading</span>
          </button>
        </div>
      </AnimatedPageWrapper>
    );
  }

  const { collection } = detail;

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

  return (
    <AnimatedPageWrapper>
      <ScrollProgress />
      <CollectionNavigation
        title={mappedCollection.title}
        photoCount={mappedCollection.photoCount}
      />
      <CollectionHero collection={mappedCollection as any} />

      <Suspense fallback={<ComponentLoader />}>
        <EditorialGallery
          photos={mappedPhotos}
          onImageClick={(idx) => setLightboxIndex(idx)}
        />
      </Suspense>

      {lightboxIndex !== null && (
        <Suspense fallback={<ComponentLoader />}>
          <Lightbox
            photos={mappedPhotos}
            initialIndex={lightboxIndex}
            collectionTitle={mappedCollection.title}
            onClose={() => setLightboxIndex(null)}
          />
        </Suspense>
      )}

      <Suspense fallback={<ComponentLoader />}>
        <RelatedCollections currentSlug={mappedCollection.slug} />
      </Suspense>

      <Suspense fallback={<ComponentLoader />}>
        <CollectionFooterNavigation currentSlug={mappedCollection.slug} />
      </Suspense>
    </AnimatedPageWrapper>
  );
};

export default PortfolioPage;
