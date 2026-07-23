import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import ExhibitionFloor from './ExhibitionFloor';
import ExhibitionFrames from './ExhibitionFrames';
import WeddingStoryOverlay from './WeddingStoryOverlay';
import { getCollection, type PublicCollectionDetail, type GalleryCollection } from '../../services/gallery';
import galleryPlaceholder from '../../assets/placeholders/gallery-placeholder.jpg';

// Shared coordinate calculator for positioning gallery frames in staggered 3D space
export const getFramePosition = (index: number): [number, number, number] => {
  const positions: [number, number, number][] = [
    [0, 0.5, -4],        // 0: Center Hero
    [-3.5, 0.8, -7],     // 1: Left Middle
    [3.5, 0.2, -6],      // 2: Right Middle
    [-4.8, 0.4, -11],    // 3: Left Far
    [4.8, 0.9, -10],    // 4: Right Far
    [-2.4, -0.4, -2.5],  // 5: Left Close
    [2.5, -0.2, -3.0],   // 6: Right Close
  ];
  
  if (index < positions.length) {
    return positions[index];
  }
  
  // Stagger extra frames deeper in the exhibition hall
  const depthLevel = Math.floor((index - 1) / 2);
  const isLeft = index % 2 === 1;
  const x = isLeft ? -4.0 - (depthLevel * 0.8) : 4.0 + (depthLevel * 0.8);
  const y = 0.3 + Math.sin(index) * 0.4;
  const z = -6.0 - (depthLevel * 3.5);
  
  return [x, y, z];
};

// Curated local mock collections fallback for development / offline state
const localMockCollections: GalleryCollection[] = [
  {
    id: 'mock-1',
    title: 'THE ROYAL UNION',
    category: 'Royal Wedding',
    coverImage: galleryPlaceholder,
    slug: 'royal-union',
    displayOrder: 1,
    isPublished: true,
    createdAt: '',
    updatedAt: '',
    _count: { images: 12 }
  },
  {
    id: 'mock-2',
    title: 'SACRED TALES',
    category: 'Traditional Wedding',
    coverImage: galleryPlaceholder,
    slug: 'sacred-tales',
    displayOrder: 2,
    isPublished: true,
    createdAt: '',
    updatedAt: '',
    _count: { images: 24 }
  },
  {
    id: 'mock-3',
    title: 'VILLA ROMANTICA',
    category: 'Destination Wedding',
    coverImage: galleryPlaceholder,
    slug: 'villa-romantica',
    displayOrder: 3,
    isPublished: true,
    createdAt: '',
    updatedAt: '',
    _count: { images: 18 }
  },
  {
    id: 'mock-4',
    title: 'GOLDEN SILHOUETTE',
    category: 'Bridal Portraiture',
    coverImage: galleryPlaceholder,
    slug: 'golden-silhouette',
    displayOrder: 4,
    isPublished: true,
    createdAt: '',
    updatedAt: '',
    _count: { images: 15 }
  },
  {
    id: 'mock-5',
    title: 'COURTYARD PRELUDE',
    category: 'Pre-Wedding Story',
    coverImage: galleryPlaceholder,
    slug: 'courtyard-prelude',
    displayOrder: 5,
    isPublished: true,
    createdAt: '',
    updatedAt: '',
    _count: { images: 8 }
  },
  {
    id: 'mock-6',
    title: 'MIDNIGHT EMBRACE',
    category: 'Reception Story',
    coverImage: galleryPlaceholder,
    slug: 'midnight-embrace',
    displayOrder: 6,
    isPublished: true,
    createdAt: '',
    updatedAt: '',
    _count: { images: 32 }
  },
  {
    id: 'mock-7',
    title: 'CLIFFSIDE WHISPERS',
    category: 'Beach Wedding',
    coverImage: galleryPlaceholder,
    slug: 'cliffside-whispers',
    displayOrder: 7,
    isPublished: true,
    createdAt: '',
    updatedAt: '',
    _count: { images: 14 }
  }
];

// React Hook to respect accessibility prefers-reduced-motion media query
const useReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return reduced;
};

