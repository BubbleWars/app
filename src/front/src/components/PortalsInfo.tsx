import { Text } from "@react-three/drei"
import { currentState } from "../../../core/world"
import { massToRadius, truncateAddress } from "../../../core/funcs/utils"
import * as THREE from 'three'



export const PortalsInfo = ({ portalId } : { portalId: string }) => {
    // const portal = currentState.portals.find(portal => portal.id === portalId)
    // const radius = massToRadius(portal.mass)
    // const textPosition = new THREE.Vector3(portal.position.x+radius, portal.position.y+radius, 0)
    // const lineHeightVector = new THREE.Vector3(0, 0.5, 0)
    // const pos1 = textPosition.clone().add(lineHeightVector.clone().multiplyScalar(0)).clone()
    // const pos2 = textPosition.clone().add(lineHeightVector.clone().multiplyScalar(1)).clone()
    // const pos3 = textPosition.clone().add(lineHeightVector.clone().multiplyScalar(2)).clone()
    // if(!portal) return null
    return (
        <>
            <Text 
            fontSize={0.4}
                position={new THREE.Vector3(10, 10, 0)}
                color='grey'
                anchorX={'left'}
                anchorY={'bottom'}
            >Test</Text>
            {/* <Text 
            fontSize={0.4}
                position={pos3}
                color='grey'
                anchorX={'left'}
                anchorY={'bottom'}
            >{truncateAddress(portal.owner)}</Text>
            <Text
                fontSize={0.4}
                position={pos2}
                color='green'
                anchorX={'left'}
                anchorY={'bottom'}
            >{portal.mass.toFixed(6)} ETH</Text>
            <Text
                fontSize={0.4}
                position={pos1}
                color='blue'
                anchorX={'left'}
                anchorY={'bottom'}
            >0 ENERGY</Text> */}
        </>
    )
}