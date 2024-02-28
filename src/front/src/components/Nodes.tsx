import { BubbleState } from "../../../core/types/state";
import {
  ethereumAddressToColor,
  massToRadius,
} from "../../../core/funcs/utils";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { currentState } from "../../../core/world";
import { snapshotCurrentState } from "../../../core/snapshots";
import { Outlines, Sparkles } from "@react-three/drei";
import { darkenColor } from "../utils";

export const Node = ({ nodeId }: { nodeId: string }) => {
  const meshRef = useRef<any>();
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isSelected, setIsSelected] = useState<boolean>(false);
  useFrame(() => {
    const node = currentState.nodes.find((node) => node.id === nodeId);
    if (!node) return;
    const radius = massToRadius(Math.max(node.mass, 1));
    meshRef.current.scale.set(radius, radius, radius);
    //console.log("node position:", node.position)
    meshRef.current.position.set(node.position.x, node.position.y, 0);
    meshRef.current.updateMatrix();
  });

  //blue in hex
  const baseColor = "#87CEEB";
  const outlineColor = darkenColor(baseColor, 0.2); // Darken by 20%

  return (
    <>
      <mesh
        ref={meshRef}
        onPointerEnter={() => {
          if (!isSelected) setIsHovered(true);
        }}
        onPointerLeave={() => setIsHovered(false)}
        onClick={() => {
          setIsSelected(!isSelected);
          setIsHovered(false);
        }}
        onContextMenu={() => setIsSelected(false)}
      >
        <sphereGeometry />
        <Outlines thickness={0.1} color={outlineColor} />
        <meshBasicMaterial toneMapped={false} color={baseColor} />
        <Sparkles color={baseColor} size={1000000} count={2} speed={1} />
      </mesh>
    </>
  );
};

export const Nodes = ({ nodes }: { nodes: string[] }) => {
  return nodes.map((node, index) => <Node key={index} nodeId={node} />);
};
