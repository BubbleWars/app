import { Contact } from "planck-js";
import { STEP_DELTA } from "../consts";
import { Address } from "../types/address";
import { Bubble } from "../types/bubble";
import { InputWithExecutionTime } from "../types/inputs";
import { Obstacle, ObstacleGroup } from "../types/obstacle";
import { Portal } from "../types/portal";
import { ItemBubbleState, Snapshot } from "../types/state";
import { User } from "../types/user";
import {
    portals,
    bubbles,
    deferredUpdates,
    nodes,
    resources,
    tempTimestamp,
    attractors,
    protocol,
    world,
    users,
    obstacles,
    pendingInputs,
    itemObstacles,
    itemBubbles,
    worldState,
} from "../world";
import { portalAbsorbBubble, portalAbsorbResource } from "./portal";
import { absorbBubble, absorbResource, bubbleRemoveEth, getBubbleEthMass, setBubbleEthMass } from "./bubble";
import {
    snapshotBubbles,
    snapshotDeferredUpdates,
    snapshotPortals,
    snapshotNodes,
    snapshotResources,
    snapshotTempTimestamp,
    snapshotProtocol,
    snapshotWorldState,
} from "../snapshots";
import { Resource, ResourceNode } from "../types/resource";
import { nodeAbsorbBubble, nodeAbsorbResource } from "./resource";
import { Attractor } from "../types/entity";
import { AssetType, FeeType, Protocol } from "../types/protocol";
import { getBodyId, getObstacleGroupState } from "./obstacle";
import { stat } from "fs";
import { getFixtureType, handleWeaponBubbleContact, handleWeaponObjectContact, isBubbleShieldActive } from "./items";
import { get } from "http";
import { absorbItemBubble, absorbItemObstacle } from "./entity";
import { ItemBubble, ItemObstacle } from "../types/items";

export const updateState = (
    state: Snapshot,
    pendingInputs: Array<InputWithExecutionTime>,
    users: Map<Address, User>,
    bubbles: Map<string, Bubble>,
    portals: Map<string, Portal>,
    obstacles: ObstacleGroup[],
    nodes: Map<string, ResourceNode>,
    resources: Map<string, Resource>,
    attractors: Array<Attractor>,
    protocol: Protocol,
    itemBubbles: ItemBubble[],
    itemObstacles: ItemObstacle[],
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
            inventory: bubble.inventory.items,
            equipped: bubble.inventory.equipped,
        };
    });
    state.portals = Array.from(portals.values()).map((portal) => ({
        id: portal.body.getUserData() as string,
        owner: portal.owner,
        position: portal.body.getPosition().clone(),
        mass: portal.mass,
        resources: Array.from((portal.resources ?? []).values()),
        inventory: portal.inventory.items,
        equipped: portal.inventory.equipped,
    }));
    state.obstacles = getObstacleGroupState(obstacles);

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

    state.itemBubbles = itemBubbles.map((item) => ({
        item: item.item,
        position: { x: item.body.getPosition().x, y: item.body.getPosition().y },
        velocity: { x: item.body.getLinearVelocity().x, y: item.body.getLinearVelocity().y }
    }));

    state.itemObstacles = itemObstacles.map((item) => ({
        item: item.item,
        position: { x: item.body.getPosition().x, y: item.body.getPosition().y },
        velocity: { x: item.body.getLinearVelocity().x, y: item.body.getLinearVelocity().y }
    }));


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
        itemBubbles,
        itemObstacles,
        timestamp,
    );
    return state;
};

export const getStatePayload = (state: Snapshot): string => {
    return JSON.stringify(state);
};

