import { Vec2, World } from "planck-js"
import { Bubble } from "./types/bubble"
import { Portal } from "./types/portal"
import { Resource, ResourceNode } from "./types/resource"
import { Obstacle } from "./types/obstacle"
import { Address } from "./types/address"
import { User } from "./types/user"
import { Input, InputWithExecutionTime } from "./types/inputs"
import { Snapshot } from "./types/state"
import { MAX_ADVANCE_STATE_TIME, STEP_DELTA } from "./consts"
import { handleInput, handlePendingInputs } from "./funcs/inputs"
import { updateState, handleContact } from "./funcs/state"
import { applyPortalGravity, createPortal, setPortalResourceMass } from "./funcs/portal"
import { createBubble, handleBubbleUpdates, setBubbleResourceMass } from "./funcs/bubble"
import { createNode, createResource, generateNodes, handleNodeUpdates } from "./funcs/resource"


export const users = new Map<Address, User>()
export const bubbles = new Map<string, Bubble>()
export const portals = new Map<string, Portal>()
export const obstacles = new Map<string, Obstacle>()
export const nodes = new Map<string, ResourceNode>()
export const resources = new Map<string, Resource>()
export const pendingInputs = new Array<InputWithExecutionTime>()

export let world = new World({
    gravity: Vec2(0, 0),
})

export let currentState: Snapshot = {
    timestamp: 0,
    pendingInputs: [],
    users: [],
    bubbles: [],
    portals: [],
    nodes: [],
    resources: [],
    obstacles: [],
}

export let lastTimestamp = 0;

export let tempTimestamp = 0; // for accessing the current state of the world

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
        //reset all state
        users.clear();
        bubbles.clear();
        portals.clear();
        obstacles.clear();
        nodes.clear();
        resources.clear();
        pendingInputs.length = 0;
        deferredUpdates.length = 0;

        currentState = Object.assign({}, initialState);
        lastTimestamp = initialState.timestamp;

        //Set world state based on snapshot
        currentState.bubbles.forEach(bubble => {
            const newBubble = createBubble(lastTimestamp,bubbles, world, bubble.owner, bubble.position.x, bubble.position.y, bubble.mass, false);
            newBubble.body.setLinearVelocity(Vec2(bubble.velocity.x, bubble.velocity.y));
            bubble.resources.forEach(resource => {
                setBubbleResourceMass(newBubble, resource.resource, resource.mass);
            })
        })
        currentState.portals.forEach(portal => {
            const newPortal = createPortal(portals, world, portal.owner, portal.position.x, portal.position.y, portal.mass);
            portal.resources.forEach(resource => {
                setPortalResourceMass(newPortal, resource.resource, resource.mass);
            })
        })
        currentState.users.forEach(user => {
            users.set(user.address, { address: user.address, balance: user.balance });
        })
        currentState.resources.forEach(resource =>{
            const newResource = createResource(lastTimestamp, world, resources, resource.type, resource.position.x, resource.position.y, resource.mass)
            newResource.body.setLinearVelocity(Vec2(resource.velocity.x, resource.velocity.y))
        })
        currentState.nodes.forEach(node => {
            createNode(world, nodes, node.type, node.position.x, node.position.y, node.mass)
        })
        currentState.pendingInputs.forEach(input => {
            pendingInputs.push(input);
        })
    }else {
        //Generate initial nodes
        generateNodes(world, nodes, 1)
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
    tempTimestamp = lastTimestamp
    let current = lastTimestamp
    // Sort the pending inputs by execution time and remove any scheduled before the current time
    pendingInputs.sort((a, b) => a.executionTime - b.executionTime)
        .filter(input => input.executionTime < current)

    //console.log("Pending inputs in run", pendingInputs)

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

        // Handle entity updates
        handleBubbleUpdates(current, bubbles, stepDelta);
        handleNodeUpdates(world, nodes, bubbles, resources, stepDelta);

        // Step the world
        world.step(stepDelta)
        current += stepDelta
        tempTimestamp = current

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
        nodes,
        resources,
        lastTimestamp,
    )

    
    console.log("world state", currentState)
}