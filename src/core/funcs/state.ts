import { Contact } from "planck-js";
import { STEP_DELTA } from "../consts";
import { Address } from "../types/address";
import { Bubble } from "../types/bubble";
import { InputWithExecutionTime } from "../types/inputs";
import { Obstacle } from "../types/obstacle";
import { Portal } from "../types/portal";
import { Snapshot } from "../types/state";
import { User } from "../types/user";
import {
    portals,
    bubbles,
    deferredUpdates,
    nodes,
    resources,
    tempTimestamp,
    attractors,
} from "../world";
import { portalAbsorbBubble, portalAbsorbResource } from "./portal";
import { absorbBubble, absorbResource, getBubbleEthMass } from "./bubble";
import {
    snapshotBubbles,
    snapshotDeferredUpdates,
    snapshotPortals,
    snapshotNodes,
    snapshotResources,
    snapshotTempTimestamp,
} from "../snapshots";
import { Resource, ResourceNode } from "../types/resource";
import { nodeAbsorbBubble, nodeAbsorbResource } from "./resource";
import { Attractor } from "../types/entity";
import { AssetType, Protocol } from "../types/protocol";

export const updateState = (
    state: Snapshot,
    pendingInputs: Array<InputWithExecutionTime>,
    users: Map<Address, User>,
    bubbles: Map<string, Bubble>,
    portals: Map<string, Portal>,
    obstacles: Map<string, Obstacle>,
    nodes: Map<string, ResourceNode>,
    resources: Map<string, Resource>,
    attractors: Array<Attractor>,
    protocol: Protocol,
    timestamp: number,
) => {
    state.timestamp = timestamp;
    state.pendingInputs = pendingInputs;
    state.users = Array.from(users.values()).map((user) => ({
        address: user.address,
        balance: user.balance,
    }));
    state.bubbles = Array.from(bubbles.values()).map((bubble) => {
        const puncturesMap = bubble.punctures ?? new Map();
        const punctures = Array.from(puncturesMap?.values());
        const puncturePoints = Array.from(puncturesMap?.keys());
        if(bubble.balance <= 0){
           //console.log("Updating state with zero balance, real mass is: ", bubble.body.getMass());
        }
        return {
            id: bubble.body.getUserData() as string,
            owner: bubble.owner,
            position: bubble.body.getPosition().clone(),
            velocity: bubble.body.getLinearVelocity().clone(),
            mass: getBubbleEthMass(bubble),
            resources: Array.from((bubble.resources ?? []).values()),
            lastPunctureEmit: bubble.lastPunctureEmit,
            punctures: puncturePoints.map((value, index) => {
                return {
                    point: value,
                    puncture: punctures[index],
                };
            }),
            from: bubble.from,
            attractor: null,
        };
    });
    state.portals = Array.from(portals.values()).map((portal) => ({
        id: portal.body.getUserData() as string,
        owner: portal.owner,
        position: portal.body.getPosition().clone(),
        mass: portal.mass,
        resources: Array.from((portal.resources ?? []).values()),
    }));
    state.obstacles = Array.from(obstacles.values()).map((obstacle) => ({
        id: obstacle.body.getUserData() as string,
        position: obstacle.body.getPosition().clone(),
        velocity: obstacle.body.getLinearVelocity().clone(),
        vertices: obstacle.vertices,
    }));

    state.nodes = Array.from(nodes.values()).map((node) => ({
        type: node.resource,
        id: node.body.getUserData() as string,
        owner: node.owner,
        position: node.body.getPosition().clone(),
        mass: node.mass,

        //emission info
        emissionDirection: node.emissionDirection,
        lastEmission: node.lastEmission,
        pendingEthEmission: node.pendingEthEmission.map((x) => x),
        pendingResourceEmission: node.pendingResourceEmission.map((x) => x),

        currentSupply: node.token.currentSupply,
        marketCap: node.token.marketCap,
        k: node.token.k,
    }));

    state.resources = Array.from(resources.values()).map((resource) => ({
        type: resource.resource,
        id: resource.body.getUserData() as string,
        owner: resource.owner,
        position: resource.body.getPosition().clone(),
        velocity: resource.body.getLinearVelocity().clone(),
        mass: resource.body.getMass(),
        attractor: null,
    }));

    state.attractors = [...attractors]

    state.protocol = {
        last: protocol.last,
        balance: protocol.balance[AssetType.ETH],
        pendingEnergyBalance: protocol.getPendingBalance(AssetType.ENERGY),
        pendingEthBalance: protocol.getPendingBalance(AssetType.ETH),
        pendingEnergySpawn: protocol.getPendingSpawn(AssetType.ENERGY),
    }


};

