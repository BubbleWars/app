import { Text3D } from "@react-three/drei"
import { currentState } from "../../../core/world"
import { massToRadius, truncateAddress } from "../../../core/funcs/utils"
import * as THREE from 'three'
import { CustomText } from "./CustomText"



export const PortalsInfo = ({ portalId } : { portalId: string }) => {
    const portal = currentState.portals.find(portal => portal.id === portalId)
    if(!portal) return null
    const radius = massToRadius(portal.mass)
    const textPosition = new THREE.Vector3(portal.position.x+radius, portal.position.y+radius, 0)
    const lineHeightVector = new THREE.Vector3(0, 2, 0)
    const pos1 = textPosition.clone().add(lineHeightVector.clone().multiplyScalar(0)).clone()
    const pos2 = textPosition.clone().add(lineHeightVector.clone().multiplyScalar(1)).clone()
    const pos3 = textPosition.clone().add(lineHeightVector.clone().multiplyScalar(2)).clone()

    return (
        <>
            <CustomText 
                size={0.7}
                color="white"
                position={pos3}
            >
                {truncateAddress(portal.owner)} {'\n'}
                {portal.mass.toFixed(3)} ETH {'\n'}
                0 EP
            </CustomText>
            
        </>
    )
}