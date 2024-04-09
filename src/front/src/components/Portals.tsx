import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ethereumAddressToColor,
    massToRadius,
} from "../../../core/funcs/utils";
import { currentState } from "../../../core/world";
import { useFrame, useThree } from "@react-three/fiber";
import { PortalState } from "../../../core/types/state";
import { snapshotCurrentState } from "../../../core/snapshots";
import { PortalsInfo } from "./PortalsInfo";
import { PortalsControlsEmit } from "./PortalsControlsEmit";
import { MeshDistortMaterial, MeshWobbleMaterial, Outlines, PointMaterial, Sparkles, useCamera } from "@react-three/drei";
import { darkenColor, lightenColor } from "../utils";
import { useDispatch, useSelector } from "react-redux";
import {
    setIsBubbleSelected,
    setSelectedEntityId,
} from "../store/interpolation";
import { MathUtils } from "three";

import { useWallets } from "@privy-io/react-auth";

import vertexShader from "../shaders/portalVertexShader.glsl?raw";
import fragmentShader from "../shaders/portalFragmentShader.glsl?raw";
import Outline from "./Outline";

export const CustomGeometryParticles = (props: { count: number, radius: number, position: THREE.Vector3, color: THREE.Color | string }) => {
  const { count, radius, position, color } = props;
  const { camera } = useThree()
  const zoom = camera.zoom
  console.log("zoom:", zoom)

  // This reference gives us direct access to our points
  const points = useRef();

  // Generate our positions attributes array
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
        //distance is between radius and 2*radius
      const distance = (Math.random() * radius * 2) - radius;
      const theta = THREE.MathUtils.randFloatSpread(360); 
  
      let x = distance * Math.cos(theta);
      let y = distance * Math.sin(theta);
      // Since we're working in a 2D plane, z will always be 0
      let z = 0;
  
      positions.set([x, y, z], i * 3);
    }
    
    return positions;
  }, [count, radius]);

  const uniforms = useRef({
    uTime: { value: 0.0 },
    uRadius: { value: radius },
    uColor: { value: (new THREE.Color(color)).convertLinearToSRGB() },
    uZoom: { value: zoom },
  }).current;

  useEffect(() => {
    uniforms.uRadius.value = radius;
    uniforms.uColor.value = new THREE.Color(color).convertLinearToSRGB();
    uniforms.uZoom.value = zoom;
  }, [radius, color, zoom]);
  

  useFrame(() => {
    uniforms.uTime.value += 0.01;
    points.current.material.uniforms = uniforms; // Ensure uniforms are correctly referenced
  
    // Other updates...
  });

  return (
    <points ref={points} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        depthWrite={false}
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        uniforms={uniforms}
      />
    </points>
  );
};


export const Portal = ({ portalId }: { portalId: string }) => {
    const { wallets } = useWallets();

    const connectedAddress = wallets[0]?.address ? `${wallets[0].address}` : "";
    const meshRef = useRef<any>();
    const [isHovered, setIsHovered] = useState<boolean>(false);
    //const [ isSelected, setIsSelected ] = useState<boolean>(false)
    const dispatch = useDispatch();
    const setIsSelected = (isSelected1: boolean) => {
        dispatch(setIsBubbleSelected(isSelected1));
        dispatch(setSelectedEntityId(isSelected1 ? portalId : null));
    };
    const selectedBubbleId = useSelector(
        (state: any) => state.interpolation.selectedEntityId,
    );
    const isBubbleSelected = useSelector(
        (state: any) => state.interpolation.isBubbleSelected,
    );
    const isSelected = isBubbleSelected && selectedBubbleId == portalId;
    
    const portal = currentState.portals.find(
        (portal) => portal.id === portalId,
    );
    const radius = massToRadius(portal.mass);

    useFrame(() => {
        const portal = currentState.portals.find(
            (portal) => portal.id === portalId,
        );
        if (!portal) return;
        const radius = massToRadius(portal.mass);
        const newRadius = MathUtils.lerp(meshRef.current.scale.x, radius, 0.1);
        meshRef.current.scale.set(newRadius, newRadius, newRadius);
        //console.log("portal position:", portal.position)
        meshRef.current.position.set(portal.position.x, portal.position.y, 0);
        meshRef.current.updateMatrix();
    });

    // Calculate the outline color based on the Ethereum address
    const baseColor = ethereumAddressToColor(portalId);
    const outlineColor = lightenColor(baseColor, 0.3);

    useEffect(() => {
        //console.log("setIsBubbleSelected: ui", isSelected)
        dispatch(setIsBubbleSelected(isSelected));
    }, [isSelected]);

    return (
        <>
          <CustomGeometryParticles 
            count={60} 
            radius={radius*4.2}
            position={new THREE.Vector3(portal.position.x, portal.position.y, 0)} 
            color={baseColor}
          />
            <mesh
                onPointerEnter={() => {
                    if (!isSelected) setIsHovered(true);
                }}
                onPointerLeave={() => setIsHovered(false)}
                onClick={() => {
                    if (
                        connectedAddress.toLowerCase() ===
                        portalId.toLowerCase()
                    ) {
                        setIsSelected(!isSelected);
                        setIsHovered(false);
                    }
                }}
                onContextMenu={() => setIsSelected(false)}
                ref={meshRef}
            >
                <sphereGeometry />
                <Outlines thickness={0.05} color={'black'} />
                <meshBasicMaterial 
                  color={baseColor} 
                />
            </mesh>
            {isSelected && (
                <PortalsControlsEmit
                    isHovered={isHovered}
                    portalId={portalId}
                />
            )}
            
            <PortalsInfo portalId={portalId} />
        </>
    );
};

export const Portals = ({ portals }: { portals: string[] }) => {
    return portals.map((portal, index) => (
        <Portal key={index} portalId={portal} />
    ));
};
