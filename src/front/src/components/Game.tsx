import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Snapshot } from '../../../core/types/state'
import { Notice } from '../generated-src/graphql'
import { CustomCameraControls } from './CameraControls'
import { Portals } from './Portals'
import { Bubbles } from './Bubbles'
import { useEffect, useState } from 'react'
import { currentState, init, lastTimestamp, rollback, rollbackToState, run, world } from '../../../core/world'
import { handleInput } from '../../../core/funcs/inputs'
import { Input } from '../../../core/types/inputs'
import { useBlockTimestamp, useLocalTimestamp, useMachineTimestamp } from '../hooks/state'
import { snapshotRollback, snapshotRun } from '../../../core/snapshots'



export const Game = ({snapshot, inputs, notices} : {snapshot: Snapshot, inputs: Input[], notices:Notice[]}) => {
    console.log("main snapshot:", snapshot)
    // Get current timestamps
    const machineTimestamp = useMachineTimestamp(snapshot, notices)
    const blockTimestamp = useBlockTimestamp();
    const localTimestamp = useLocalTimestamp();

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
        console.log("init snapshot:", snapshot)
        setBubbleIds(snapshot.bubbles.map(bubble => bubble.id))
        setPortalIds(snapshot.portals.map(portal => portal.id))
        console.log("init world:", world)
    }, [snapshot])

    //Check for new inputs, make sure to only run on new inputs
    useEffect(() => {
        if(inputs.length > 0){ 
            inputs
                .sort((a, b) => a.timestamp - b.timestamp)
                .filter((input) => input.timestamp > lastTimestampHandled)
                .forEach((input) => {
                    const isBehind = input.timestamp < blockTimestamp
                    if(isBehind) snapshotRollback(input.timestamp)
                    handleInput(input, true)
                    if(isBehind) snapshotRun(blockTimestamp, ()=>{}, true)
                    setLastTimestampHandled(input.timestamp)
                })
        }
                
    }, [inputs])



    //Predict snapshots
    useEffect(() => {
        //Run the world
        if(!snapshot) return
        if(blockTimestamp <= lastTimestampHandled) return
        snapshotRun(blockTimestamp, ()=>{}, true)

        //Rollback and update client state
        const end = Math.max(Date.now() / 1000, blockTimestamp)
        rollbackToState(snapshot)
        run(end)

        //Add new objects if they exist
        setBubbleIds(currentState.bubbles.map(bubble => bubble.id))
        setPortalIds(currentState.portals.map(portal => portal.id))

        //console.log(end)
    }, [blockTimestamp])

    //Predict client state
    useFrame(() => {
        const now = Date.now() / 1000
        run(now)
    })

    console.log(inputs)
    return (
        <>
            <Portals portals={portalIds ?? []} />
            <Bubbles bubbles={bubbleIds ?? []} />
            
        </>
    )
    
}