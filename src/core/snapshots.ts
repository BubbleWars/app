import { Vec2, World } from "planck-js";
import { Bubble } from "./types/bubble";
import { Portal } from "./types/portal";
import { Obstacle } from "./types/obstacle";
import { Address } from "./types/address";
import { User } from "./types/user";
import { Input, InputWithExecutionTime } from "./types/inputs";
import { Snapshot } from "./types/state";
import { MAX_ADVANCE_STATE_TIME, STEP_DELTA, WORLD_WIDTH } from "./consts";
import { handleInput, handlePendingInputs } from "./funcs/inputs";
import { updateState, handleSnapshotContact } from "./funcs/state";
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
import { Resource, ResourceNode } from "./types/resource";
import {
    createNode,
    createResource,
    generateNodes,
    handleNodeUpdates,
    resourceMassToAmount,
} from "./funcs/resource";
import { tempTimestamp } from "./world";
import { createBoundary, createEdges, preciseRound } from "./funcs/utils";

export const snapshotUsers = new Map<Address, User>();
export const snapshotBubbles = new Map<string, Bubble>();
export const snapshotPortals = new Map<string, Portal>();
export const snapshotObstacles = new Map<string, Obstacle>();
export const snapshotNodes = new Map<string, ResourceNode>();
export const snapshotResources = new Map<string, Resource>();
export const snapshotPendingInputs = new Array<InputWithExecutionTime>();

//only client
export const snapshots = new Map<number, Snapshot>();

export let snapshotWorld = new World({
    gravity: Vec2(0, 0),
});

export let snapshotCurrentState: Snapshot = {
    timestamp: 0,
    pendingInputs: [],
    users: [],
    bubbles: [],
    portals: [],
    nodes: [],
    resources: [],
    obstacles: [],
};

export let snapshotLastTimestamp = 0;

export let snapshotTempTimestamp = 0;

//Deferred updates called after the physics step
export let snapshotDeferredUpdates: Array<() => void> = [];
export const applyDeferredUpdates = () => {
    // Capture the current length of the queue
    let updatesToProcess = snapshotDeferredUpdates.length;

    // Process only the updates that were in the queue at the start of this call
    for (let i = 0; i < updatesToProcess; i++) {
        let update = snapshotDeferredUpdates.shift();
        if (update) update();
    }
};

//console.log("world init", world)

