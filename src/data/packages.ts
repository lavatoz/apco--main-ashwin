export interface PackageFeature {
  text: string;
}

export interface Package {
  id: string;
  name: string;
  price: string;
  features: string[];
  crew: string;
  tag?: string;
}

export const packages: Package[] = [
  {
    id: "classic",
    name: "Classic Moments",
    price: "₹55,000",
    crew: "Wedding Day Creative Crew X2",
    features: [
      "Pre / Post Wedding Shoot (Photos & Reels / Documentary)",
      "Photo Book 40 Leaflets (80 Pages)",
      "Photo Frames (L) X2",
      "Tabletop or Wall Calendar",
      "Leather Bag",
      "Traditional Full Event Video + Highlight + Reels",
      "Live Streaming on YouTube",
      "Lifetime Cloud Storage",
      "Wedding Day Creative Crew X2"
    ]
  },
  {
    id: "elegant",
    name: "Elegant Memories",
    price: "₹80,000",
    crew: "Wedding Day Creative Crew X4",
    tag: "Most Popular",
    features: [
      "Pre / Post Wedding Shoot",
      "Photo Book 50 Leaflets (100 Pages) + Mini Book",
      "Photo Frames (XL) X2",
      "Calendar + Leather Bag",
      "Traditional Video + Highlight + Reels",
      "Live Streaming",
      "Lifetime Cloud Storage",
      "Wedding Day Creative Crew X4"
    ]
  },
  {
    id: "royal",
    name: "Royal Wedding Story",
    price: "₹1,10,000",
    crew: "Wedding Day Creative Crew X4+",
    features: [
      "Pre / Post Wedding Shoot",
      "Premium Album 80 Leaflets (160 Pages) + Mini Book",
      "Photo Frames (XL) X4",
      "Calendar + Leather Bag",
      "Traditional Video + Highlight + Reels",
      "Live Streaming",
      "Lifetime Cloud Storage",
      "Wedding Day Creative Crew X4+"
    ]
  }
];
