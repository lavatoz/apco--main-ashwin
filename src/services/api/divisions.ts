import { fetchApi } from './client';

export interface PublicDivisionMedia {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  position: number;
  url: string;
}

export interface PublicDivision {
  id: string;
  name: string;
  description: string;
  instagramUrl: string | null;
  media: PublicDivisionMedia[];
}

export interface WebsiteDivisionMedia {
  id: string;
  divisionId: string;
  type: 'IMAGE' | 'VIDEO';
  position: number;
  url: string;
  fileId: string;
  createdAt: string;
}

export interface WebsiteDivision {
  id: string;
  name: string;
  description: string;
  instagramUrl: string | null;
  published: boolean;
  coverMediaId?: string | null;
  media: WebsiteDivisionMedia[];
  createdAt: string;
  updatedAt: string;
}

export const divisions = {
  getPublicDivisions: async (): Promise<PublicDivision[]> => {
    return fetchApi('/public/divisions');
  },

  getWebsiteDivisions: async (): Promise<WebsiteDivision[]> => {
    return fetchApi('/divisions');
  },

  getWebsiteDivisionById: async (id: string): Promise<WebsiteDivision> => {
    return fetchApi(`/divisions/${id}`);
  },

  createWebsiteDivision: async (data: {
    name: string;
    description: string;
    instagramUrl: string | null;
    published: boolean;
    coverMediaId?: string | null;
    media?: {
      type: 'IMAGE' | 'VIDEO';
      position: number;
      url: string;
      fileId: string;
    }[];
  }): Promise<WebsiteDivision> => {
    return fetchApi('/divisions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateWebsiteDivision: async (id: string, data: {
    name: string;
    description: string;
    instagramUrl: string | null;
    published: boolean;
    coverMediaId?: string | null;
    media?: {
      type: 'IMAGE' | 'VIDEO';
      position: number;
      url: string;
      fileId: string;
    }[];
  }): Promise<WebsiteDivision> => {
    return fetchApi(`/divisions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteWebsiteDivision: async (id: string): Promise<{ success: boolean; message: string }> => {
    return fetchApi(`/divisions/${id}`, {
      method: 'DELETE',
    });
  },

  uploadDivisionMedia: async (file: File): Promise<{ success: boolean; url: string; fileId: string; mimeType: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchApi('/divisions/upload', {
      method: 'POST',
      body: formData,
    });
  },
};