export const snapshotInit = (initialState?: Snapshot) => {
    if (initialState) {
        //reset all state
        snapshotUsers.clear();
        snapshotBubbles.clear();
        snapshotPortals.clear();
        snapshotObstacles.clear();
        snapshotNodes.clear();
        snapshotPendingInputs.length = 0;
        snapshotDeferredUpdates.length = 0;

        if (!initialState?.nodes || initialState.nodes.length == 0) {
           //console.log("generating snapshot nodes");
            // generateNodes(snapshotWorld, snapshotNodes, 1);
            // for (let index = 0; index < 100; index++) {
            //     const { x, y } = generateSpawnPoint(
            //         0,
            //         snapshotWorld,
            //         snapshotPortals,
            //         snapshotBubbles,
            //         snapshotNodes,
            //         100,
            //     );
            //     createPortal(snapshotPortals, snapshotWorld, "0x00000" + index, x, y, 100); 
            // }
        }

        //Set snapshot state
        snapshotCurrentState = Object.assign({}, initialState);
        snapshotLastTimestamp = initialState.timestamp;

        //Set world state based on snapshot
        snapshotCurrentState.bubbles.forEach((bubble) => {
            const newBubble = createBubble(
                snapshotLastTimestamp,
                snapshotBubbles,
                snapshotWorld,
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
        snapshotCurrentState.portals.forEach((portal) => {
            const newPortal = createPortal(
                snapshotPortals,
                snapshotWorld,
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
        snapshotCurrentState.users.forEach((user) => {
            snapshotUsers.set(user.address, {
                address: user.address,
                balance: user.balance,
            });
        });
        snapshotCurrentState.resources.forEach((resource) => {
            const newResource = createResource(
                snapshotLastTimestamp,
                snapshotWorld,
                snapshotResources,
                resource.type,
                resource.position.x,
                resource.position.y,
                resourceMassToAmount(resource.type, resource.mass),
                resource.owner,
                resource.id,
            );
            newResource.body.setLinearVelocity(
                Vec2(resource.velocity.x, resource.velocity.y),
            );
        });
        snapshotCurrentState.nodes.forEach((node) => {
            createNode(
                snapshotWorld,
                snapshotNodes,
                node.type,
                node.position.x,
                node.position.y,
                node.mass,
                node.id,
                node.emissionDirection,
                node.lastEmission,
            );
        });
        snapshotCurrentState.pendingInputs.forEach((input) => {
            snapshotPendingInputs.push(input);
        });
    }
    createEdges(snapshotWorld, WORLD_WIDTH, WORLD_WIDTH);

    //Create initial portal
    //const portal = createPortal(portals, snapshotWorld, "0x0", 0, 0, 10);

    // //Create initial snapshotBubbles
    // const bubble = createBubble(snapshotBubbles, snapshotWorld, "0x00", 10, -2, 7, true);
    // bubble.body.setLinearVelocity(Vec2(0, 3.16));
    // const bubble2 = createBubble(snapshotBubbles, snapshotWorld, "0x000", 10, 3, 5, true);
    // bubble2.body.setLinearVelocity(Vec2(-1.33, 1.33));

    ////console.log("snapshotWorld init", snapshotWorld)

    snapshotWorld.on("begin-contact", handleSnapshotContact);
};

export const snapshotRollback = (timestamp: number) => {
    const snapshot = snapshots.get(timestamp);
    if (!snapshot) {
       //console.log("Snapshot not found", timestamp, "in", JSON.stringify(snapshots));
         return;
    }
    snapshotCurrentState = Object.assign({}, snapshot);
    //reset
    snapshotWorld = new World({
        gravity: Vec2(0, 0),
    });
    snapshotInit(snapshotCurrentState);
};

export const snapshotRun = (
    end: number,
    callback?: () => void,
    client: boolean = false,
) => {
    // Set the current time to the last timestamp
    if (snapshotLastTimestamp == 0) snapshotLastTimestamp = end;
    snapshotTempTimestamp = preciseRound(snapshotLastTimestamp, 2);
    let current = preciseRound(snapshotLastTimestamp, 2);
    // Sort the pending inputs by execution time and remove any scheduled before the current time
    snapshotPendingInputs
        .sort((a, b) => a.executionTime - b.executionTime)
        .filter((input) => input.executionTime < current);

        //set the initial snapshot
    //ONLY CLIENT: For reconciliation
    snapshots.set(
        snapshotLastTimestamp,
        Object.assign({}, snapshotCurrentState),
    );
    //console.log("assigning snapshot", snapshotLastTimestamp, JSON.stringify(snapshots));


    //console.log("Pending inputs in run", snapshotPendingInputs)

    // Run the simulation
    while (current < end) {
        //Apply deferred updates
        applyDeferredUpdates();

        //Apply portal gravity
        snapshotPortals.forEach((portal) =>
            snapshotBubbles.forEach((bubble) =>
                applyPortalGravity(portal, bubble),
            ),
        );

        // Run all pending inputs that are scheduled to execute at this time
        let nextInput = snapshotPendingInputs[0];
        //console.log("running snapshotWorld at", current)
        //console.log("next input execution", nextInput?.executionTime)
        while (nextInput?.executionTime == current) {
            snapshotPendingInputs.shift();
            //console.log("running input", nextInput)
            handlePendingInputs(nextInput, true);
            nextInput = snapshotPendingInputs.shift();
        }

        //now calculate the new step delta that will bring us to the next input execution time
        const next = Math.min(
            nextInput?.executionTime ?? current + STEP_DELTA,
            current + STEP_DELTA,
            end,
        );
        const stepDelta = preciseRound(next - current, 2);
        //console.log("snapshot delta", stepDelta, "next", next)

        // Handle entity updates
        handleBubbleUpdates(current, snapshotBubbles, stepDelta, true);
        handleNodeUpdates(
            current,
            snapshotWorld,
            snapshotNodes,
            snapshotBubbles,
            snapshotResources,
            stepDelta,
        );

        // Step the snapshotWorld
        snapshotWorld.step(stepDelta);
        current = preciseRound(current + stepDelta, 2);
        snapshotTempTimestamp = current;

        // Run inputs again
        nextInput = snapshotPendingInputs[0];
        //console.log("running snapshotWorld at", current)
        //console.log("next input execution", nextInput?.executionTime)
        while (nextInput?.executionTime == current) {
            snapshotPendingInputs.shift();
            //console.log("running input", nextInput)
            handlePendingInputs(nextInput, true);
            nextInput = snapshotPendingInputs.shift();
        }

        callback?.();
    }

    //console.log("ran snapshotWorld for", current - snapshotLastTimestamp, "seconds")

    // Update the last timestamp
    snapshotLastTimestamp = preciseRound(current, 2);

    // Update world state
    updateState(
        snapshotCurrentState,
        snapshotPendingInputs,
        snapshotUsers,
        snapshotBubbles,
        snapshotPortals,
        snapshotObstacles,
        snapshotNodes,
        snapshotResources,
        snapshotLastTimestamp,
    );

    //ONLY CLIENT: For reconciliation
    snapshots.set(
        snapshotLastTimestamp,
        Object.assign({}, snapshotCurrentState),
    );
    //console.log("assigning snapshot", snapshotLastTimestamp, JSON.stringify(snapshots));


    //console.log("snapshot", snapshots)
    //console.log(snapshots);
    //console.log("world state", snapshotCurrentState)
};
