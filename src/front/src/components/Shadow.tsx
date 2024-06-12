// ShadowMesh.tsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { MeshProps, useThree } from '@react-three/fiber';

interface ShadowMeshProps extends MeshProps {
  originalMesh: React.ReactElement;
  originalRef: React.MutableRefObject<THREE.Mesh>;
}

const ShadowMesh: React.FC<ShadowMeshProps> = ({ originalMesh, originalRef,  ...props }) => {
  const shadowRef = useRef<THREE.Mesh>(null);
  const { scene } = useThree();

  useEffect(() => {
    if (shadowRef.current) {
      shadowRef.current.renderOrder = -10; // Ensure shadow is rendered behind
    }
  }, []);

  useFrame(() => {
    if (shadowRef.current && originalRef.current) {
      shadowRef.current.position.copy(originalRef.current.position);
      shadowRef.current.rotation.copy(originalRef.current.rotation);
      shadowRef.current.scale.copy(originalRef.current.scale);

      // Move shadow back and down
      shadowRef.current.position.y -= originalRef.current.scale.y * 0.12;
      shadowRef.current.position.x += originalRef.current.scale.x * 0.12;
      shadowRef.current.position.z -= originalRef.current.scale.z + 5;
      shadowRef.current.scale.x += originalRef.current.scale.x * 0.03;
      shadowRef.current.scale.y += originalRef.current.scale.y * 0.03;
      //shadowRef.current.scale.set(1.03, 1.03, 1.03);
      //shadowRef.current.renderOrder = -10; // Ensure shadow is rendered behind

    }else{
      shadowRef.current.visible = false;
    }
  });

  // Extract the geometry type and args from the original mesh
  const geometryType = originalMesh.props.children[0].type;
  const geometryArgs = originalMesh.props.children[0].props.args || [];

  return (
    <>
      <mesh ref={shadowRef} {...props}>
        {React.createElement(geometryType, { args: geometryArgs })}
        <meshBasicMaterial color="black" opacity={0.2} transparent />
      </mesh>
      {originalMesh}
    </>
  );
};

export default ShadowMesh;
