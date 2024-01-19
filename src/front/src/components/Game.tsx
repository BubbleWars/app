import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Snapshot } from '../../../core/types/state'
import { Notice } from '../generated-src/graphql'
import { CustomCameraControls } from './CameraControls'
import { Portals } from './Portals'
import { Bubbles } from './Bubbles'
import { useEffect, useState } from 'react'
import { currentState, init, lastTimestamp, rollbackToState, run, world } from '../../../core/world'
import { handleInput } from '../../../core/funcs/inputs'
import { Input } from '../../../core/types/inputs'
import { useBlockTimestamp, useLocalTimestamp, useMachineTimestamp } from '../hooks/state'
import { snapshotCurrentState, snapshotInit, snapshotRollback, snapshotRun, snapshots } from '../../../core/snapshots'
import { interpolate, setInterpolation } from '../store/interpolation'
import { useDispatch, useSelector } from 'react-redux'



export const Game = ({snapshot, inputs, notices} : {snapshot: Snapshot, inputs: Input[], notices:Notice[]}) => {
    console.log("22 inputs:", inputs)
    console.log("22 notices:", notices)
    // Get current timestamps
    const machineTimestamp = useMachineTimestamp(snapshot, notices)
    const blockTimestamp = useBlockTimestamp();
    const localTimestamp = useLocalTimestamp();
    const interpolation = useSelector((state: any) => state.interpolation)
    const dispatch = useDispatch()

    //Initialize client state
    const [lastTimestampHandled, setLastTimestampHandled] = useState<number>(snapshot.timestamp)
    console.log("lastTimestampHandled:", lastTimestampHandled)
    //Game object ids
    const [bubbleIds, setBubbleIds] = useState<string[]>([])
    const [portalIds, setPortalIds] = useState<string[]>([])

    //Initialize client state
    useEffect(() => {
        if(!snapshot) return
        init(snapshot)
        snapshotInit(snapshot)
        console.log("init snapshot:", snapshot)
        setBubbleIds(snapshot.bubbles.map(bubble => bubble.id))
        setPortalIds(snapshot.portals.map(portal => portal.id))
        console.log("init world:", world)
    }, [snapshot])

    //Check for new inputs, make sure to only run on new inputs
    useEffect(() => {
        if(inputs.length > 0){ 
            [...inputs]
                .sort((a, b) => a.timestamp - b.timestamp)
                .filter((input) => input.timestamp > lastTimestampHandled)
                .forEach((input) => {
                    
                    const isBehind = input.timestamp < blockTimestamp
                    if(isBehind) {
                        snapshotRollback(input.timestamp)
                        const stateOfInput = snapshots.get(input.timestamp)
                        rollbackToState(stateOfInput)
                    }
                    if(input?.prediction) {
                        //clear pending inputs
                            handleInput(input)
                            setBubbleIds(currentState.bubbles.map(bubble => bubble.id))
                            setPortalIds(currentState.portals.map(portal => portal.id))

                    }
                    handleInput(input, true)
                    
                    if(isBehind) snapshotRun(blockTimestamp, ()=>{}, true)
                    setLastTimestampHandled(input.timestamp)
                    setBubbleIds(snapshotCurrentState.bubbles.map(bubble => bubble.id))
                    setPortalIds(snapshotCurrentState.portals.map(portal => portal.id))
                    
                    dispatch(setInterpolation(input.timestamp))
                    
                    console.log("abc input:", input)
                })
        }
                
    }, [inputs])



    //Predict snapshots
    useEffect(() => {
        //Run the world
        if(!snapshot) return
        if(blockTimestamp <= lastTimestampHandled) return
        //const maxTimeToRun = interpolation.from ? interpolation.from : blockTimestamp
        snapshotRun(blockTimestamp, ()=>{}, true)

        //Rollback and update client state
        // const end = Math.max(Date.now() / 1000, blockTimestamp)
        console.log("setting snapshotCurrentState:", snapshotCurrentState)
        console.log("setting currentState:", currentState)
        rollbackToState(snapshotCurrentState)
        // run(end)

        //Add new objects if they exist
        // setBubbleIds(snapshotCurrentState.bubbles.map(bubble => bubble.id))
        // setPortalIds(snapshotCurrentState.portals.map(portal => portal.id))

        //console.log(end)
    }, [blockTimestamp])

    //Predict client state
    useFrame((state) => {
        console.log("new delta", state.clock.getDelta())
        const now = Date.now() / 1000
        // if(interpolation.from){
        //     const maxTimeToRun = Math.min(now, interpolation.from)
        //     console.log("interpolating: ", maxTimeToRun, now)
        //     run(maxTimeToRun)
        //     dispatch(interpolate({step: 0.09, end: now}))
        // }else{
            run(now)
        // }
        setBubbleIds(currentState.bubbles.map(bubble => bubble.id))
        console.log("123at", currentState.bubbles);
        console.log("123at", currentState.bubbles.map(bubble => bubble.id))
        setPortalIds(currentState.portals.map(portal => portal.id))
    })

    console.log(inputs)
    return (
        <>
            <Portals portals={portalIds ?? []} />
            <Bubbles bubbles={bubbleIds ?? []} />
            
        </>
    )
    
}