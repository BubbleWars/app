import THREE from "three"
import { massToRadius } from "../../../core/funcs/utils"
import { currentState } from "../../../core/world"
import { useEffect, useRef, useState } from "react"
import { Line, Text } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useCreateInput, useOnClick, useOnWheel } from "../hooks/inputs"
import { Emit, InputType } from "../../../core/types/inputs"
import { useWaitForTransaction } from "wagmi"
import { currentChain } from "../contracts"
import { getPublicClient } from "wagmi/actions"
import { handleInput } from "../../../core/funcs/inputs"

export const BubblesControlsEmit = ({ bubbleId } : { bubbleId: string }) => {
    const bubble = currentState.bubbles.find(bubble => bubble.id === bubbleId)
    if(!bubble) return null
    const radius = massToRadius(bubble.mass)
    const position = new THREE.Vector3(bubble.position.x, bubble.position.y, 0)
    const length = 10 + radius
    const [ direction, setDirection ] = useState<THREE.Vector3>(new THREE.Vector3(1, 0, 0))
    const [ mass, setMass ] = useState<number>(bubble.mass/2)
    const lineRef = useRef<any>()

    //Input action
    const {
        data,
        write,
        isError,
        isLoading,
        isSuccess,
    } = useCreateInput({
        type: InputType.Emit,
        mass,
        from: bubbleId,
        direction, 
    })

    if(isSuccess || isError) return null

    //Now get mouse position
    useFrame(({ pointer }) => {
        if(isError || isLoading || isSuccess) return
        const mouse = new THREE.Vector3(pointer.x, pointer.y, 0)
        const direction = mouse.sub(position).normalize()
        setDirection(direction)
    })

    //Click action
    useOnClick(() => {
        if(isError || isLoading || isSuccess) return
        write()
    })

    //Tx prediction
    const tx = useWaitForTransaction({
        chainId: currentChain.id, 
        hash: data?.hash
    })
    useEffect(() => {
        if(!tx) return
        if(!tx.data?.blockNumber) return
        getPublicClient({chainId: currentChain.id})
            .getBlock({blockNumber: tx.data.blockNumber})
            .then(block => {
                const timestamp = Number(block.timestamp)
                const input: Emit = {
                    type: InputType.Emit,
                    timestamp,
                    mass,
                    from: bubbleId,
                    direction,
                }
                handleInput(input)
            })
        console.log("tx:", tx)
    }, [tx])

    //Scroll action
    useOnWheel((event) => {
        if(isError || isLoading || isSuccess) return
        const newMass = Math.max(Math.min(mass + event.deltaY/100, bubble.mass), 0)
        setMass(newMass)
    })

    return (
        <>
            <Line
                ref={lineRef}
                color={'blue'}
                dashed={true}
                points={[position, position.add(direction.multiplyScalar(length))]}
            />
            <Text 
                anchorX={'left'}
                anchorY={'bottom'}
                position={position.add(direction.multiplyScalar(length))}
            >
                {mass.toFixed(6)} ETH
            </Text>
        </>
        
    )
    
}