import { Vec2, World } from "planck-js";
import { Bubble } from "./types/bubble";
import { Portal } from "./types/portal";
import { Resource, ResourceNode } from "./types/resource";
import { Obstacle, ObstacleGroup } from "./types/obstacle";
import { Address } from "./types/address";
import { User } from "./types/user";
import { InputWithExecutionTime } from "./types/inputs";
import { ObstaclesState, Snapshot } from "./types/state";
import { STEP_DELTA, WORLD_HEIGHT, WORLD_RADIUS, WORLD_WIDTH } from "./consts";
import { handlePendingInputs } from "./funcs/inputs";
import { updateState, handleContact } from "./funcs/state";
import { generateObstacles, setObstacleGroupFromState } from "./funcs/obstacle";
import {
    applyPortalGravity,
    createPortal,
    generateSpawnPoint,
    setPortalResourceMass,
} from "./funcs/portal";
import {
    createBubble,
    handleBubbleUpdates,
    setBubbleResourceMass,
} from "./funcs/bubble";
import {
    createNode,
    createResource,
    generateNodes,
    handleAttractors,
    handleNodeUpdates,
    resourceMassToAmount,
} from "./funcs/resource";
import { createBoundary, createEdges, preciseRound } from "./funcs/utils";
import { Attractor } from "./types/entity";
import { Protocol } from "./types/protocol";


export const users = new Map<Address, User>();
export const bubbles = new Map<string, Bubble>();
export const portals = new Map<string, Portal>();
export const obstacles: ObstacleGroup[] = new Array<ObstacleGroup>();
export const nodes = new Map<string, ResourceNode>();
export const resources = new Map<string, Resource>();
export const pendingInputs = new Array<InputWithExecutionTime>();
export const attractors = new Array<Attractor>();
export const protocol = new Protocol()

export let world = new World({
    gravity: Vec2(0, 0),
});

export let currentState: Snapshot = {
    timestamp: 0,
    pendingInputs: [],
    users: [],
    bubbles: [],
    portals: [],
    nodes: [],
    resources: [],
    obstacles: {
        obstaclesStates: [],
        obstacleSnapshots: [],
    },
    attractors: [],
    protocol: {
        last: 0,
        balance: 0,
        pendingEthBalance: 0,
        pendingEnergyBalance: 0,
        pendingEnergySpawn: 0,
        rentCost: 0,
        rentDueAt: 0,
        hasPayedRent: [],
    },

};

export let lastTimestamp = 0;

export let tempTimestamp = 0; // for accessing the current state of the world

export type WorldState = {
    world: World;
    timestamp: number;
    users: Map<Address, User>;
    bubbles: Map<string, Bubble>;
    portals: Map<string, Portal>;
    obstacles: ObstacleGroup[];
    nodes: Map<string, ResourceNode>;
    resources: Map<string, Resource>;
    pendingInputs: InputWithExecutionTime[];
    attractors: Attractor[];
    protocol: Protocol;
};

//Deferred updates called after the physics step
export let deferredUpdates: Array<() => void> = [];
export const applyDeferredUpdates = () => {
    // Capture the current length of the queue
    let updatesToProcess = deferredUpdates.length;

    // Process only the updates that were in the queue at the start of this call
    for (let i = 0; i < updatesToProcess; i++) {
        let update = deferredUpdates.shift();
        if (update) update();
    }
};

//console.log("world init", world)

