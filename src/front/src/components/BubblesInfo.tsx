import { Text } from "@react-three/drei"
import { currentState } from "../../../core/world"
import { massToRadius, truncateAddress } from "../../../core/funcs/utils"
import * as THREE from 'three'



export const BubblesInfo = ({ bubbleId } : { bubbleId: string }) => {
    const bubble = currentState.bubbles.find(bubble => bubble.id === bubbleId)
    if(!bubble) return null
    const radius = massToRadius(bubble.mass)
    const textPosition = new THREE.Vector3(bubble.position.x+radius, bubble.position.y+radius, 0)
    const lineHeightVector = new THREE.Vector3(0, 2, 0)
    return (
        <>
            <Text 
                position={textPosition.add(lineHeightVector.multiplyScalar(2))}
                color='grey'
                anchorX={'left'}
                anchorY={'bottom'}
            >{truncateAddress(bubble.owner)}</Text>
            <Text
                position={textPosition.add(lineHeightVector.multiplyScalar(1))}
                color='green'
                anchorX={'left'}
                anchorY={'bottom'}
            >{bubble.mass.toFixed(6)} ETH</Text>
            <Text
                position={textPosition.add(lineHeightVector.multiplyScalar(0))}
                color='blue'
                anchorX={'left'}
                anchorY={'bottom'}
            >0 ENERGY</Text>
        </>
    )
}