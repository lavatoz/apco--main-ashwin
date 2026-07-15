import galleryPlaceholder from '../assets/placeholders/gallery-placeholder.jpg';

export interface MockGalleryItem {
  id: string;
  title: string;
  coverImage: string;
  instagramUrl?: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

let mockGalleryItems: MockGalleryItem[] = [
  {
    id: '1',
    title: 'The Royal Vows (Udaipur Palace)',
    coverImage: galleryPlaceholder,
    instagramUrl: 'https://www.instagram.com/p/DBcd_eRgF1f/',
    published: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: '2',
    title: 'Haldi Joy at Beachside Resort',
    coverImage: galleryPlaceholder,
    instagramUrl: 'https://www.instagram.com/p/C-fG8HnB3j4/',
    published: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: '3',
    title: 'Pure Innocence (Newborn Portrait)',
    coverImage: galleryPlaceholder,
    instagramUrl: '',
    published: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const getMockGalleryItems = (): MockGalleryItem[] => {
  return [...mockGalleryItems];
};

export const getMockGalleryItemById = (id: string): MockGalleryItem | undefined => {
  return mockGalleryItems.find(item => item.id === id);
};

export const addMockGalleryItem = (item: Omit<MockGalleryItem, 'id' | 'createdAt' | 'updatedAt'>): MockGalleryItem => {
  const newItem: MockGalleryItem = {
    ...item,
    id: Math.random().toString(36).substring(2, 9),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockGalleryItems.push(newItem);
  return newItem;
};

export const updateMockGalleryItem = (id: string, updates: Partial<Omit<MockGalleryItem, 'id' | 'createdAt' | 'updatedAt'>>): MockGalleryItem | undefined => {
  const index = mockGalleryItems.findIndex(item => item.id === id);
  if (index === -1) return undefined;
  
  mockGalleryItems[index] = {
    ...mockGalleryItems[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return mockGalleryItems[index];
};

export const deleteMockGalleryItem = (id: string): boolean => {
  const initialLength = mockGalleryItems.length;
  mockGalleryItems = mockGalleryItems.filter(item => item.id !== id);
  return mockGalleryItems.length < initialLength;
};