export const createState = (
    pendingInputs: Array<InputWithExecutionTime>,
    users: Map<Address, User>,
    bubbles: Map<string, Bubble>,
    portals: Map<string, Portal>,
    obstacles: Map<string, Obstacle>,
    nodes: Map<string, ResourceNode>,
    resources: Map<string, Resource>,
    attractors: Array<Attractor>,
    protocol: Protocol,
    timestamp: number,
): Snapshot => {
    const state: Snapshot = {
        timestamp: 0,
        pendingInputs: [],
        users: [],
        bubbles: [],
        portals: [],
        obstacles: [],
        nodes: [],
        resources: [],
        attractors: [],
        protocol: {
            last: 0,
            balance: 0,
            pendingEnergyBalance: 0,
            pendingEthBalance: 0,
            pendingEnergySpawn: 0,
        },
    };
    updateState(
        state,
        pendingInputs,
        users,
        bubbles,
        portals,
        obstacles,
        nodes,
        resources,
        attractors,
        protocol,
        timestamp,
    );
    return state;
};

export const getStatePayload = (state: Snapshot): string => {
    return JSON.stringify(state);
};

export const handleContact = (contact: Contact) => {
    const p1 = portals.get(
        contact.getFixtureA().getBody().getUserData() as string,
    );
    const p2 = portals.get(
        contact.getFixtureB().getBody().getUserData() as string,
    );
    const b1 = bubbles.get(
        contact.getFixtureA().getBody().getUserData() as string,
    );
    const b2 = bubbles.get(
        contact.getFixtureB().getBody().getUserData() as string,
    );
    const n1 = nodes.get(
        contact.getFixtureA().getBody().getUserData() as string,
    );
    const n2 = nodes.get(
        contact.getFixtureB().getBody().getUserData() as string,
    );
    const r1 = resources.get(
        contact.getFixtureA().getBody().getUserData() as string,
    );
    const r2 = resources.get(
        contact.getFixtureB().getBody().getUserData() as string,
    );

    //Portal-Bubble collision
    if (p1 && b2) {
        deferredUpdates.push(() => {
            portalAbsorbBubble(tempTimestamp, bubbles, p1, b2, STEP_DELTA);
        });
    } else if (p2 && b1) {
        deferredUpdates.push(() => {
            portalAbsorbBubble(tempTimestamp, bubbles, p2, b1, STEP_DELTA);
        });
    }

    //Bubble-Bubble collision
    else if (b1 && b2) {
        const m1 = b1?.body.getMass();
        const m2 = b2?.body.getMass();
        if (m1 > m2) {
            deferredUpdates.push(() => {
                absorbBubble(bubbles, b1, b2, STEP_DELTA);
            });
        } else if (m2 > m1) {
            deferredUpdates.push(() => {
                absorbBubble(bubbles, b2, b1, STEP_DELTA);
            });
        }
    }

    //Bubble-Resource collision
    else if (b1 && r2) {
        deferredUpdates.push(() => {
            absorbResource(bubbles, resources, nodes, b1, r2, STEP_DELTA, tempTimestamp);
        });
    } else if (b2 && r1) {
        deferredUpdates.push(() => {
            absorbResource(bubbles, resources, nodes, b2, r1, STEP_DELTA, tempTimestamp);
        });
    }

    //Portal-Resource collision
    else if (p1 && r2) {
        deferredUpdates.push(() => {
            portalAbsorbResource(portals, resources, p1, r2, STEP_DELTA);
        });
    } else if (p2 && r1) {
        deferredUpdates.push(() => {
            portalAbsorbResource(portals, resources, p2, r1, STEP_DELTA);
        });
    }

    //Node-RresoureCollideResourceesource collision
    if (n1 && r2) {
        //console.log("node absorb resource")
        deferredUpdates.push(() => {
            nodeAbsorbResource(nodes, resources, bubbles, n1, r2, STEP_DELTA);
        });
    } else if (n2 && r1) {
        //console.log("node absorb resource")
        deferredUpdates.push(() => {
            nodeAbsorbResource(nodes, resources, bubbles, n2, r1, STEP_DELTA);
        });
    }

    //Node-Bubble collision
    else if (n1 && b2) {
        //console.log("node absorb bubble")
        deferredUpdates.push(() => {
            nodeAbsorbBubble(nodes, bubbles, n1, b2, STEP_DELTA);
        });
    } else if (n2 && b1) {
        //console.log("node absorb bubble")
        deferredUpdates.push(() => {
            nodeAbsorbBubble(nodes, bubbles, n2, b1, STEP_DELTA);
        });
    }

    //Resource-Reosurce collision
    else if (r1 && r2) {
        contact.setRestitution(1);
    }

    //Bubble-Obstacle collision
    else if (b1 && !b2) {
        contact.setRestitution(1);
    } else if (b2 && !b1) {
        contact.setRestitution(1);
    }
};

