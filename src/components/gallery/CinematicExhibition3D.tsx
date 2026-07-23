import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import ExhibitionFloor from './ExhibitionFloor';
import ExhibitionFrames from './ExhibitionFrames';
import WeddingStoryOverlay from './WeddingStoryOverlay';
import { getCollection, type PublicCollectionDetail, type GalleryCollection } from '../../services/gallery';
import galleryPlaceholder from '../../assets/placeholders/gallery-placeholder.jpg';

// Shared coordinate calculator for positioning gallery frames in staggered 3D space
export const getFramePosition = (index: number): [number, number, number] => {
  const positions: [number, number, number][] = [
    [0, 0.5, -4],        // 0: Center Hero (Featured)
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
  isIntroActive: boolean;
}> = ({ selectedId, showOverlay, collections, onArrivalComplete, prefersReducedMotion, isIntroActive }) => {
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

    // 1. Cinematic Guided Introduction Mode
    if (isIntroActive) {
      // Slowly glide camera from far back to focus position directly in front of the featured collection
      targetCam.set(0, 0.35, 0.6);
      targetLook.set(0, 0.5, -4); // Looks at center collection

      state.camera.position.lerp(targetCam, 0.015); // Very slow ease-in glide
      currentLookAt.current.lerp(targetLook, 0.015);
      state.camera.lookAt(currentLookAt.current);
      return;
    }

    // 2. Focused Frame Zoom-In Mode
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

    // 3. Default Parallax & Idle Mode
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
const LightingController: React.FC<{ selectedId: string | null; isIntroActive: boolean }> = ({ selectedId, isIntroActive }) => {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dir1Ref = useRef<THREE.DirectionalLight>(null);
  const dir2Ref = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    const isAnySelected = selectedId !== null;
    
    // Target light values (ambient fades up slowly on intro)
    const targetAmbient = isIntroActive ? 0.02 : (isAnySelected ? 0.04 : 0.2);
    const targetDir1 = isIntroActive ? 0.05 : (isAnySelected ? 0.08 : 0.4);
    const targetDir2 = isIntroActive ? 0.08 : (isAnySelected ? 0.12 : 0.7);

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
      <ambientLight ref={ambientRef} intensity={0.01} color="#F7F7F7" />
      <directionalLight ref={dir1Ref} position={[-6, 6, -2]} intensity={0.1} color="#8A8A8A" />
      <directionalLight ref={dir2Ref} position={[6, 4, 2]} intensity={0.1} color="#C9A45D" />
    </>
  );
};

// Dynamics controllers for spotlight tracking the active/hovered framed artwork
const SpotlightController: React.FC<{
  selectedId: string | null;
  collections: GalleryCollection[];
  isIntroActive: boolean;
}> = ({ selectedId, collections, isIntroActive }) => {
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!spotLightRef.current || !targetRef.current) return;
    
    // Spotlight targets the selected frame, or center featured frame during introduction
    let targetPos = new THREE.Vector3(0, 0.5, -4);
    const activeId = selectedId;
    
    if (isIntroActive) {
      targetPos.set(0, 0.5, -4); // Lock spotlight target strictly on featured frame
    } else if (activeId) {
      const idx = collections.findIndex((c) => c.id === activeId);
      if (idx !== -1) {
        const [x, y, z] = getFramePosition(idx);
        targetPos.set(x, y, z);
      }
    }
    
    // Soft spotlight intensity mapping (soft on intro, higher on selected mesh)
    const targetIntensity = isIntroActive ? 12 : (selectedId ? 32 : 16);
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
        intensity={12}
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
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isIntroActive, setIsIntroActive] = useState(false);

  // Type-safe collection details state (only loads images when selected)
  const [selectedDetail, setSelectedDetail] = useState<PublicCollectionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // 1. Determine if introduction sequence runs (skip if session flag is set or reduced motion is active)
  useEffect(() => {
    const introPlayed = sessionStorage.getItem('apco-exhibition-intro-played') === 'true';
    if (!prefersReducedMotion && !introPlayed) {
      setIsIntroActive(true);
    }
  }, [prefersReducedMotion]);

  // 2. Fetch detailed collection data on-demand after selection
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

  // 3. Accessibility: Escape key resets selection during camera travel or intro
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isIntroActive) {
          handleBeginExhibition();
        } else if (selectedId) {
          setSelectedId(null);
          setShowOverlay(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, isIntroActive]);

  const handleCloseOverlay = () => {
    setSelectedId(null);
    setShowOverlay(false);
  };

  const handleBeginExhibition = () => {
    sessionStorage.setItem('apco-exhibition-intro-played', 'true');
    setIsIntroActive(false);
  };

  const isAnySelected = selectedId !== null;

  return (
    <div className="relative w-full h-[70vh] sm:h-[80vh] md:h-[85vh] bg-[#0B0B0B] overflow-hidden select-none border-b border-white/5">
      {/* 1. Ambient Spot Light Glow Effect */}
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
        camera={{ position: [0, 1.2, 9.0], fov: 60 }} // Camera starts back for guided intro sequence
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        {/* Background matte color */}
        <color attach="background" args={['#0B0B0B']} />
        
        {/* Cinematic depth fog */}
        <fog attach="fog" args={['#0B0B0B', 4, 18]} />

        {/* 5. Lighting Setup (Dim background lights dynamically when selection is active) */}
        <LightingController selectedId={selectedId} isIntroActive={isIntroActive} />

        {/* Golden Spotlight controller */}
        <SpotlightController 
          selectedId={selectedId}
          collections={finalCollections}
          isIntroActive={isIntroActive}
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
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            isIntroActive={isIntroActive}
          />
        </Suspense>

        {/* 8. Camera Parallax & Zoom Transition Control */}
        <CameraControl 
          selectedId={selectedId}
          showOverlay={showOverlay}
          collections={finalCollections}
          onArrivalComplete={() => setShowOverlay(true)}
          prefersReducedMotion={prefersReducedMotion}
          isIntroActive={isIntroActive}
        />
      </Canvas>

      {/* 9. Cinematic Fade from Black Cover (Only plays once per session, skipped if reduced motion active) */}
      {!sessionStorage.getItem('apco-exhibition-intro-played') && !prefersReducedMotion && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 2.2, ease: 'easeInOut' }}
          className="absolute inset-0 bg-[#0B0B0B] z-30 pointer-events-none"
        />
      )}

      {/* 10. Minimal Interaction HUD Panel (Hide during intro or selection) */}
      {!isAnySelected && !isIntroActive && (
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

      {/* 11. Guided Introduction Overlay */}
      <AnimatePresence>
        {isIntroActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-20 flex flex-col justify-center items-center bg-black/40 text-center select-none"
          >
            <motion.span
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 1.0 }}
              className="text-[9px] font-mono tracking-[0.35em] text-[#C9A45D] uppercase mb-4"
            >
              Artisans Co. Gallery Curation
            </motion.span>
            <motion.h1
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1, duration: 1.2 }}
              className="text-4xl md:text-5xl font-black uppercase text-[#F7F7F7] font-serif-luxury tracking-wide mb-3 px-4 leading-none"
            >
              Welcome to the Exhibition
            </motion.h1>
            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.4, duration: 1.2 }}
              className="text-xs text-zinc-400 font-sans tracking-widest uppercase mb-10 px-4"
            >
              Explore our finest wedding stories.
            </motion.p>
            <motion.button
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.8 }}
              onClick={handleBeginExhibition}
              className="px-10 py-4 rounded-full bg-[#C9A45D] text-black text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:scale-105 transition-all duration-300 cursor-pointer shadow-[0_0_30px_rgba(201,164,93,0.3)] focus:outline-none focus:ring-1 focus:ring-[#C9A45D]"
            >
              Begin Exhibition
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 12. Slide-in Editorial Panel Overlay */}
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