const CameraControl: React.FC<{
  selectedId: string | null;
  showOverlay: boolean;
  collections: GalleryCollection[];
  onArrivalComplete: () => void;
  prefersReducedMotion: boolean;
}> = ({ selectedId, showOverlay, collections, onArrivalComplete, prefersReducedMotion }) => {
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.3, -4.5));
  const arrivalTimeRef = useRef<number | null>(null);

  // Reset arrival timing whenever selection ID changes
  useEffect(() => {
    arrivalTimeRef.current = null;
  }, [selectedId]);

  useFrame((state) => {
    let targetCam = new THREE.Vector3();
    let targetLook = new THREE.Vector3(0, 0.3, -4.5);
    const time = state.clock.getElapsedTime();

    if (selectedId) {
      const idx = collections.findIndex(c => c.id === selectedId);
      if (idx !== -1) {
        const pos = getFramePosition(idx);
        
        // Shift camera leftward when overlay opens, framing the artwork on the right side of the screen
        const offsetX = showOverlay ? -1.2 : 0.0;
        const lookOffsetX = showOverlay ? -0.2 : 0.0;

        // Subtle camera breathing oscillation only if reduced motion is disabled
        const breatheY = prefersReducedMotion ? 0.0 : Math.sin(time * 0.3) * 0.015;

        targetCam.set(pos[0] + offsetX, pos[1] + breatheY, pos[2] + 3.4);
        targetLook.set(pos[0] + lookOffsetX, pos[1] + breatheY, pos[2]);

        // Easing camera with premium slow lerp (inertia)
        state.camera.position.lerp(targetCam, 0.03);
        currentLookAt.current.lerp(targetLook, 0.03);
        state.camera.lookAt(currentLookAt.current);

        // Check arrival distance to trigger overlay fade-in after 500ms
        const dist = state.camera.position.distanceTo(targetCam);
        if (dist < 0.18) {
          if (arrivalTimeRef.current === null) {
            arrivalTimeRef.current = time;
          } else if (time - arrivalTimeRef.current > 0.5) {
            onArrivalComplete();
          }
        }
        return;
      }
    }

    // Default Mouse Parallax camera behavior with subtle breathe
    arrivalTimeRef.current = null;
    const pointerX = prefersReducedMotion ? 0 : state.pointer.x;
    const pointerY = prefersReducedMotion ? 0 : state.pointer.y;

    const isMobile = state.viewport.width < 6;
    const targetX = pointerX * (isMobile ? 0.8 : 2.0);

    // Continuous float loop when idle (only if reduced motion is disabled)
    const breatheY = prefersReducedMotion ? 0.0 : Math.sin(time * 0.45) * 0.04;
    const breatheX = prefersReducedMotion ? 0.0 : Math.cos(time * 0.25) * 0.02;

    const targetY = pointerY * (isMobile ? 0.5 : 1.0) + 0.2 + breatheY;

    targetCam.set(targetX + breatheX, targetY, 4.5);
    
    // Inertial lerp (0.025 is very smooth and avoids sudden jerks)
    state.camera.position.lerp(targetCam, 0.025);
    currentLookAt.current.lerp(targetLook, 0.025);
    state.camera.lookAt(currentLookAt.current);
  });

  return null;
};

// Controls exposure adaptation: smoothly fades ambient/directional lights during transitions
const LightingController: React.FC<{ selectedId: string | null }> = ({ selectedId }) => {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dir1Ref = useRef<THREE.DirectionalLight>(null);
  const dir2Ref = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    const isAnySelected = selectedId !== null;
    
    // Target light values
    const targetAmbient = isAnySelected ? 0.04 : 0.2;
    const targetDir1 = isAnySelected ? 0.08 : 0.4;
    const targetDir2 = isAnySelected ? 0.12 : 0.7;

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(ambientRef.current.intensity, targetAmbient, 0.08);
    }
    if (dir1Ref.current) {
      dir1Ref.current.intensity = THREE.MathUtils.lerp(dir1Ref.current.intensity, targetDir1, 0.08);
    }
    if (dir2Ref.current) {
      dir2Ref.current.intensity = THREE.MathUtils.lerp(dir2Ref.current.intensity, targetDir2, 0.08);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.2} color="#F7F7F7" />
      <directionalLight ref={dir1Ref} position={[-6, 6, -2]} intensity={0.4} color="#8A8A8A" />
      <directionalLight ref={dir2Ref} position={[6, 4, 2]} intensity={0.7} color="#C9A45D" />
    </>
  );
};

