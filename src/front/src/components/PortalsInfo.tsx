import { Text3D } from "@react-three/drei"
import { currentState } from "../../../core/world"
import { massToRadius, truncateAddress } from "../../../core/funcs/utils"
import * as THREE from 'three'
import { CustomText } from "./CustomText"



export const PortalsInfo = ({ portalId } : { portalId: string }) => {
    const portal = currentState.portals.find(portal => portal.id === portalId)
    if(!portal) return null
    const radius = massToRadius(portal.mass)
    const textPosition = new THREE.Vector3(portal.position.x, portal.position.y, 0)
    const lineHeightVector = new THREE.Vector3(0, -1.5, 0)
    const pos1 = textPosition.clone().add(lineHeightVector.clone().multiplyScalar(0)).clone()
    const pos2 = textPosition.clone().add(lineHeightVector.clone().multiplyScalar(1)).clone()
    const pos3 = textPosition.clone().add(lineHeightVector.clone().multiplyScalar(2)).clone()

    return (
        <>
            <CustomText 
                size={radius/3}
                color="white"
                position={textPosition}
            >
                {truncateAddress(portal.owner)}
            </CustomText>
            <group position={pos2}
            
            >
            <CustomText
                size={radius/7}
                color="green"
                position={new THREE.Vector3(-0, 0, 0)}
                anchorX="right"
            >
                {portal.mass.toFixed(2)} ETH

            </CustomText>
            <CustomText
                size={radius/7}
                color="blue"
                position={new THREE.Vector3(1, 0, 0)}
                anchorX="left"
                >
                    0.00 EP
                </CustomText>
            </group>
            
            
        </>
    )
}