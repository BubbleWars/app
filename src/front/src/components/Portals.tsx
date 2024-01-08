import * as THREE from 'three'
import { useEffect, useRef, useState } from "react"
import { ethereumAddressToColor, massToRadius } from '../../../core/funcs/utils'
import { currentState } from '../../../core/world'
import { useFrame } from '@react-three/fiber'
import { PortalState } from '../../../core/types/state'
import { snapshotCurrentState } from '../../../core/snapshots'
import { PortalsInfo } from './PortalsInfo'
import { PortalsControlsEmit } from './PortalsControlsEmit'


export const Portal = ({ portalId } : { portalId: string }) => {
    const meshRef = useRef<any>()
    const [ isHovered, setIsHovered ] = useState<boolean>(false)
    const [ isSelected, setIsSelected ] = useState<boolean>(false)
    useFrame(() => {
        const portal = currentState.portals.find(portal => portal.id === portalId)
        if(!portal) return
        const radius = massToRadius(portal.mass)
        meshRef.current.scale.set(radius, radius, radius)
        console.log("bubble position:", portal.position)
        meshRef.current.position.set(portal.position.x, portal.position.y, 0)
        meshRef.current.updateMatrix()
    })    
    return (
        <mesh
            ref={meshRef}
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={() => setIsHovered(false)}
            onClick={() => setIsSelected(!isSelected)}
            onContextMenu={() => setIsSelected(false)}

        >
            <sphereGeometry />
            <meshBasicMaterial
                opacity={0.8}
                color={ethereumAddressToColor(portalId)}
                transparent
            />
            {isHovered && <PortalsInfo  portalId={portalId} />}
            {isSelected && <PortalsControlsEmit portalId={portalId} />}
        </mesh>
    )
}

export const Portals = ({ portals } : { portals: string[] }) => {
    return portals
        .map((portal, index) => 
            <Portal key={index} portalId={portal} />)
}