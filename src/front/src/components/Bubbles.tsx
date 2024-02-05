import { BubbleState } from '../../../core/types/state'
import { ethereumAddressToColor, massToRadius } from '../../../core/funcs/utils'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { currentState } from '../../../core/world'
import { snapshotCurrentState } from '../../../core/snapshots'
import { BubblesInfo } from './BubblesInfo'
import { BubblesControlsEmit } from './BubblesControlsEmit'
import { Outlines } from '@react-three/drei'
import { darkenColor } from '../utils'
import { MathUtils } from 'three'
import { bubbleStartPositions } from './Game'
import { useDispatch } from 'react-redux'
import { setIsBubbleSelected } from '../store/interpolation'
import { is } from '@react-three/fiber/dist/declarations/src/core/utils'
import { CustomText } from './CustomText'



export const Bubble = ({ bubbleId } : { bubbleId: string }) => {
    const meshRef = useRef<any>()
    const [ isHovered, setIsHovered ] = useState<boolean>(false)
    const [ isSelected, setIsSelected ] = useState<boolean>(false)
    const dispatch = useDispatch()

    useFrame(() => {
        const bubble = currentState.bubbles.find(bubble => bubble.id === bubbleId)
        if(!bubble) {
            console.log("bubble not found")
            return
        }

        if(!meshRef.current) {
            console.log("bubble not found")
            return
        }

        if(!meshRef.current.position.x || !meshRef.current.position.y) {
            const startPosition = bubbleStartPositions[bubbleId]
            if(startPosition) {
                meshRef.current.position.set(startPosition.x, startPosition.y, 0)
            }
            else {
                console.log("bubble start position not found")
            }
            console.log("bubble not found")
        }
        const radius = massToRadius(bubble.mass)
        const newRadius = MathUtils.lerp(meshRef.current.scale.x, radius, 0.1)
        meshRef.current.scale.set(newRadius, newRadius, newRadius)
        console.log("bubble position:", bubble.position)
        const newX = MathUtils.lerp(meshRef.current.position.x, bubble.position.x, 0.1)
        const newY = MathUtils.lerp(meshRef.current.position.y, bubble.position.y, 0.1)
        meshRef.current.position.set(newX, newY, 0)
        meshRef.current.updateMatrix()
    })  
    
    const baseColor = ethereumAddressToColor(bubbleId.substring(0, bubbleId.length-2));
    const outlineColor = darkenColor(baseColor, 0.2); // Darken by 20%

    useEffect(() => {
        console.log("setIsBubbleSelected: ui", isSelected)
        dispatch(setIsBubbleSelected(isSelected))
    }, [isSelected])
    
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
                    color={ethereumAddressToColor(bubbleId.substring(0, bubbleId.length-2))}
                    />
            </mesh>
            
            {isSelected && <BubblesControlsEmit isHovered={isHovered} bubbleId={bubbleId} />}
            <BubblesInfo bubbleId={bubbleId} />
            
        </>
        
    )
}

export const Bubbles = ({ bubbles } : { bubbles: string[] }) => {
    return bubbles
        .map((bubble, index) => 
            <Bubble key={index} bubbleId={bubble} />)
}