export const handleSnapshotContact = (contact: Contact) => {
    const p1 = snapshotPortals.get(
        contact.getFixtureA().getBody().getUserData() as string,
    );
    const p2 = snapshotPortals.get(
        contact.getFixtureB().getBody().getUserData() as string,
    );
    const b1 = snapshotBubbles.get(
        contact.getFixtureA().getBody().getUserData() as string,
    );
    const b2 = snapshotBubbles.get(
        contact.getFixtureB().getBody().getUserData() as string,
    );
    const n1 = snapshotNodes.get(
        contact.getFixtureA().getBody().getUserData() as string,
    );
    const n2 = snapshotNodes.get(
        contact.getFixtureB().getBody().getUserData() as string,
    );
    const r1 = snapshotResources.get(
        contact.getFixtureA().getBody().getUserData() as string,
    );
    const r2 = snapshotResources.get(
        contact.getFixtureB().getBody().getUserData() as string,
    );

    //Portal-Bubble collision
    if (p1 && b2) {
        snapshotDeferredUpdates.push(() => {
            portalAbsorbBubble(
                snapshotTempTimestamp,
                snapshotBubbles,
                p1,
                b2,
                STEP_DELTA,
            );
        });
    } else if (p2 && b1) {
        snapshotDeferredUpdates.push(() => {
            portalAbsorbBubble(
                snapshotTempTimestamp,
                snapshotBubbles,
                p2,
                b1,
                STEP_DELTA,
            );
        });
    }

    //Bubble-Bubble collision
    else if (b1 && b2) {
        const m1 = b1?.body.getMass();
        const m2 = b2?.body.getMass();
        if (m1 > m2) {
            snapshotDeferredUpdates.push(() => {
                absorbBubble(snapshotBubbles, b1, b2, STEP_DELTA);
            });
        } else if (m2 > m1) {
            snapshotDeferredUpdates.push(() => {
                absorbBubble(snapshotBubbles, b2, b1, STEP_DELTA);
            });
        }
    }

    //Bubble-Resource collision
    else if (b1 && r2) {
        snapshotDeferredUpdates.push(() => {
            absorbResource(
                snapshotBubbles,
                snapshotResources,
                snapshotNodes,
                b1,
                r2,
                STEP_DELTA,
                snapshotTempTimestamp,
                true
            );
        });
    } else if (b2 && r1) {
        snapshotDeferredUpdates.push(() => {
            absorbResource(
                snapshotBubbles,
                snapshotResources,
                snapshotNodes,
                b2,
                r1,
                STEP_DELTA,
                snapshotTempTimestamp,
                true
            );
        });
    }

    //Portal-Resource collision
    else if (p1 && r2) {
        snapshotDeferredUpdates.push(() => {
            portalAbsorbResource(
                snapshotPortals,
                snapshotResources,
                p1,
                r2,
                STEP_DELTA,
            );
        });
    } else if (p2 && r1) {
        snapshotDeferredUpdates.push(() => {
            portalAbsorbResource(
                snapshotPortals,
                snapshotResources,
                p2,
                r1,
                STEP_DELTA,
            );
        });
    }

    //Node-RresoureCollideResourceesource collision
    if (n1 && r2) {
        snapshotDeferredUpdates.push(() => {
            nodeAbsorbResource(
                snapshotNodes,
                snapshotResources,
                snapshotBubbles,
                n1,
                r2,
                STEP_DELTA,
            );
        });
    } else if (n2 && r1) {
        snapshotDeferredUpdates.push(() => {
            nodeAbsorbResource(
                snapshotNodes,
                snapshotResources,
                snapshotBubbles,
                n2,
                r1,
                STEP_DELTA,
            );
        });
    }

    //Node-Bubble collision
    else if (n1 && b2) {
        snapshotDeferredUpdates.push(() => {
            nodeAbsorbBubble(
                snapshotNodes,
                snapshotBubbles,
                n1,
                b2,
                STEP_DELTA,
            );
        });
    } else if (n2 && b1) {
        snapshotDeferredUpdates.push(() => {
            nodeAbsorbBubble(
                snapshotNodes,
                snapshotBubbles,
                n2,
                b1,
                STEP_DELTA,
            );
        });
    }

    //Resource-Reosurce collision
    else if (r1 && r2) {
        contact.setRestitution(1);
    }

    //Bubble-Obstacle collision
    else if (b1 && !b2) {
        contact.setRestitution(1);
    } else if (b2 && !b1) {
        contact.setRestitution(1);
    }
};
