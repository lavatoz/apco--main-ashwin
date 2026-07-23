import React from 'react';
import { useThree } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';

export const ExhibitionFloor: React.FC = () => {
  const { size } = useThree();
  const isMobile = size.width < 600;
  const isTablet = size.width >= 600 && size.width < 1024;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      {isMobile ? (
        // Mobile: Flat matte floor to completely disable pixel shader reflection overhead
        <meshStandardMaterial 
          color="#0B0B0B" 
          roughness={0.9} 
          metalness={0.15} 
        />
      ) : isTablet ? (
        // Tablet: Scaled down reflections with lower resolution and larger blur radius
        <MeshReflectorMaterial
          blur={[200, 80]}
          resolution={256}
          mixBlur={1}
          mixStrength={8}
          roughness={1}
          depthScale={1.0}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0B0B0B"
          metalness={0.5}
          mirror={0.6}
        />
      ) : (
        // Desktop: Premium full fidelity real-time blurred reflections
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={12}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0B0B0B"
          metalness={0.7}
          mirror={0.8}
        />
      )}
    </mesh>
  );
};

export default ExhibitionFloor;
