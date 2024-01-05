import { Vec2, World } from "planck-js"
import { Bubble } from "./types/bubble"
import { Portal } from "./types/portal"
import { Obstacle } from "./types/obstacle"
import { Address } from "./types/address"
import { User } from "./types/user"
import { Input, InputWithExecutionTime } from "./types/inputs"
import { Snapshot } from "./types/state"
import { MAX_ADVANCE_STATE_TIME, STEP_DELTA } from "./consts"
import { handleInput, handlePendingInputs } from "./funcs/inputs"
import { updateState, handleContact } from "./funcs/state"
import { applyPortalGravity, createPortal } from "./funcs/portal"
import { createBubble } from "./funcs/bubble"


export const snapshotUsers = new Map<Address, User>()
export const snapshotBubbles = new Map<string, Bubble>()
export const snapshotPortals = new Map<string, Portal>()
export const snapshotObstacles = new Map<string, Obstacle>()
export const snapshotPendingInputs = new Array<InputWithExecutionTime>()

//only client
export const snapshots = new Map<number, Snapshot>()

export let snapshotWorld = new World({
    gravity: Vec2(0, 0),
})

export let snapshotCurrentState: Snapshot = {
    timestamp: 0,
    pendingInputs: [],
    users: [],
    bubbles: [],
    portals: [],
    obstacles: [],
}

export let snapshotLastTimestamp = 0;

//Deferred updates called after the physics step
export let snapshotDeferredUpdates: Array<()=>void> = [];
export const applyDeferredUpdates = () => {
    // Capture the current length of the queue
    let updatesToProcess = snapshotDeferredUpdates.length;

    // Process only the updates that were in the queue at the start of this call
    for (let i = 0; i < updatesToProcess; i++) {
        let update = snapshotDeferredUpdates.shift();
        if (update) update();
    }
}

//console.log("world init", world)

export const snapshotInit = (initialState?: Snapshot) => {
    if(initialState){
        snapshotCurrentState = Object.assign({}, initialState);
        snapshotLastTimestamp = initialState.timestamp;

        //Set world state based on snapshot
        snapshotCurrentState.bubbles.forEach(bubble => {
            const newBubble = createBubble(snapshotBubbles, snapshotWorld, bubble.owner, bubble.position.x, bubble.position.y, bubble.mass, false);
            newBubble.body.setLinearVelocity(Vec2(bubble.velocity.x, bubble.velocity.y));
        })
        snapshotCurrentState.portals.forEach(portal => {
            createPortal(snapshotPortals, snapshotWorld, portal.owner, portal.position.x, portal.position.y, portal.mass);
        })
        snapshotCurrentState.users.forEach(user => {
            snapshotUsers.set(user.address, { address: user.address, balance: user.balance });
        })
        snapshotCurrentState.pendingInputs.forEach(input => {
            snapshotPendingInputs.push(input);
        })
    }
    //Create initial portal
    //const portal = createPortal(portals, snapshotWorld, "0x0", 0, 0, 10);

    // //Create initial snapshotBubbles
    // const bubble = createBubble(snapshotBubbles, snapshotWorld, "0x00", 10, -2, 7, true);
    // bubble.body.setLinearVelocity(Vec2(0, 3.16));
    // const bubble2 = createBubble(snapshotBubbles, snapshotWorld, "0x000", 10, 3, 5, true);
    // bubble2.body.setLinearVelocity(Vec2(-1.33, 1.33));

    // console.log("snapshotWorld init", snapshotWorld)

    snapshotWorld.on("begin-contact", handleContact)
}

export const snapshotRollback = (timestamp: number) => {
    const snapshot = snapshots.get(timestamp);
    if(!snapshot) throw new Error("Snapshot not found");
    snapshotCurrentState = Object.assign({}, snapshot);
    //reset
    snapshotWorld = new World({
        gravity: Vec2(0, 0),
    })
    snapshotInit(snapshotCurrentState);

}

export const snapshotRun = (end: number, callback?: () => void, client:boolean= false) => {
    // Set the current time to the last timestamp
    if (snapshotLastTimestamp == 0) snapshotLastTimestamp = end
    let current = snapshotLastTimestamp
    // Sort the pending inputs by execution time and remove any scheduled before the current time
    snapshotPendingInputs.sort((a, b) => a.executionTime - b.executionTime)
        .filter(input => input.executionTime < current)

    console.log("Pending inputs in run", snapshotPendingInputs)

    // Run the simulation
    while (current < end) {
        //Apply deferred updates
        applyDeferredUpdates();

        //Apply portal gravity
        snapshotPortals.forEach(portal => 
            snapshotBubbles.forEach(bubble => 
                applyPortalGravity(portal, bubble)))

        // Run all pending inputs that are scheduled to execute at this time
        let nextInput = snapshotPendingInputs[0]
        //console.log("running snapshotWorld at", current)
        //console.log("next input execution", nextInput?.executionTime)
        while(nextInput?.executionTime == current) {
            snapshotPendingInputs.shift()
            //console.log("running input", nextInput)
            handlePendingInputs(nextInput, true)
            nextInput = snapshotPendingInputs.shift()
        }

        //now calculate the new step delta that will bring us to the next input execution time
        const next = Math.min(nextInput?.executionTime ?? current + STEP_DELTA, current + STEP_DELTA, end)
        const stepDelta =  next - current;

        // Step the snapshotWorld
        snapshotWorld.step(stepDelta)
        current += stepDelta

        // Run inputs again
        nextInput = snapshotPendingInputs[0]
        //console.log("running snapshotWorld at", current)
        //console.log("next input execution", nextInput?.executionTime)
        while(nextInput?.executionTime == current) {
            snapshotPendingInputs.shift()
            //console.log("running input", nextInput)
            handlePendingInputs(nextInput, true)
            nextInput = snapshotPendingInputs.shift()
        }
        
        callback?.()
    } 

    console.log("ran snapshotWorld for", current - snapshotLastTimestamp, "seconds")
 
    // Update the last timestamp
    snapshotLastTimestamp = current

    // Update world state
    updateState(
        snapshotCurrentState, 
        snapshotPendingInputs, 
        snapshotUsers, 
        snapshotBubbles, 
        snapshotPortals, 
        snapshotObstacles, 
        snapshotLastTimestamp,
    )

    //ONLY CLIENT: For reconciliation
    snapshots.set(snapshotLastTimestamp, Object.assign({}, snapshotCurrentState));
    
    console.log("snapshot", snapshots)   
    console.log(snapshots); 
    console.log("world state", snapshotCurrentState)
}