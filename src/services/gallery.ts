import { fetchApi } from './api/client';

export interface GalleryImage {
  id: string;
  collectionId: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
  altText?: string | null;
  displayOrder: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryCollection {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  category: string;
  heroImage?: string | null;
  coverImage?: string | null;
  displayOrder: number;
  isPublished: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  createdAt: string;
  updatedAt: string;
  images?: GalleryImage[];
  _count?: {
    images: number;
  };
}

export interface PublicCollectionDetail {
  collection: GalleryCollection;
  relatedCollections: Partial<GalleryCollection>[];
  seo: {
    title: string;
    description: string;
  };
}

/**
 * Public API: Fetch published collections
 */
export const getCollections = async (): Promise<GalleryCollection[]> => {
  return fetchApi('/gallery/collections');
};

/**
 * Public API: Fetch single published collection by slug
 */
export const getCollection = async (slug: string): Promise<PublicCollectionDetail> => {
  return fetchApi(`/gallery/collections/${slug}`);
};

/**
 * Admin API: Fetch all collections for admin panel
 */
export const getAdminCollections = async (): Promise<GalleryCollection[]> => {
  return fetchApi('/admin/gallery/collections');
};

/**
 * Admin API: Fetch collection by ID
 */
export const getAdminCollection = async (id: string): Promise<GalleryCollection> => {
  return fetchApi(`/admin/gallery/collections/${id}`);
};

/**
 * Admin API: Create a collection
 */
export const createCollection = async (data: Partial<GalleryCollection>): Promise<GalleryCollection> => {
  return fetchApi('/admin/gallery/collections', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Admin API: Update a collection
 */
export const updateCollection = async (id: string, data: Partial<GalleryCollection>): Promise<GalleryCollection> => {
  return fetchApi(`/admin/gallery/collections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Admin API: Delete a collection
 */
export const deleteCollection = async (id: string): Promise<{ success: boolean; message: string }> => {
  return fetchApi(`/admin/gallery/collections/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Admin API: Publish collection
 */
export const publishCollection = async (id: string): Promise<GalleryCollection> => {
  return fetchApi(`/admin/gallery/collections/${id}/publish`, {
    method: 'POST',
  });
};

/**
 * Admin API: Unpublish collection
 */
export const unpublishCollection = async (id: string): Promise<GalleryCollection> => {
  return fetchApi(`/admin/gallery/collections/${id}/unpublish`, {
    method: 'POST',
  });
};

/**
 * Admin API: Upload images to collection
 */
export const uploadImages = async (collectionId: string, files: File[]): Promise<GalleryImage[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });
  return fetchApi(`/admin/gallery/collections/${collectionId}/images`, {
    method: 'POST',
    body: formData,
  });
};

/**
 * Admin API: Delete image
 */
export const deleteImage = async (id: string): Promise<{ success: boolean; message: string }> => {
  return fetchApi(`/admin/gallery/images/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Admin API: Update image metadata
 */
export const updateImage = async (id: string, data: Partial<GalleryImage>): Promise<GalleryImage> => {
  return fetchApi(`/admin/gallery/images/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Admin API: Reorder images
 */
export const reorderImages = async (items: Array<{ id: string; displayOrder: number }>): Promise<{ success: boolean; message: string }> => {
  return fetchApi('/admin/gallery/images/reorder', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
};
