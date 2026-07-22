export interface CollectionPhoto {
  id: string;
  url: string;
  title?: string;
  caption?: string;
  aspectRatio: 'portrait' | 'landscape' | 'square' | 'tall';
}

export interface CollectionData {
  id: string;
  slug: string;
  title: string;
  description: string;
  heroImage: string;
  coverImage: string;
  photoCount: number;
  category: string;
  location?: string;
  date?: string;
  photos: CollectionPhoto[];
}
