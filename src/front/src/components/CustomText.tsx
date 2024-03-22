import { Text } from "@react-three/drei";
import * as THREE from "three";

export const CustomText = ({
    children,
    position,
    color = "white",
    size = 8,
    anchorX = "center",
    anchorY = "middle",
    noOutline = false,
}:
    | {
          children: string | undefined;
          position: THREE.Vector3;
          color: string;
          size: number;
          anchorX: string;
          anchorY: string;
          noOutline: boolean;
      }
    | any) => {
    return (
        <Text
            font="fonts/whitrabt.ttf"
            color={color}
            fontSize={size}
            outlineColor={"black"}
            outlineWidth={0.11}
            anchorX={anchorX as any}
            anchorY={anchorY as any}
            position={position.clone().add(new THREE.Vector3(0, 0, 6))}
        >
            <meshBasicMaterial toneMapped={false} />
            {children}
        </Text>
    );
};
