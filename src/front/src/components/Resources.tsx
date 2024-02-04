import { BubbleState } from '../../../core/types/state'
import { ethereumAddressToColor, massToRadius } from '../../../core/funcs/utils'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { currentState } from '../../../core/world'
import { snapshotCurrentState } from '../../../core/snapshots'
import { Outlines } from '@react-three/drei'
import { darkenColor } from '../utils'

export const Resource = ({ resourceId } : { resourceId: string }) => {
    const meshRef = useRef<any>()
    const [ isHovered, setIsHovered ] = useState<boolean>(false)
    const [ isSelected, setIsSelected ] = useState<boolean>(false)
    useFrame(() => {
        const resource = currentState.resources.find(resource => resource.id === resourceId)
        if(!resource) return
        const radius = massToRadius(resource.mass)
        meshRef.current.scale.set(radius, radius, radius)
        console.log("resource position:", resource.position)
        meshRef.current.position.set(resource.position.x, resource.position.y, 0)
        meshRef.current.updateMatrix()
    })  
    
    //blue in hex
    const baseColor = "#ADD8E6";
    const outlineColor = darkenColor(baseColor, 0.2); // Darken by 20%
    
    return (
        <>
        <mesh
            ref={meshRef}
            onPointerEnter={() => {if(!isSelected)setIsHovered(true)}}
            onPointerLeave={() => setIsHovered(false)}
            onClick={() => {setIsSelected(!isSelected); setIsHovered(false)}}
            onContextMenu={() => setIsSelected(false)}
            >
                <sphereGeometry />
                <Outlines thickness={0.1} color={outlineColor} />
                <meshBasicMaterial
                    color={baseColor}
                    />
            </mesh>
            
        </>
        
    )
}

export const Resources = ({ resources } : { resources: string[] }) => {
    return resources
        .map((resource, index) => 
            <Resource key={index} resourceId={resource} />)
}
