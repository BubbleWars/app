import { Text } from "@react-three/drei"
import { currentState } from "../../../core/world"
import { massToRadius, truncateAddress } from "../../../core/funcs/utils"
import THREE from "three"



export const PortalsInfo = ({ portalId } : { portalId: string }) => {
    const portal = currentState.portals.find(portal => portal.id === portalId)
    if(!portal) return null
    const radius = massToRadius(portal.mass)
    const textPosition = new THREE.Vector3(portal.position.x+radius, portal.position.y+radius, 0)
    const lineHeightVector = new THREE.Vector3(0, 3, 0)
    return (
        <>
            <Text 
                position={textPosition.add(lineHeightVector.multiplyScalar(2))}
                color='grey'
                anchorX={'left'}
                anchorY={'bottom'}
            >{truncateAddress(portal.owner)}</Text>
            <Text
                position={textPosition.add(lineHeightVector.multiplyScalar(1))}
                color='green'
                anchorX={'left'}
                anchorY={'bottom'}
            >{portal.mass.toFixed(6)} ETH</Text>
            <Text
                position={textPosition.add(lineHeightVector.multiplyScalar(0))}
                color='blue'
                anchorX={'left'}
                anchorY={'bottom'}
            >0 ENERGY</Text>
        </>
    )
}