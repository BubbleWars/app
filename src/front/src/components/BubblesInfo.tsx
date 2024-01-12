import { Text, Text3D } from "@react-three/drei"
import { currentState } from "../../../core/world"
import { massToRadius, truncateAddress } from "../../../core/funcs/utils"
import * as THREE from 'three'



export const BubblesInfo = ({ bubbleId } : { bubbleId: string }) => {
    const bubble = currentState.bubbles.find(bubble => bubble.id === bubbleId)
    if(!bubble) return null
    const radius = massToRadius(bubble.mass)
    const textPosition = new THREE.Vector3(bubble.position.x+radius, bubble.position.y+radius, 0)
    const lineHeightVector = new THREE.Vector3(0, 2, 0)
    const pos1 = textPosition.clone().add(lineHeightVector.clone().multiplyScalar(0)).clone()
    const pos2 = textPosition.clone().add(lineHeightVector.clone().multiplyScalar(1)).clone()
    const pos3 = textPosition.clone().add(lineHeightVector.clone().multiplyScalar(2)).clone()

    return (
        <>
            <Text3D 
                font="./fonts/helvetiker.json"
                position={pos3}
            >
                <meshBasicMaterial color='black' />
                {truncateAddress(bubble.owner)}</Text3D>
            <Text3D
                font="./fonts/helvetiker.json"
                position={pos2}

            >
                <meshBasicMaterial color='black' />
                {bubble.mass.toFixed(3)} ETH</Text3D>
            <Text3D
                font="./fonts/helvetiker.json"
                position={pos1}
            >
                <meshBasicMaterial color='black' />
                0 ENERGY</Text3D>
        </>
    )
}