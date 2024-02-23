import { Text, Text3D } from "@react-three/drei"
import { currentState } from "../../../core/world"
import { massToRadius, truncateAddress } from "../../../core/funcs/utils"
import * as THREE from 'three'
import { CustomText } from "./CustomText"
import { ResourceType } from "../../../core/types/resource"



export const BubblesInfo = ({ bubbleId } : { bubbleId: string }) => {
    const bubble = currentState.bubbles.find(bubble => bubble.id === bubbleId)
    if(!bubble) return null
    const radius = massToRadius(bubble.mass)
    const textPosition = new THREE.Vector3(bubble.position.x, bubble.position.y, 0)
    const zeroPosition = new THREE.Vector3(0, 0, 0)
    const lineHeightVector = new THREE.Vector3(0, -radius/3, 0)
    const pos1 = textPosition.clone().add(lineHeightVector.clone().multiplyScalar(0)).clone()
    const pos2 = textPosition.clone().add(lineHeightVector.clone().multiplyScalar(1)).clone()
    const pos3 = textPosition.clone().add(lineHeightVector.clone().multiplyScalar(2)).clone()
    const energy = bubble.resources
        .find(resource => resource.resource == ResourceType.Energy)
    const energyAmount = energy ? energy.mass : 0
   //console.log("resources main", bubble.resources)
    return (
        <>

            <CustomText 
                size={radius/6}
                position={textPosition}
            >
                {truncateAddress(bubble.owner)}
            </CustomText>
            <group position={pos2}
            
            >
            <CustomText
                size={radius/10}
                color="green"
                position={new THREE.Vector3(-0, 0, 0)}
                anchorX="right"
                noOutline={true}
            >
                {(bubble.mass - energyAmount).toFixed(2)} ETH

            </CustomText>
            <CustomText
                size={radius/10}
                color="blue"
                position={new THREE.Vector3(radius/7, 0, 0)}
                anchorX="left"
                noOutline={true}
                >
                {energyAmount.toFixed(2)} EP
                </CustomText>
            </group>
            
        </>
    )
}