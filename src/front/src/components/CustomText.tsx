import { Text3D } from "@react-three/drei";
import * as THREE from "three";

export const CustomText = ({ children, position, color='white', size } : { children: string, position: THREE.Vector3, color: string, size: number }) => {
    return (
        <Text3D 
            size={size}
            font="./fonts/helvetiker.json"
            position={position.clone().add(new THREE.Vector3(0, 0, 5))}
        >
            <meshBasicMaterial color={color} />
            {children}
        </Text3D>
    )
}