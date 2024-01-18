import { Text, Text3D } from "@react-three/drei"
import { currentState } from "../../../core/world"
import { massToRadius, truncateAddress } from "../../../core/funcs/utils"
import * as THREE from 'three'
import { CustomText } from "./CustomText"



export const BubblesInfo = ({ bubbleId } : { bubbleId: string }) => {
    const bubble = currentState.bubbles.find(bubble => bubble.id === bubbleId)
    if(!bubble) return null
    const radius = massToRadius(bubble.mass)
    const textPosition = new THREE.Vector3(bubble.position.x+radius, bubble.position.y+radius, 0)
    const zeroPosition = new THREE.Vector3(0, 0, 0)
    const lineHeightVector = new THREE.Vector3(0, 1, 0)
    const pos1 = zeroPosition.clone().add(lineHeightVector.clone().multiplyScalar(0)).clone()
    const pos2 = zeroPosition.clone().add(lineHeightVector.clone().multiplyScalar(1)).clone()
    const pos3 = zeroPosition.clone().add(lineHeightVector.clone().multiplyScalar(2)).clone()

    return (
        <>
            <group 
                position={textPosition}
            >
            <CustomText 
                size={0.7}
                position={pos3}
            >
                {truncateAddress(bubble.owner)} {'\n'}
                {bubble.mass.toFixed(3)} ETH {'\n'}
                0 EP
            </CustomText>
            
            </group>
            
        </>
    )
}