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


export const users = new Map<Address, User>()
export const bubbles = new Map<string, Bubble>()
export const portals = new Map<string, Portal>()
export const obstacles = new Map<string, Obstacle>()
export const pendingInputs = new Array<InputWithExecutionTime>()

//only client
export const snapshots = new Map<number, Snapshot>()

export let world = new World({
    gravity: Vec2(0, 0),
})

export let currentState: Snapshot = {
    timestamp: 0,
    pendingInputs: [],
    users: [],
    bubbles: [],
    portals: [],
    obstacles: [],
}

export let lastTimestamp = 0;


//Deferred updates called after the physics step
export let deferredUpdates: Array<()=>void> = [];
export const applyDeferredUpdates = () => {
    // Capture the current length of the queue
    let updatesToProcess = deferredUpdates.length;

    // Process only the updates that were in the queue at the start of this call
    for (let i = 0; i < updatesToProcess; i++) {
        let update = deferredUpdates.shift();
        if (update) update();
    }
}

//console.log("world init", world)

export const init = (initialState?: Snapshot) => {
    if(initialState){
        currentState = Object.assign({}, initialState);
        lastTimestamp = initialState.timestamp;

        //Set world state based on snapshot
        currentState.bubbles.forEach(bubble => {
            const newBubble = createBubble(bubbles, world, bubble.owner, bubble.position.x, bubble.position.y, bubble.mass, false);
            newBubble.body.setLinearVelocity(Vec2(bubble.velocity.x, bubble.velocity.y));
        })
        currentState.portals.forEach(portal => {
            createPortal(portals, world, portal.owner, portal.position.x, portal.position.y, portal.mass);
        })
        currentState.users.forEach(user => {
            users.set(user.address, { address: user.address, balance: user.balance });
        })
        currentState.pendingInputs.forEach(input => {
            pendingInputs.push(input);
        })
    }
    //Create initial portal
    //const portal = createPortal(portals, world, "0x0", 0, 0, 10);

    // //Create initial bubbles
    // const bubble = createBubble(bubbles, world, "0x00", 10, -2, 7, true);
    // bubble.body.setLinearVelocity(Vec2(0, 3.16));
    // const bubble2 = createBubble(bubbles, world, "0x000", 10, 3, 5, true);
    // bubble2.body.setLinearVelocity(Vec2(-1.33, 1.33));

    // console.log("world init", world)

    world.on("begin-contact", handleContact)
}

export const rollbackToState = (snapshot: Snapshot) => {
    if(!snapshot) throw new Error("Snapshot not found");
    currentState = Object.assign({}, snapshot);
    //reset
    world = new World({
        gravity: Vec2(0, 0),
    })
    init(currentState);
}

export const run = (end: number, callback?: () => void, client:boolean= false) => {
    // Set the current time to the last timestamp
    if (lastTimestamp == 0) lastTimestamp = end
    let current = lastTimestamp
    // Sort the pending inputs by execution time and remove any scheduled before the current time
    pendingInputs.sort((a, b) => a.executionTime - b.executionTime)
        .filter(input => input.executionTime < current)

    console.log("Pending inputs in run", pendingInputs)

    // Run the simulation
    while (current < end) {
        //Apply deferred updates
        applyDeferredUpdates();

        //Apply portal gravity
        portals.forEach(portal => 
            bubbles.forEach(bubble => 
                applyPortalGravity(portal, bubble)))

        // Run all pending inputs that are scheduled to execute at this time
        let nextInput = pendingInputs[0]
        //console.log("running world at", current)
        //console.log("next input execution", nextInput?.executionTime)
        while(nextInput?.executionTime == current) {
            pendingInputs.shift()
            //console.log("running input", nextInput)
            handlePendingInputs(nextInput)
            nextInput = pendingInputs.shift()
        }

        //now calculate the new step delta that will bring us to the next input execution time
        const next = Math.min(nextInput?.executionTime ?? current + STEP_DELTA, current + STEP_DELTA, end)
        const stepDelta =  next - current;

        // Step the world
        world.step(stepDelta)
        current += stepDelta

        // Run inputs again
        nextInput = pendingInputs[0]
        //console.log("running world at", current)
        //console.log("next input execution", nextInput?.executionTime)
        while(nextInput?.executionTime == current) {
            pendingInputs.shift()
            //console.log("running input", nextInput)
            handlePendingInputs(nextInput)
            nextInput = pendingInputs.shift()
        }
        
        callback?.()
    } 

    console.log("ran world for", current - lastTimestamp, "seconds")
 
    // Update the last timestamp
    lastTimestamp = current

    // Update world state
    updateState(
        currentState, 
        pendingInputs, 
        users, 
        bubbles, 
        portals, 
        obstacles, 
        lastTimestamp,
    )

    
    console.log("snapshot", snapshots)   
    console.log(snapshots); 
    console.log("world state", currentState)
}