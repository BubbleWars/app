import { Text } from "@react-three/drei";
import * as THREE from "three";

export const CustomText = ({ children, position, color='white', size=8, anchorX='center', anchorY='middle' } : { children: string, position: THREE.Vector3, color: string, size: number, anchorX: string, anchorY: string }) => {
    return (
        <Text 
            font="fonts/PressStart2P-Regular.ttf"
            color={color}
            fontSize={size/2}
            outlineColor={'black'}
            outlineWidth={size/20}
            anchorX={anchorX}
            anchorY={anchorY}
            position={position.clone().add(new THREE.Vector3(0, 0, 6))}
        >
            {children}
        </Text>
    )
}