export const handleContact = (contact: Contact) => {
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();
    const fixtureAType = getFixtureType(fixtureA);
    const fixtureBType = getFixtureType(fixtureB);
    const bodyA = fixtureA.getBody();
    const bodyB = fixtureB.getBody();
    const idA = getBodyId(bodyA);
    const idB = getBodyId(bodyB);
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
    const itemBubble1 = itemBubbles.find((item) =>  getBodyId(item.body) == idA);
    const itemBubble2 = itemBubbles.find((item) =>  getBodyId(item.body) == idB);

    const itemObstacle1 = itemObstacles.find((item) =>  getBodyId(item.body) == idA);
    const itemObstacle2 = itemObstacles.find((item) =>  getBodyId(item.body) == idB);

    const is1Edge = contact.getFixtureA().getShape().getType() == 'edge'
    const is2Edge = contact.getFixtureB().getShape().getType() == 'edge'


    //Sword-Bubble collision
    const fixtureAIsSword = fixtureAType == 'sword';
    const fixtureBIsSword = fixtureBType == 'sword';
    if(fixtureAIsSword && b2){
        handleWeaponBubbleContact(worldState, b1, b2)
    }else if (fixtureBIsSword && b1) {
        handleWeaponBubbleContact(worldState, b2, b1)
    }
    //Sword-Sword collision
    else if (fixtureAIsSword && fixtureBIsSword) {
        handleWeaponObjectContact(worldState, bodyA, bodyB)
    }
    //Sword-Everything collision
    else if (fixtureAIsSword) {
        handleWeaponObjectContact(worldState, bodyA, bodyB)
    } else if (fixtureBIsSword) {
        handleWeaponObjectContact(worldState, bodyB, bodyA)

    }
    //Portal-Bubble collision
    else if (p1 && b2) {
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
            if(isBubbleShieldActive(b2)){
                contact.setRestitution(1);
            }else{
            deferredUpdates.push(() => {
                absorbBubble(bubbles, b1, b2, STEP_DELTA);
            })}
        } else if (m2 > m1) {
            if(isBubbleShieldActive(b1)){
                contact.setRestitution(1);
            }else { deferredUpdates.push(() => {
                absorbBubble(bubbles, b2, b1, STEP_DELTA);
            })}
        }
    }

    //Bubble-ItemBubble collision
    else if (b1 && itemBubble2) {
        deferredUpdates.push(() => {
            absorbItemBubble<Bubble>(worldState, 'bubble', b1, itemBubble2)
        });
    
    } else if (b2 && itemBubble1) {
        deferredUpdates.push(() => {
            absorbItemBubble<Bubble>(worldState, 'bubble', b2, itemBubble1)
        });
    }

    //Bubble-ItemObstacle collision
    else if (b1 && itemObstacle2) {
        deferredUpdates.push(() => {
           absorbItemObstacle<Bubble>(worldState, 'bubble', b1, itemObstacle2)
           
        });
        
    } else if (b2 && itemObstacle1) {
        deferredUpdates.push(() => {
            absorbItemObstacle<Bubble>(worldState, 'bubble', b2, itemObstacle1)
        });
    }

    //Portal-ItemBubble collision
    else if (p1 && itemBubble2) {
        deferredUpdates.push(() => {
            absorbItemBubble<Portal>(worldState, 'portal', p1, itemBubble2)
            
        });
    } else if (p2 && itemBubble1) {
        deferredUpdates.push(() => {
            absorbItemBubble<Portal>(worldState, 'portal', p2, itemBubble1)
        });
    }

    //Portal-ItemObstacle collision
    else if (p1 && itemObstacle2) {
        deferredUpdates.push(() => {
            absorbItemObstacle<Portal>(worldState, 'portal', p1, itemObstacle2)
        });
    } else if (p2 && itemObstacle1) {
        deferredUpdates.push(() => {
            absorbItemObstacle<Portal>(worldState, 'portal', p2, itemObstacle1)
        });
    }

    //Node ItemBubble collision
    else if (n1 && itemBubble2) {
        deferredUpdates.push(() => {
            absorbItemBubble<ResourceNode>(worldState, 'node', n1, itemBubble2)
        });
    } else if (n2 && itemBubble1) {
        deferredUpdates.push(() => {
            absorbItemBubble<ResourceNode>(worldState, 'node', n2, itemBubble1)
        });
    }

    //Node ItemObstacle collision
    else if (n1 && itemObstacle2) {
        deferredUpdates.push(() => {
            absorbItemObstacle<ResourceNode>(worldState, 'node', n1, itemObstacle2)
        });
    } else if (n2 && itemObstacle1) {
        deferredUpdates.push(() => {
            absorbItemObstacle<ResourceNode>(worldState, 'node', n2, itemObstacle1)
        });
    }

    //Bubble-Resource collision
    else if (b1 && r2) {
        deferredUpdates.push(() => {
            absorbResource(bubbles, resources, nodes, protocol, b1, r2, STEP_DELTA, tempTimestamp);
        });
    } else if (b2 && r1) {
        deferredUpdates.push(() => {
            absorbResource(bubbles, resources, nodes, protocol, b2, r1, STEP_DELTA, tempTimestamp);
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
            nodeAbsorbResource(nodes, resources, bubbles, protocol, n1, r2, STEP_DELTA);
        });
    } else if (n2 && r1) {
        //console.log("node absorb resource")
        deferredUpdates.push(() => {
            nodeAbsorbResource(nodes, resources, bubbles, protocol, n2, r1, STEP_DELTA);
        });
    }

    //Node-Bubble collision
    else if (n1 && b2) {
        //console.log("node absorb bubble")
        deferredUpdates.push(() => {
            nodeAbsorbBubble(nodes, bubbles, protocol, n1, b2, STEP_DELTA);
        });
    } else if (n2 && b1) {
        //console.log("node absorb bubble")
        deferredUpdates.push(() => {
            nodeAbsorbBubble(nodes, bubbles, protocol, n2, b1, STEP_DELTA);
        });
    }

    //Resource-Reosurce collision
    else if (r1 && r2) {
        contact.setRestitution(1);
    } 
    
    //Bubble-Border collision
    else if (b1 && is2Edge) {
        contact.setRestitution(1);
    } else if (b2 && is1Edge) {
        contact.setRestitution(1);
    }

    //Bubble-Obstacle collision
    else if (b1 && !b2) {
        contact.setRestitution(1);
    } else if (b2 && !b1) {
        contact.setRestitution(1);
    }


    else {
        contact.setRestitution(1);
    }
};