export const init = (initialState?: Snapshot) => {
    
    if (initialState) {
        //reset all state
        users.clear();
        bubbles.clear();
        portals.clear();
        obstacles.length = 0;
        //nodes.clear();
        resources.clear();
        attractors.length = 0;
        pendingInputs.length = 0;
        deferredUpdates.length = 0;
        protocol.init(initialState.protocol)


        if (initialState.timestamp == 0) {
           //console.log("generating nodes");
            generateObstacles(world, obstacles, 3);
            // for (let index = 0; index < 100; index++) {
            //     const { x, y } = generateSpawnPoint(
            //         0,
            //         world,
            //         portals,
            //         bubbles,
            //         nodes,
            //         100,
            //     );
            //     createPortal(portals, world, "0x00000" + index, x, y, 100); 
            // }
        }

        currentState = Object.assign({}, initialState);
        lastTimestamp = initialState.timestamp;

        //Set world state based on snapshot
        currentState.bubbles.forEach((bubble) => {
            const newBubble = createBubble(
                lastTimestamp,
                bubbles,
                world,
                bubble.owner,
                bubble.position.x,
                bubble.position.y,
                bubble.mass,
                false,
                bubble.id,
                bubble,
                bubble.from,
            );
            newBubble.body.setLinearVelocity(
                Vec2(bubble.velocity.x, bubble.velocity.y),
            );
            bubble.resources.forEach((resource) => {
                setBubbleResourceMass(
                    newBubble,
                    resource.resource,
                    resource.mass,
                );
            });
        });
        currentState.portals.forEach((portal) => {
            const newPortal = createPortal(
                portals,
                world,
                portal.owner,
                portal.position.x,
                portal.position.y,
                portal.mass,
            );
            portal.resources.forEach((resource) => {
                setPortalResourceMass(
                    newPortal,
                    resource.resource,
                    resource.mass,
                );
            });
        });
        currentState.users.forEach((user) => {
            users.set(user.address, {
                address: user.address,
                balance: user.balance,
                points: user.points,
            });
        });
        currentState.resources.forEach((resource) => {
            const newResource = createResource(
                lastTimestamp,
                world,
                resources,
                resource.type,
                resource.position.x,
                resource.position.y,
                resourceMassToAmount(resource.type, resource.mass),
                resource.owner,
                resource.id,
                resource,
            );
            newResource.body.setLinearVelocity(
                Vec2(resource.velocity.x, resource.velocity.y),
            );
        });
        
        currentState.pendingInputs.forEach((input) => {
            pendingInputs.push(input);
        });
        currentState.attractors.forEach((attractor) => {
            attractors.push(attractor);
        });
        obstacles.push(...setObstacleGroupFromState(world, currentState.obstacles)) 
    }
    createEdges(world, WORLD_RADIUS);

    //Create initial portal
    //const portal = createPortal(portals, world, "0x0", 0, 0, 10);

    // //Create initial bubbles
    // const bubble = createBubble(bubbles, world, "0x00", 10, -2, 7, true);
    // bubble.body.setLinearVelocity(Vec2(0, 3.16));
    // const bubble2 = createBubble(bubbles, world, "0x000", 10, 3, 5, true);
    // bubble2.body.setLinearVelocity(Vec2(-1.33, 1.33));

    ////console.log("world init", world)
    world.on("begin-contact", handleContact);
};

export const rollbackToState = (snapshot: Snapshot) => {
    if (!snapshot) {
       //console.log("Snapshot is empty")
        return
    };
    currentState = Object.assign({}, snapshot);
    //reset
    world = new World({
        gravity: Vec2(0, 0),
    });
    init(currentState);
};

export const run = (
    end: number,
    callback?: () => void,
    client: boolean = false,
) => {
    // Set the current time to the last timestamp
    if (lastTimestamp == 0) lastTimestamp = end;
    tempTimestamp = preciseRound(lastTimestamp, 2);
    let current = preciseRound(lastTimestamp, 2);
    // Sort the pending inputs by execution time and remove any scheduled before the current time
    pendingInputs
        .sort((a, b) => a.executionTime - b.executionTime)
        .filter((input) => input.executionTime < current);

    //console.log("Pending inputs in run", pendingInputs)

    //console.log("running to", end, "from", lastTimestamp, "with", pendingInputs.length, "inputs")

    // Run the simulation
    while (current < end) {
        //Apply deferred updates
        applyDeferredUpdates();

        //Apply portal gravity
        portals.forEach((portal) =>
            bubbles.forEach((bubble) => applyPortalGravity(portal, bubble)),
        );

        // Run all pending inputs that are scheduled to execute at this time
        let nextInput = pendingInputs[0];
        //console.log("running world at", current)
        //console.log("next input execution", nextInput?.executionTime)
        while (nextInput?.executionTime == current) {
            pendingInputs.shift();
            //console.log("running input", nextInput)
            handlePendingInputs(nextInput);
            nextInput = pendingInputs.shift();
        }

        //now calculate the new step delta that will bring us to the next input execution time
        const next = Math.min(
            nextInput?.executionTime ?? current + STEP_DELTA,
            current + STEP_DELTA,
            end,
        );
        //console.log("current:", current, "next:", next, "pre-round delta:", next - current);
        const stepDelta = preciseRound(next - current, 2);
        //console.log("step delta", stepDelta);


        // Handle entity updates
        handleBubbleUpdates(current, bubbles, stepDelta);
        protocol.run(current, world, users, bubbles, portals, obstacles, nodes, resources, protocol, pendingInputs);

        // Step the world
        world.step(stepDelta);
        current = preciseRound(current + stepDelta, 2);
        tempTimestamp = current;

        // Run inputs again
        nextInput = pendingInputs[0];
        //console.log("running world at", current)
        //console.log("next input execution", nextInput?.executionTime)
        while (nextInput?.executionTime == current) {
            pendingInputs.shift();
            handlePendingInputs(nextInput);
            nextInput = pendingInputs.shift();
        }

        if(callback) {
           //console.log("Executing callback");
            callback();
        }
    }

    console.log("ran world for", current - lastTimestamp, "seconds")
    for (const [key,value] of Object.entries(process.memoryUsage())){ 
        //console.log(`Memory usage by ${key}, ${value/1000000}MB `) 
    }

    // Update the last timestamp
    lastTimestamp = preciseRound(current, 2);

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
        attractors,
        protocol,
        lastTimestamp,
    );

    //console.log("world state", currentState.timestamp);

    //console.log("world state", currentState)
    //console.log("resource state", currentState.resources)
};
