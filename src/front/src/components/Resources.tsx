import { resourceState } from '../../../core/types/state'
import { ethereumAddressToColor, massToRadius } from '../../../core/funcs/utils'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { currentState, resources } from '../../../core/world'
import { snapshotCurrentState } from '../../../core/snapshots'
import { Outlines, Sparkles, Text } from '@react-three/drei'
import { darkenColor } from '../utils'
import { resourceStartPositions } from './Game'
import { MathUtils } from 'three'
import { CustomText } from './CustomText'
import { Vec2 } from 'planck-js'

export const Resource = ({ resourceId } : { resourceId: string }) => {
    const meshRef = useRef<any>()
    const [ textPosition, setTextPosition ] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0))
    const [ isHovered, setIsHovered ] = useState<boolean>(false)
    const [ isSelected, setIsSelected ] = useState<boolean>(false)
    const [ disableLerp, setDisableLerp ] = useState<boolean>(false)
    const resource = currentState.resources.find(resource => resource.id === resourceId)
    const mass = resource?.mass.toFixed(2) ?? "0";
    const radius = massToRadius(parseInt(mass ?? "0")) +0.1;
    const velocity = resources.get(resourceId)?.body.getLinearVelocity()
    const kineticEnergy = velocity?.clone().lengthSquared() * resource?.mass

    useFrame(() => {
        const resource = currentState.resources.find(resource => resource.id === resourceId)
        if(!resource) {
          //console.log("resource not found", resourceId)
           meshRef.current.position.set(0, 0, 0)
           meshRef.current.updateMatrix()
           //setDisableLerp(true)
            return
        }

        if(!meshRef.current) {
          //console.log("resource not found")
           meshRef.current.position.set(0, 0, 0)
           meshRef.current.updateMatrix()
           //setDisableLerp(true)
            return
        }

        if(!meshRef.current.position.x || !meshRef.current.position.y) {
            const startPosition = resourceStartPositions[resourceId]
           //console.log("meshRef posision", meshRef.current.position)
            if(startPosition) {
                meshRef.current.position.set(startPosition.x, startPosition.y, 0)
            }
            else {
                //return
                //get node position
                const node = currentState.nodes.find(node => node.id === resource.owner)
                if(node) {
                    meshRef.current.position.set(node.position.x, node.position.y, 0)
                }
                else {
                    meshRef.current.position.set(resource.position.x, resource.position.y, 0)
                }
               //console.log("resource start position not found")
            }
           //console.log("resource not found")
        }
        const radius = massToRadius(resource.mass) +0.1;
        const newRadius = MathUtils.lerp(meshRef.current.scale.x, radius, 0.1)
        meshRef.current.scale.set(newRadius, newRadius, newRadius)
       //console.log("resource position:", resource.position)
        const newX = MathUtils.lerp(meshRef.current.position.x, resource.position.x, 0.1)
        const newY = MathUtils.lerp(meshRef.current.position.y, resource.position.y, 0.1)
        setTextPosition(new THREE.Vector3(newX, newY, 0))
        meshRef.current.position.set(newX, newY, 0)
        meshRef.current.updateMatrix()
    })  
    
    //blue in hex
    const baseColor = "#87CEEB";
    const outlineColor = darkenColor(baseColor, 0.2); // Darken by 20%
    
    return (
        <>
            <CustomText
                position={new THREE.Vector3(radius+1, radius+0.5, 0).add(textPosition)}
                //position={textPosition}
                size={radius*2}
                color={baseColor}
                noOutline={true}
            >
                {mass} EP
            </CustomText>
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
                toneMapped={false}
                    color={kineticEnergy > 5 ? '#ff0000' : baseColor}
                    />
                    
            </mesh>
            
        </>
        
    )
}

export const Resources = ({ resources } : { resources: string[] }) => {
    return resources
        .map((resource, index) => 
            <Resource key={resource} resourceId={resource} />)
}