export const handleSnapshotContact = (contact: Contact) => {
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();
    const fixtureAType = getFixtureType(fixtureA);
    const fixtureBType = getFixtureType(fixtureB);
    const bodyA = fixtureA.getBody();
    const bodyB = fixtureB.getBody();
    const idA = getBodyId(bodyA);
    const idB = getBodyId(bodyB);
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
    const itemBubble1 = itemBubbles.find((item) =>  getBodyId(item.body) == idA);
    const itemBubble2 = itemBubbles.find((item) =>  getBodyId(item.body) == idB);

    const itemObstacle1 = itemObstacles.find((item) =>  getBodyId(item.body) == idA);
    const itemObstacle2 = itemObstacles.find((item) =>  getBodyId(item.body) == idB);

    const is1Edge = contact.getFixtureA().getShape().getType() == 'edge'
    const is2Edge = contact.getFixtureB().getShape().getType() == 'edge'

    //Sword-Bubble collision
    const fixtureAIsSword = fixtureAType == 'sword';
    const fixtureBIsSword = fixtureBType == 'sword';
    if(fixtureAIsSword && b2){
        handleWeaponBubbleContact(snapshotWorldState, b1, b2)
    }else if (fixtureBIsSword && b1) {
        handleWeaponBubbleContact(snapshotWorldState, b2, b1)
    }
    //Sword-Sword collision
    else if (fixtureAIsSword && fixtureBIsSword) {
        handleWeaponObjectContact(snapshotWorldState, bodyA, bodyB)
    }
    //Sword-Everything collision
    else if (fixtureAIsSword) {
        handleWeaponObjectContact(snapshotWorldState, bodyA, bodyB)
    } else if (fixtureBIsSword) {
        handleWeaponObjectContact(snapshotWorldState, bodyB, bodyA)

    }

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

    //Bubble-ItemBubble collision
    else if (b1 && itemBubble2) {
        deferredUpdates.push(() => {
            absorbItemBubble<Bubble>(snapshotWorldState, 'bubble', b1, itemBubble2)
        });
    
    } else if (b2 && itemBubble1) {
        deferredUpdates.push(() => {
            absorbItemBubble<Bubble>(snapshotWorldState, 'bubble', b2, itemBubble1)
        });
    }

    //Bubble-ItemObstacle collision
    else if (b1 && itemObstacle2) {
        deferredUpdates.push(() => {
           absorbItemObstacle<Bubble>(snapshotWorldState, 'bubble', b1, itemObstacle2)
           
        });
        
    } else if (b2 && itemObstacle1) {
        deferredUpdates.push(() => {
            absorbItemObstacle<Bubble>(snapshotWorldState, 'bubble', b2, itemObstacle1)
        });
    }

    //Portal-ItemBubble collision
    else if (p1 && itemBubble2) {
        deferredUpdates.push(() => {
            absorbItemBubble<Portal>(snapshotWorldState, 'portal', p1, itemBubble2)
            
        });
    } else if (p2 && itemBubble1) {
        deferredUpdates.push(() => {
            absorbItemBubble<Portal>(snapshotWorldState, 'portal', p2, itemBubble1)
        });
    }

    //Portal-ItemObstacle collision
    else if (p1 && itemObstacle2) {
        deferredUpdates.push(() => {
            absorbItemObstacle<Portal>(snapshotWorldState, 'portal', p1, itemObstacle2)
        });
    } else if (p2 && itemObstacle1) {
        deferredUpdates.push(() => {
            absorbItemObstacle<Portal>(snapshotWorldState, 'portal', p2, itemObstacle1)
        });
    }

    //Node ItemBubble collision
    else if (n1 && itemBubble2) {
        deferredUpdates.push(() => {
            absorbItemBubble<ResourceNode>(snapshotWorldState, 'node', n1, itemBubble2)
        });
    } else if (n2 && itemBubble1) {
        deferredUpdates.push(() => {
            absorbItemBubble<ResourceNode>(snapshotWorldState, 'node', n2, itemBubble1)
        });
    }

    //Node ItemObstacle collision
    else if (n1 && itemObstacle2) {
        deferredUpdates.push(() => {
            absorbItemObstacle<ResourceNode>(snapshotWorldState, 'node', n1, itemObstacle2)
        });
    } else if (n2 && itemObstacle1) {
        deferredUpdates.push(() => {
            absorbItemObstacle<ResourceNode>(snapshotWorldState, 'node', n2, itemObstacle1)
        });
    }

    //Bubble-Resource collision
    else if (b1 && r2) {
        snapshotDeferredUpdates.push(() => {
            absorbResource(
                snapshotBubbles,
                snapshotResources,
                snapshotNodes,
                snapshotProtocol,
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
                snapshotProtocol,
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
                snapshotProtocol,
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
                snapshotProtocol,
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
                snapshotProtocol,
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
                snapshotProtocol,
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

    //Bubble-Border collision
    else if (b1 && is2Edge) {
        const remainingEth = protocol.processFee(FeeType.BORDER, AssetType.ETH, getBubbleEthMass(b1));
        setBubbleEthMass(b1, remainingEth);
        contact.setRestitution(1);
    } else if (b2 && is1Edge) {
        const remainingEth = protocol.processFee(FeeType.BORDER, AssetType.ETH, getBubbleEthMass(b2));
        setBubbleEthMass(b2, remainingEth);
        contact.setRestitution(1);
    }
    
    //Bubble-Obstacle collision
    else if (b1 && !b2) {
        contact.setRestitution(1);
    } else if (b2 && !b1) {
        contact.setRestitution(1);
    }

    else {
        contact.setRestitution(1);
    }
};