// Dynamics controllers for spotlight tracking the active/hovered framed artwork
const SpotlightController: React.FC<{
  selectedId: string | null;
  hoveredId: string | null;
  collections: GalleryCollection[];
}> = ({ selectedId, hoveredId, collections }) => {
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!spotLightRef.current || !targetRef.current) return;
    
    // Spotlight targets the selected frame, or the hovered frame, or default center hero
    let targetPos = new THREE.Vector3(0, 0.5, -4);
    const activeId = selectedId || hoveredId;
    
    if (activeId) {
      const idx = collections.findIndex((c) => c.id === activeId);
      if (idx !== -1) {
        const [x, y, z] = getFramePosition(idx);
        targetPos.set(x, y, z);
      }
    }
    
    // Dynamic spotlight intensity mapping (higher on selected mesh)
    const targetIntensity = selectedId ? 32 : 16;
    spotLightRef.current.intensity = THREE.MathUtils.lerp(spotLightRef.current.intensity, targetIntensity, 0.08);

    // Lerp focus position of spotlight
    targetRef.current.position.lerp(targetPos, 0.08);
  });

  return (
    <>
      <group ref={targetRef} />
      <spotLight
        ref={spotLightRef}
        target={targetRef.current || undefined}
        position={[0, 9, 2]}
        angle={0.45}
        penumbra={1}
        intensity={16}
        color="#C9A45D"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
    </>
  );
};

interface CinematicExhibition3DProps {
  collections?: GalleryCollection[];
}

