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
            font="fonts/LilitaOne-Regular.ttf"
            color={color}
            letterSpacing={-0.0}
            fontWeight="bold"
            fontSize={size}
            outlineColor={"black"}
            outlineWidth={size * 0.05}
            anchorX={anchorX as any}
            anchorY={anchorY as any}
            position={position.clone().add(new THREE.Vector3(0, 0, 6))}
        >
            <meshBasicMaterial toneMapped={false} />
            {children}
        </Text>
    );
};
