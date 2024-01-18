import { Text } from "@react-three/drei";
import * as THREE from "three";

export const CustomText = ({ children, position, color='white', size } : { children: string, position: THREE.Vector3, color: string, size: number }) => {
    return (
        <Text 
            color={'#ffffff'}
            fontSize={5}
            outlineColor={'black'}
            outlineWidth={0.4}
            anchorX={'left'}
            anchorY={'bottom'}
            position={position.clone().add(new THREE.Vector3(0, 0, 5))}
        >
            {children}
        </Text>
    )
}