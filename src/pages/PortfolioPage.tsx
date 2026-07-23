import React, { useEffect, useState } from 'react';
import { getCollection, getCollections, type PublicCollectionDetail, type GalleryCollection } from '../services/gallery';
import AnimatedPageWrapper from '../components/gallery/AnimatedPageWrapper';
import CollectionNavigation from '../components/gallery/CollectionNavigation';
import CinematicExhibition3D from '../components/gallery/CinematicExhibition3D';
import { updateSEOMetadata } from '../utils/seo';

export const PortfolioPage: React.FC = () => {
  const [detail, setDetail] = useState<PublicCollectionDetail | null>(null);
  const [collections, setCollections] = useState<GalleryCollection[]>([]);

  const fetchPortfolio = async () => {
    try {
      // 1. Fetch all collections for the 3D gallery
      const all = await getCollections();
      if (all && all.length > 0) {
        setCollections(all);
      }

      // 2. Fetch specific collection ('portfolio') for SEO/metadata in background
      let data: PublicCollectionDetail | null = null;
      try {
        data = await getCollection('portfolio');
      } catch (portfolioErr) {
        // Fallback: get first available collection details
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
      }
    } catch (err: unknown) {
      console.error('Failed to load portfolio:', err instanceof Error ? err.message : err);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchPortfolio();
  }, []);

  // Use dynamic count from loaded collections if available
  const displayTitle = detail?.collection?.title || 'Masterworks Exhibition';
  const displayCount = collections.length > 0 ? collections.length : 7;

  return (
    <AnimatedPageWrapper>
      <CollectionNavigation
        title={displayTitle}
        photoCount={displayCount}
      />
      <div className="bg-[#0B0B0B] min-h-[calc(100vh-80px)] flex flex-col justify-center items-center">
        <CinematicExhibition3D collections={collections} />
      </div>
    </AnimatedPageWrapper>
  );
};

export default PortfolioPage;
