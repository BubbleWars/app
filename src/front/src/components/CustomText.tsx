import { Text } from "@react-three/drei";
import * as THREE from "three";

export const CustomText = ({ children, position, color='white', size=8, anchorX='center', anchorY='middle', noOutline=false } : { children: string, position: THREE.Vector3, color: string, size: number, anchorX: string, anchorY: string, noOutline:boolean }) => {
    return (
        <Text 
            font="fonts/PressStart2P-Regular.ttf"
            color={color}
            fontSize={size}
            outlineColor={'black'}
            outlineWidth={!noOutline ? size/5: 0}
            anchorX={anchorX}
            anchorY={anchorY}
            position={position.clone().add(new THREE.Vector3(0, 0, 6))}
        >
            <meshBasicMaterial toneMapped={false} />
            {children}
        </Text>
    )
}