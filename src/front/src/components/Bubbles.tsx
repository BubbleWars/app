import { BubbleState } from '../../../core/types/state'
import { massToRadius } from '../../../core/funcs/utils'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { currentState } from '../../../core/world'
import { snapshotCurrentState } from '../../../core/snapshots'
import { BubblesInfo } from './BubblesInfo'
import { BubblesControlsEmit } from './BubblesControlsEmit'

export const Bubble = ({ bubbleId } : { bubbleId: string }) => {
    const meshRef = useRef<any>()
    const [ isHovered, setIsHovered ] = useState<boolean>(false)
    const [ isSelected, setIsSelected ] = useState<boolean>(false)
    useFrame(() => {
        const bubble = currentState.bubbles.find(bubble => bubble.id === bubbleId)
        if(!bubble) return
        const radius = massToRadius(bubble.mass)
        meshRef.current.scale.set(radius, radius, radius)
        console.log("bubble position:", bubble.position)
        meshRef.current.position.set(bubble.position.x, bubble.position.y, 0)
        meshRef.current.updateMatrix()
    })    
    return (
        <>
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
                    color='blue'
                    transparent
                />
            </mesh>
            {isSelected && <BubblesControlsEmit bubbleId={bubbleId} />}
        </>
        
    )
}

export const Bubbles = ({ bubbles } : { bubbles: string[] }) => {
    return bubbles
        .map((bubble, index) => 
            <Bubble key={index} bubbleId={bubble} />)
}
