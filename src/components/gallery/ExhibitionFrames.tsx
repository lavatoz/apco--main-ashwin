import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { type GalleryCollection } from '../../services/gallery';
import { getFramePosition } from './CinematicExhibition3D';
import galleryPlaceholder from '../../assets/placeholders/gallery-placeholder.jpg';

interface ExhibitionFramesProps {
  collections: GalleryCollection[];
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

// Utility to safely resolve collection cover image URLs against host, falling back to local asset
const resolveImageUrl = (url: string | null | undefined): string => {
  if (!url) return galleryPlaceholder;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('/src/assets/') || url.startsWith('data:image')) {
    return url;
  }
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  try {
    const urlObj = new URL(apiUrl);
    const host = `${urlObj.protocol}//${urlObj.host}`;
    return `${host}${url.startsWith('/') ? '' : '/'}${url}`;
  } catch (e) {
    return `http://localhost:3000${url.startsWith('/') ? '' : '/'}${url}`;
  }
};

const IndividualFrame: React.FC<{
  collection: GalleryCollection;
  index: number;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}> = ({ collection, index, hoveredId, setHoveredId, selectedId, setSelectedId }) => {
  const groupRef = useRef<THREE.Group>(null);
  const goldMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const defocusMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const textureMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [textureOpacity, setTextureOpacity] = useState(0.0);
  const [textAlpha, setTextAlpha] = useState(1.0);

  const position = getFramePosition(index);
  const isPortrait = index % 3 === 0; // Staggered aspect profiles
  const width = isPortrait ? 2.2 : 3.4;
  const height = isPortrait ? 3.3 : 2.2;
  const outerWidth = width + 0.16;
  const outerHeight = height + 0.16;

  // Safe texture loading in useEffect to avoid Suspense context crashes on network 404s + clean dispose
  useEffect(() => {
    let active = true;
    let loadedTex: THREE.Texture | null = null;
    const loader = new THREE.TextureLoader();
    const safeUrl = resolveImageUrl(collection.coverImage || collection.heroImage);

    // Reset texture opacity to 0.0 on cover image updates to enforce smooth fade-in
    setTextureOpacity(0.0);

    loader.load(
      safeUrl,
      (loadedTexture) => {
        if (active) {
          setTexture(loadedTexture);
          loadedTex = loadedTexture;
        }
      },
      undefined,
      (err) => {
        console.warn(`Failed to load texture for collection: ${collection.title}, falling back.`, err);
        // Secondary local fallback loading
        loader.load(galleryPlaceholder, (fallbackTex) => {
          if (active) {
            setTexture(fallbackTex);
            loadedTex = fallbackTex;
          }
        });
      }
    );

    return () => {
      active = false;
      if (loadedTex) {
        loadedTex.dispose();
      }
    };
  }, [collection.coverImage, collection.heroImage, collection.title]);

  const isSelected = selectedId === collection.id;
  const isAnySelected = selectedId !== null;
  const isHovered = hoveredId === collection.id && !isAnySelected;
  const isSurrounding = (hoveredId !== null && hoveredId !== collection.id) || (isAnySelected && !isSelected);

  // Gentle float oscillation and minor rotational wobble + Hover/Selection easing animations
  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // 1. Position oscillation & Z push interpolation
    const speed = 0.6 + (index % 4) * 0.1;
    const offset = index * 1.2;
    
    // Slightly reduce floating amplitude on the selected artwork to keep it focused
    const floatAmp = isSelected ? 0.02 : 0.1;
    const floatY = position[1] + Math.sin(time * speed + offset) * floatAmp;
    
    // Position targets based on hover & select state (Selected artwork moves closer to camera)
    const targetZ = isSelected ? position[2] + 1.2 : (isHovered ? position[2] + 0.8 : position[2]);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, floatY, 0.08);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.08);
    
    // Very subtle yaw/pitch rotations (disable rotation on selected frame)
    const targetRotY = isSelected ? 0.0 : Math.sin(time * 0.3 * speed) * 0.015;
    const targetRotX = isSelected ? 0.0 : Math.cos(time * 0.2 * speed) * 0.01;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.08);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.08);

    // Smooth texture fade-in integration
    if (texture) {
      setTextureOpacity((prev) => THREE.MathUtils.lerp(prev, 1.0, 0.05));
    }

    // 2. Gold bezel emissive intensity animation (glow)
    if (goldMaterialRef.current) {
      const targetEmissive = isSelected ? 0.98 : (isHovered ? 0.95 : (isSurrounding ? 0.0 : 0.08));
      goldMaterialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        goldMaterialRef.current.emissiveIntensity,
        targetEmissive,
        0.08
      );
    }

    // 3. Surround defocus dimming overlay opacity animation
    if (defocusMaterialRef.current) {
      const targetOpacity = isSelected ? 0.0 : (isAnySelected ? 0.85 : (isSurrounding ? 0.65 : 0.0));
      defocusMaterialRef.current.opacity = THREE.MathUtils.lerp(
        defocusMaterialRef.current.opacity,
        targetOpacity,
        0.08
      );
    }

    // 4. Surrounding artwork dimming + texture fade-in
    if (textureMaterialRef.current) {
      const targetOpacity = isSelected ? 1.0 : (isAnySelected ? 0.15 : (isSurrounding ? 0.4 : 1.0));
      textureMaterialRef.current.opacity = THREE.MathUtils.lerp(
        textureMaterialRef.current.opacity,
        targetOpacity * textureOpacity,
        0.08
      );
    }

    // 5. Text opacity fade-out
    const targetTextAlpha = isSelected ? 0.0 : (isAnySelected ? 0.0 : (isSurrounding ? 0.25 : 1.0));
    setTextAlpha(THREE.MathUtils.lerp(textAlpha, targetTextAlpha, 0.08));
  });

  const photoCount = collection._count?.images !== undefined 
    ? collection._count.images 
    : (collection.images?.length || 0);

  return (
    <group 
      ref={groupRef} 
      position={[position[0], position[1], position[2]]}
      onPointerOver={(e) => {
        if (isAnySelected) return; // Disable hover interactions
        e.stopPropagation();
        setHoveredId(collection.id);
      }}
      onPointerOut={(e) => {
        if (isAnySelected) return; // Disable hover interactions
        e.stopPropagation();
        setHoveredId(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!isAnySelected) {
          setHoveredId(null); // lock hovered
          setSelectedId(collection.id);
        }
      }}
    >
      {/* 1. Shadow backing box */}
      <mesh castShadow receiveShadow position={[0, 0, -0.05]}>
        <boxGeometry args={[outerWidth, outerHeight, 0.05]} />
        <meshStandardMaterial color="#050505" roughness={0.9} metalness={0.2} />
      </mesh>

      {/* 2. Main Outer frame - Matte Black Bezel */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[outerWidth, outerHeight, 0.04]} />
        <meshStandardMaterial color="#111111" roughness={0.7} metalness={0.5} />
      </mesh>

      {/* 3. Gold inner frame bezel */}
      <mesh position={[0, 0, 0.021]}>
        <boxGeometry args={[width + 0.03, height + 0.03, 0.01]} />
        <meshStandardMaterial 
          ref={goldMaterialRef}
          color="#C9A45D" 
          emissive="#C9A45D"
          emissiveIntensity={0.08}
          roughness={0.25} 
          metalness={0.95} 
        />
      </mesh>

      {/* 4. Passepartout (Matte Board) - Matte Charcoal Gray */}
      <mesh position={[0, 0, 0.026]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#181818" roughness={0.95} metalness={0.1} />
      </mesh>

      {/* 5. Artwork Area */}
      <group position={[0, 0, 0.028]}>
        {texture ? (
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[width * 0.88, height * 0.84]} />
            <meshStandardMaterial 
              ref={textureMaterialRef}
              map={texture} 
              roughness={0.8}
              transparent
            />
          </mesh>
        ) : (
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[width * 0.88, height * 0.84]} />
            <meshStandardMaterial color="#141414" roughness={0.95} />
          </mesh>
        )}

        {/* 6. Surround defocus matte dimming overlay (for blurring effect) */}
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[width * 0.88, height * 0.84]} />
          <meshBasicMaterial 
            ref={defocusMaterialRef}
            color="#0B0B0B" 
            transparent 
            opacity={0} 
          />
        </mesh>
      </group>

      {/* 7. Typography details (Title, Category, Photo Count) */}
      <group position={[0, -height * 0.5 - 0.28, 0.028]}>
        <Text
          position={[0, 0.12, 0]}
          fontSize={0.10}
          color="#F7F7F7"
          fillOpacity={textAlpha}
          maxWidth={width}
          textAlign="center"
          letterSpacing={0.12}
          font="https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD7K32stqdthRYqihdDu321U.woff"
        >
          {collection.title.toUpperCase()}
        </Text>

        <Text
          position={[0, -0.04, 0]}
          fontSize={0.065}
          color="#C9A45D"
          fillOpacity={textAlpha}
          maxWidth={width}
          textAlign="center"
          letterSpacing={0.2}
        >
          {collection.category.toUpperCase()}
        </Text>

        {photoCount > 0 && (
          <Text
            position={[0, -0.16, 0]}
            fontSize={0.055}
            color="#8A8A8A"
            fillOpacity={textAlpha}
            maxWidth={width}
            textAlign="center"
            letterSpacing={0.15}
          >
            {photoCount} PLATES
          </Text>
        )}
      </group>
    </group>
  );
};

export const ExhibitionFrames: React.FC<ExhibitionFramesProps> = ({ 
  collections, 
  hoveredId, 
  setHoveredId,
  selectedId,
  setSelectedId
}) => {
  return (
    <group>
      {collections.map((collection, index) => (
        <IndividualFrame 
          key={collection.id} 
          collection={collection} 
          index={index} 
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
        />
      ))}
    </group>
  );
};

export default ExhibitionFrames;
