import { fetchApi } from './client';

export interface WebsiteGallery {
  id: string;
  title: string;
  coverImageUrl: string;
  coverImageFileId: string;
  instagramUrl?: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export const websiteGallery = {
  getGalleries: async (): Promise<WebsiteGallery[]> => {
    return fetchApi('/website-gallery');
  },

  getGalleryById: async (id: string): Promise<WebsiteGallery> => {
    return fetchApi(`/website-gallery/${id}`);
  },

  createGallery: async (data: Omit<WebsiteGallery, 'id' | 'createdAt' | 'updatedAt'>): Promise<WebsiteGallery> => {
    return fetchApi('/website-gallery', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateGallery: async (id: string, data: Partial<Omit<WebsiteGallery, 'id' | 'createdAt' | 'updatedAt'>>): Promise<WebsiteGallery> => {
    return fetchApi(`/website-gallery/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteGallery: async (id: string): Promise<{ success: boolean; message: string }> => {
    return fetchApi(`/website-gallery/${id}`, {
      method: 'DELETE',
    });
  },

  uploadCoverImage: async (file: File): Promise<{ success: boolean; fileId: string; imageUrl: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchApi('/website-gallery/upload', {
      method: 'POST',
      body: formData,
    });
  },

  getPublicGalleries: async (): Promise<WebsiteGallery[]> => {
    return fetchApi('/public/website-gallery');
  },
};