export const CinematicExhibition3D: React.FC<CinematicExhibition3DProps> = ({ collections = [] }) => {
  const finalCollections = collections.length > 0 ? collections : localMockCollections;
  const prefersReducedMotion = useReducedMotion();
  
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  // Type-safe collection details state (only loads images when selected)
  const [selectedDetail, setSelectedDetail] = useState<PublicCollectionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // 1. Fetch detailed collection data on-demand after selection
  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null);
      return;
    }

    const collection = finalCollections.find(c => c.id === selectedId);
    if (!collection) return;

    // Handle mock collection fallbacks locally
    if (selectedId.startsWith('mock-')) {
      const mockDetail: PublicCollectionDetail = {
        collection: {
          ...collection,
          images: [
            {
              id: 'mock-img-1',
              collectionId: selectedId,
              imageUrl: galleryPlaceholder,
              displayOrder: 1,
              isFeatured: true,
              caption: 'The Prelude Ceremony',
              createdAt: '',
              updatedAt: ''
            },
            {
              id: 'mock-img-2',
              collectionId: selectedId,
              imageUrl: galleryPlaceholder,
              displayOrder: 2,
              isFeatured: false,
              caption: 'Editorial Vows by the Courtyard',
              createdAt: '',
              updatedAt: ''
            },
            {
              id: 'mock-img-3',
              collectionId: selectedId,
              imageUrl: galleryPlaceholder,
              displayOrder: 3,
              isFeatured: false,
              caption: 'A Moment Suspended in Time',
              createdAt: '',
              updatedAt: ''
            }
          ]
        },
        relatedCollections: [],
        seo: { title: collection.title, description: '' }
      };
      setSelectedDetail(mockDetail);
      return;
    }

    setLoadingDetail(true);
    getCollection(collection.slug)
      .then((data) => {
        setSelectedDetail(data);
      })
      .catch((err) => {
        console.error('Failed to load full collection detail:', err);
      })
      .finally(() => {
        setLoadingDetail(false);
      });
  }, [selectedId, finalCollections]);

  // 2. Accessibility: Escape key resets selection during camera travel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedId) {
        setSelectedId(null);
        setShowOverlay(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  const handleCloseOverlay = () => {
    setSelectedId(null);
    setShowOverlay(false);
  };

  const isAnySelected = selectedId !== null;

  return (
    <div className="relative w-full h-[70vh] sm:h-[80vh] md:h-[85vh] bg-[#0B0B0B] overflow-hidden select-none border-b border-white/5">
      {/* 1. Ambient Spot Light Beam Effect (CSS radial gradient) */}
      <div className="exhibition-spotlight-glow" />
      
      {/* 2. Soft Edge Vignette Overlay */}
      <div className="exhibition-vignette" />

      {/* 3. Luxury Floating Typography Labels */}
      <div className="absolute top-8 left-8 z-20 pointer-events-none">
        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em] text-[#C9A45D] block mb-1 font-mono">
          Exhibition Space
        </span>
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-[#F7F7F7] font-serif-luxury leading-none">
          THE ARTISANS NOIR
        </h1>
      </div>

      <div className="absolute top-8 right-8 z-20 pointer-events-none hidden sm:block text-right">
        <span className="text-[8px] font-mono uppercase tracking-[0.25em] text-[#8A8A8A] block mb-1">
          Perspective Engine v1.0
        </span>
        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#F7F7F7]">
          Matte Black Collection
        </span>
      </div>

      {/* 4. Canvas Container */}
      <Canvas
        shadows
        camera={{ position: [0, 0.2, 4.5], fov: 60 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        {/* Background matte color */}
        <color attach="background" args={['#0B0B0B']} />
        
        {/* Cinematic depth fog */}
        <fog attach="fog" args={['#0B0B0B', 4, 18]} />

        {/* 5. Lighting Setup (Dim background lights dynamically when selection is active) */}
        <LightingController selectedId={selectedId} />

        {/* Golden Spotlight controller */}
        <SpotlightController 
          selectedId={selectedId}
          hoveredId={hoveredId} 
          collections={finalCollections} 
        />

        {/* 6. Gold Dust Floating Particles */}
        <Sparkles
          count={90}
          scale={[15, 8, 15]}
          size={1.6}
          speed={0.2}
          color="#C9A45D"
          opacity={0.35}
        />

        {/* 7. Scene Components */}
        <Suspense fallback={null}>
          <ExhibitionFloor />
          <ExhibitionFrames
            collections={finalCollections}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
          />
        </Suspense>

        {/* 8. Camera Parallax & Zoom Transition Control */}
        <CameraControl 
          selectedId={selectedId}
          showOverlay={showOverlay}
          collections={finalCollections}
          onArrivalComplete={() => setShowOverlay(true)}
          prefersReducedMotion={prefersReducedMotion}
        />
      </Canvas>

      {/* 9. Minimal Interaction HUD Panel (Hide when selected) */}
      {!isAnySelected && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#F7F7F7] mb-1.5 font-sans">
            Black Box Curation
          </p>
          <p className="text-[7.5px] font-bold tracking-[0.2em] text-[#8A8A8A] uppercase font-mono">
            [ Click an artwork frame to enter editorial narrative ]
          </p>
        </div>
      )}

      {/* Corner Decorative Borders */}
      <div className="absolute bottom-6 left-6 w-8 h-[1px] bg-[#C9A45D]/30" />
      <div className="absolute bottom-6 left-6 h-8 w-[1px] bg-[#C9A45D]/30" />
      <div className="absolute bottom-6 right-6 w-8 h-[1px] bg-[#C9A45D]/30" />
      <div className="absolute bottom-6 right-6 h-8 w-[1px] bg-[#C9A45D]/30" />

      {/* 10. Slide-in Editorial Panel Overlay */}
      {showOverlay && (
        <WeddingStoryOverlay
          detail={selectedDetail}
          loading={loadingDetail}
          onClose={handleCloseOverlay}
        />
      )}
    </div>
  );
};

export default CinematicExhibition3D;
