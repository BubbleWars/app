import * as THREE from 'three'
import { massToRadius } from "../../../core/funcs/utils"
import { currentState, rollbackToState } from "../../../core/world"
import { useEffect, useRef, useState } from "react"
import { Line, Text, Text3D } from "@react-three/drei"
import { extend, useFrame } from "@react-three/fiber"
import { useCreateInput, useOnClick, useOnWheel } from "../hooks/inputs"
import { Emit, InputType } from "../../../core/types/inputs"
import { useAccount, useWaitForTransaction } from "wagmi"
import { currentChain } from "../contracts"
import { getPublicClient } from "wagmi/actions"
import { handleInput } from "../../../core/funcs/inputs"
import { snapshotRollback, snapshotRun, snapshots } from "../../../core/snapshots"
import { useDispatch } from 'react-redux'
import { addInput } from '../store/inputs'
import { Vec2 } from 'planck-js'


export const PortalsControlsEmit = ({ portalId } : { portalId: string }) => {
    const dispatch = useDispatch()
    const portal = currentState.portals.find(portal => portal.id === portalId)
    if(!portal) return null
    const radius = massToRadius(portal.mass)
    const position = new THREE.Vector3(portal.position.x, portal.position.y, 0)
    const length = 10
    const [ direction, setDirection ] = useState<THREE.Vector3>(new THREE.Vector3(1, 0, 0))
    const [ mass, setMass ] = useState<number>(portal.mass/10)
    const lineRef = useRef<any>()
    const {address} = useAccount()

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
        from: portalId,
        direction: { x: direction.x, y: direction.y } 
    })


    //Now get mouse position
    useFrame(({ pointer, camera }) => {
        if (isError || isLoading || isSuccess) return;

        // Raycaster for converting pointer coordinates
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(pointer.x, pointer.y) , camera);

        // Assuming your 2D plane is at z = 0
        const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const worldMouse = new THREE.Vector3();
        raycaster.ray.intersectPlane(planeZ, worldMouse);

        // Calculate the direction vector
        const directionVector = worldMouse.sub(position).normalize();

        setDirection(directionVector);

        console.log("bb mouse:", worldMouse);
        console.log("bb position:", position);
        console.log("bb direction:", directionVector);
    });

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
                    from: portalId,
                    direction: { x: direction.x, y: direction.y },
                    sender: address,
                    executionTime: timestamp,
                    prediction: true,
                }
                dispatch(addInput(input))
                // //Client add input
                // const isBehind = input.timestamp < currentState.timestamp
                // if(isBehind) {
                //     const state = snapshots.get(input.timestamp)
                //     if(!state) return
                //     rollbackToState(state)
                // }
                // handleInput(input)

                // //Snapshot add input
                // snapshotRollback(input.timestamp)
                // handleInput(input, true)
                // console.log("is predicting", input)
                // console.log("is predicting", timestamp)
            })
        console.log("tx:", tx)
    }, [tx])

    //Scroll action
    useOnWheel((event) => {
        if(isError || isLoading || isSuccess) return
        const newMass = Math.max(Math.min(mass + event.deltaY/100, portal.mass), 0)
        setMass(newMass)
    })

    if(isSuccess || isError) return null

    return (
        <>
            <Line
                ref={lineRef}
                color={'black'}
                lineWidth={2}
                dashed={true}
                points={[position, position.clone().add(direction.clone().multiplyScalar(length))]}
            />
            {/* <text
                position={position.clone().add(direction.clone().multiplyScalar(length))}
            >
                {mass.toFixed(6)} ETH
            </text> */}
            <group 
            position={position.clone().add(direction.clone().multiplyScalar(length))}>
            <Text3D 
                font="./fonts/helvetiker.json"
                size={0.8}
                
            >
                <meshBasicMaterial attach="material" color="black" />
                {`Emit \n`} 
                {mass.toFixed(3)} ETH
            </Text3D>
            </group>
            
        </>
        
    )
    
}