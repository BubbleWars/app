import * as THREE from 'three'
import { massToRadius } from "../../../core/funcs/utils"
import { currentState, rollbackToState } from "../../../core/world"
import { useEffect, useRef, useState } from "react"
import { Line, Text } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useCreateInput, useOnClick, useOnWheel } from "../hooks/inputs"
import { Emit, InputType } from "../../../core/types/inputs"
import { useWaitForTransaction } from "wagmi"
import { currentChain } from "../contracts"
import { getPublicClient } from "wagmi/actions"
import { handleInput } from "../../../core/funcs/inputs"
import { snapshotRollback, snapshotRun, snapshots } from "../../../core/snapshots"

export const BubblesControlsEmit = ({ bubbleId } : { bubbleId: string }) => {
    const bubble = currentState.bubbles.find(bubble => bubble.id === bubbleId)
    if(!bubble) return null
    const radius = massToRadius(bubble.mass)
    const position = new THREE.Vector3(bubble.position.x, bubble.position.y, 0)
    const length = 10
    const [ direction, setDirection ] = useState<THREE.Vector3>(new THREE.Vector3(1, 0, 0))
    const [ mass, setMass ] = useState<number>(bubble.mass/2)
    const lineRef = useRef<any>()

    //Input action
    const {
        write,
        isError,
        isLoading,
        isSuccess,
        data,
    } = useCreateInput({
        type: InputType.Emit,
        mass,
        from: bubbleId,
        direction: { x: direction.x, y: direction.y } 
    })


    //Now get mouse position
    useFrame(({ pointer }) => {
        if(isError || isLoading || isSuccess) return
        const mouse = new THREE.Vector3(pointer.x, pointer.y, 0)
        const direction = mouse.sub(position).normalize()
        setDirection(direction)
        console.log("vv mouse:", mouse)
        console.log("vv position:", position)
        console.log("vv direction:", direction)
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
        // getPublicClient({chainId: currentChain.id})
        //     .getBlock({blockNumber: tx.data.blockNumber})
        //     .then(block => {
        //         const timestamp = Number(block.timestamp)
        //         const input: Emit = {
        //             type: InputType.Emit,
        //             timestamp,
        //             mass,
        //             from: bubbleId,
        //             direction,
        //         }
        //         const isBehind = input.timestamp < currentState.timestamp
        //         if(isBehind) {
        //             const state = snapshots.get(input.timestamp)
        //             if(!state) return
        //             rollbackToState(state)
        //         }
        //         handleInput(input)
        //     })
        // console.log("tx:", tx)
    }, [tx])

    //Scroll action
    useOnWheel((event) => {
        if(isError || isLoading || isSuccess) return
        const newMass = Math.max(Math.min(mass + event.deltaY/100, bubble.mass), 0)
        setMass(newMass)
    })

    if(isSuccess || isError) return null


    return (
        <>
            <Line
                ref={lineRef}
                color={'blue'}
                dashed={true}
                lineWidth={1}
                points={[position, position.clone().add(direction.clone().multiplyScalar(length))]}
            />
            {/* <Text 
                anchorX={'left'}
                anchorY={'bottom'}
                position={position.add(direction.multiplyScalar(length))}
            >
                {mass.toFixed(6)} ETH
            </Text> */}
        </>
        
    )
    
}