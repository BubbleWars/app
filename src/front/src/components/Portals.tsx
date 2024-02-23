import * as THREE from 'three'
import { useEffect, useRef, useState } from "react"
import { ethereumAddressToColor, massToRadius } from '../../../core/funcs/utils'
import { currentState } from '../../../core/world'
import { useFrame } from '@react-three/fiber'
import { PortalState } from '../../../core/types/state'
import { snapshotCurrentState } from '../../../core/snapshots'
import { PortalsInfo } from './PortalsInfo'
import { PortalsControlsEmit } from './PortalsControlsEmit'
import { Outlines } from '@react-three/drei'
import { darkenColor } from '../utils'
import { useDispatch, useSelector } from 'react-redux'
import { setIsBubbleSelected, setSelectedEntityId } from '../store/interpolation'
import { MathUtils } from 'three'


export const Portal = ({ portalId } : { portalId: string }) => {
    const meshRef = useRef<any>()
    const [ isHovered, setIsHovered ] = useState<boolean>(false)
    //const [ isSelected, setIsSelected ] = useState<boolean>(false)
    const dispatch = useDispatch()
    const setIsSelected = (isSelected1: boolean) => {
        dispatch(setIsBubbleSelected(isSelected1))
        dispatch(setSelectedEntityId(isSelected1 ? portalId : null))
    }
    const selectedBubbleId = useSelector((state: any) => state.interpolation.selectedEntityId)
    const isBubbleSelected = useSelector((state: any) => state.interpolation.isBubbleSelected)
    const isSelected = isBubbleSelected && selectedBubbleId == portalId

    useFrame(() => {
        const portal = currentState.portals.find(portal => portal.id === portalId)
        if(!portal) return
        const radius = massToRadius(portal.mass)
        const newRadius = MathUtils.lerp(meshRef.current.scale.x, radius, 0.1)
        meshRef.current.scale.set(newRadius, newRadius, newRadius)
       //console.log("portal position:", portal.position)
        meshRef.current.position.set(portal.position.x, portal.position.y, 0)
        meshRef.current.updateMatrix()
    })  
    
    // Calculate the outline color based on the Ethereum address
    const baseColor = ethereumAddressToColor(portalId);
    const outlineColor = darkenColor(baseColor, 0.2); // Darken by 20%

    useEffect(() => {
       //console.log("setIsBubbleSelected: ui", isSelected)
        dispatch(setIsBubbleSelected(isSelected))
    }, [isSelected])

    return (
        <>
            <mesh
            onPointerEnter={() => {if(!isSelected)setIsHovered(true)}}
            onPointerLeave={() => setIsHovered(false)}
            onClick={() => {setIsSelected(!isSelected); setIsHovered(false)}}
            onContextMenu={() => setIsSelected(false)}
                ref={meshRef}
                >
                <sphereGeometry />
                <Outlines thickness={0.1} color={outlineColor} />
                <meshBasicMaterial
                toneMapped={false}
                    color={baseColor}
                />
            </mesh>
            {isSelected && <PortalsControlsEmit isHovered={isHovered} portalId={portalId} />}
            <PortalsInfo portalId={portalId} />
        </>
        
    )
}

export const Portals = ({ portals } : { portals: string[] }) => {
    return portals
        .map((portal, index) => 
            <Portal key={index} portalId={portal} />)
}