import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Snapshot } from '../../../core/types/state'
import { Notice } from '../generated-src/graphql'
import { CustomCameraControls } from './CameraControls'
import { Portals } from './Portals'
import { Bubbles } from './Bubbles'
import { useEffect, useMemo, useState } from 'react'
import { currentState, init, lastTimestamp, rollbackToState, run, world } from '../../../core/world'
import { handleInput } from '../../../core/funcs/inputs'
import { Input } from '../../../core/types/inputs'
import { useBlockTimestamp, useLocalTimestamp, useMachineTimestamp } from '../hooks/state'
import { snapshotCurrentState, snapshotInit, snapshotRollback, snapshotRun, snapshots } from '../../../core/snapshots'
import { interpolate, setInterpolation } from '../store/interpolation'
import { useDispatch, useSelector } from 'react-redux'
import { Nodes } from './Nodes'
import { Resource, Resources } from './Resources'
import { clearEvents, getAllEvents, getEvents, setOnEvent } from '../../../core/funcs/events'
import { CreateBubble, EventsType } from '../../../core/types/events'

export const bubbleStartPositions : {[key: string]: {x: number, y: number}} = {}
export const bubbleDestroyPositions : {[key: string]: {x: number, y: number}} = {}
export const resourceStartPositions : {[key: string]: {x: number, y: number}} = {}
export const resourceDestroyPositions : {[key: string]: {x: number, y: number}} = {}

export const Game = ({snapshot, inputs, notices} : {snapshot: Snapshot, inputs: Input[], notices:Notice[]}) => {
   //console.log("22 inputs:", inputs)
   //console.log("22 notices:", notices)
    // Get current timestamps
    const machineTimestamp = useMachineTimestamp(snapshot, notices)
    const blockTimestamp = useBlockTimestamp();
    const localTimestamp = useLocalTimestamp();
    const interpolation = useSelector((state: any) => state.interpolation)
    const dispatch = useDispatch()

    //Initialize client state
    const [lastTimestampHandled, setLastTimestampHandled] = useState<number>(snapshot.timestamp)
   //console.log("lastTimestampHandled:", lastTimestampHandled)
   //console.log("snapshot recieved", snapshot)
    //Game object ids
    const [bubbleIds, setBubbleIds] = useState<string[]>([])
    const [portalIds, setPortalIds] = useState<string[]>([])
    const [nodeIds, setNodeIds] = useState<string[]>([])
    const [resourceIds, setResourceIds] = useState<string[]>([])        

    //Initialize client state
    useEffect(() => {
        if(!snapshot) return
        init(snapshot)
        snapshotInit(snapshot)
       //console.log("init snapshot:", snapshot)
        setBubbleIds(snapshot.bubbles.map(bubble => bubble.id))
        setPortalIds(snapshot.portals.map(portal => portal.id))
        setNodeIds(snapshot.nodes.map(node => node.id))
        setResourceIds(snapshot.resources.map(resource => resource.id))
       //console.log("init world:", world)
    }, [snapshot])

    //Check for new inputs, make sure to only run on new inputs
    useEffect(() => {
        if(inputs.length > 0){ 
            [...inputs]
                .sort((a, b) => a.timestamp - b.timestamp)
                .filter((input) => input.timestamp > lastTimestampHandled)
                .forEach((input) => {
                    const isBehind = input.timestamp < blockTimestamp
                   //console.log("new input11", input)
                    clearEvents()
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
                            setNodeIds(currentState.nodes.map(node => node.id))
                            setResourceIds(currentState.resources.map(resource => resource.id))

                    }
                    handleInput(input, true)
                    
                    if(isBehind) snapshotRun(blockTimestamp, ()=>{}, true)
                    setLastTimestampHandled(input.timestamp)
                    setBubbleIds(snapshotCurrentState.bubbles.map(bubble => bubble.id))
                    setPortalIds(snapshotCurrentState.portals.map(portal => portal.id))
                    setNodeIds(snapshotCurrentState.nodes.map(node => node.id))
                    setResourceIds(snapshotCurrentState.resources.map(resource => resource.id))
                    
                    dispatch(setInterpolation(input.timestamp))

                    setOnEvent((event) => {
                        //only if event.id does not exist within bubbleIds
                        if(event.type == EventsType.CreateBubble){
                            if(!bubbleIds.includes(event.id)){
                               //console.log("new event 11", event)
                                bubbleStartPositions[event.id] = event.position
                                //setOnEvent(()=>{})
                            }
                        }else if(event.type == EventsType.DestroyBubble){
                            if(bubbleIds.includes(event.id)){
                               //console.log("new event 22", event)
                                bubbleDestroyPositions[event.id] = event.position
                                //setOnEvent(()=>{})
                            }
                        }else if(event.type == EventsType.CreateResource){
                            if(!resourceIds.includes(event.id)){
                               //console.log("new event 33", event)
                                resourceStartPositions[event.id] = event.position
                                //setOnEvent(()=>{})
                            }
                        }
                        
                    })
                    //Get events
                    const now = Date.now() / 1000
                    run(now)
                    
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
       //console.log("setting snapshotCurrentState:", snapshotCurrentState)
       //console.log("setting currentState:", currentState)
        rollbackToState(snapshotCurrentState)
        // run(end)

        //Add new objects if they exist
        // setBubbleIds(snapshotCurrentState.bubbles.map(bubble => bubble.id))
        // setPortalIds(snapshotCurrentState.portals.map(portal => portal.id))

        //console.log(end)
    }, [blockTimestamp])

    //Predict client state
    useFrame((state) => {
       //console.log("new delta", state.clock.getDelta())
        const now = Date.now() / 1000
        // if(interpolation.from){
        //     const maxTimeToRun = Math.min(now, interpolation.from)
        //    //console.log("interpolating: ", maxTimeToRun, now)
        //     run(maxTimeToRun)
        //     dispatch(interpolate({step: 0.09, end: now}))
        // }else{
            run(now)
        // }
        setBubbleIds(currentState.bubbles.map(bubble => bubble.id))
       //console.log("123at", currentState.bubbles);
       //console.log("123at", currentState.bubbles.map(bubble => bubble.id))
        setPortalIds(currentState.portals.map(portal => portal.id))
        setNodeIds(currentState.nodes.map(node => node.id))
        setResourceIds(currentState.resources.map(resource => resource.id))
    })

   //console.log(inputs)
    return (
        <>
            <Portals portals={portalIds ?? []} />
            <Bubbles bubbles={bubbleIds ?? []} />
            <Nodes nodes={nodeIds ?? []} />
            <Resources resources={resourceIds ?? []} />
            
        </>
    )
    
}