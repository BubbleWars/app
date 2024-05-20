import { Circle, Vec2, World } from "planck-js";
import { RESOURCE_MASS, Resource, ResourceNode, ResourceType, Token } from "../types/resource";
import { calculateEmissionVelocity, massToRadius } from "./utils";
import { ZeroAddress } from "ethers";
import {
    DAMPENING,
    EMISSION_SPEED,
    MASS_PER_SECOND,
    PLANCK_MASS,
    WORLD_HEIGHT,
    WORLD_WIDTH,
} from "../consts";
import { createBubble, destroyBubble, getBubbleEthMass, getBubbleResourceMass, updateBubble } from "./bubble";
import { Bubble } from "../types/bubble";
import { addEvent } from "./events";
import { EventsType } from "../types/events";
import { createNoise2D } from "simplex-noise";
import Alea from "alea";
import { ResourceNodeState, ResourceState } from "../types/state";
import { Portal } from "../types/portal";
import { Attractor } from "../types/entity";
import { addAttractor } from "./entity";
import { pseudoRandom } from "./portal";

export const resourceMassToAmount = (type: ResourceType, mass: number): number => {
    return mass / RESOURCE_MASS[type];
}

export const resourceAmountToMass = (type: ResourceType, amount: number): number => {
    return amount * RESOURCE_MASS[type];
}

export const resourceMassToRadius = (type: ResourceType, amount: number): number => {
    return massToRadius(amount * RESOURCE_MASS[type]);
}

//Generates random initial starting point for resource nodes
export const generateNodes = (
    world: World,
    nodes: Map<string, ResourceNode>,
    amount: number,
): void => {
    amount;
    const prng = Alea(7969);
    const noise = createNoise2D(prng);
    let count = 0;

    // for (let y = -WORLD_WIDTH / 2; y < WORLD_WIDTH / 2; y += 100) {
    //     for (let x = -WORLD_HEIGHT / 2; x < WORLD_HEIGHT / 2; x += 100) {
    //         const value = noise(x / 100, y / 100);
    //         //console.log("noise value", value);
    //         if (value > 0.9) {
    //             createNode(world, nodes, ResourceType.Energy, x, y, 0);
    //             count++;
    //         }
    //         //if(count >= 50) return;
    //     }
    // }

    createNode(world, nodes, ResourceType.ENERGY, 0, 0, 0);

    //console.log("spawned nodes", count);
};

export const generateNodeId = (nodes: Map<string, ResourceNode>): string => {
    let max = 0;
    nodes.forEach((node) => {
        const id = parseInt(node.id);
        if (id > max) max = id;
    });
    return `node-${max + 1}`;
};

export const generateResourceId = (
    resources: Map<string, Resource>,
): string => {
    let max = 0;
    resources.forEach((value, key) => {
        value;
        const split = key.split("-");
        const number = parseInt(split[split.length - 1]);
        if (number > max) max = number;
    });
    return `resource-${max + 1}`;
};

export const createNode = (
    world: World,
    nodes: Map<string, ResourceNode>,
    type: ResourceType = ResourceType.ENERGY,
    x: number,
    y: number,
    mass: number = 0,
    id?: string,
    emissionDirection?: { x: number; y: number },
    lastEmission?: number,
    nodeState?: ResourceNodeState,
): ResourceNode => {
    //default radius of nodes equates to 1 mass
    const radius = massToRadius(1);
    const body = world.createBody({ position: Vec2(x, y), type: "static" });
    const fixture = body.createFixture({
        shape: Circle(radius),
        density: 1,
        restitution: 0,
        friction: 0,
    });
    const node: ResourceNode = {
        id: id ?? generateNodeId(nodes),
        resource: type,
        mass,
        body,
        fixture,
        owner: "0x0000000000000000000000000000000000000001",
        balance: 0,
        emitted: 0,
        pendingEthEmission: [],
        pendingResourceEmission: [],
        emissionDirection: emissionDirection ?? { x: -1, y: -1 },
        lastEmission: lastEmission ?? 0,
        token: new Token(),
    };
    node.body.setUserData(`node-${nodes.size}`);
    nodes.set(node.body.getUserData() as string, node);

    if(nodeState){
        //Emission info
        node.emissionDirection = nodeState.emissionDirection;
        node.lastEmission = nodeState.lastEmission;
        node.pendingEthEmission = nodeState.pendingEthEmission;
        node.pendingResourceEmission = nodeState.pendingResourceEmission;

        //Tokebn bonding curve info
        node.token.currentSupply = nodeState.currentSupply;
        node.token.marketCap = nodeState.marketCap;
        node.token.inflation = nodeState.inflation;
        node.token.burn = nodeState.burn;
        node.token.k = nodeState.k;

        node.token.inflationRate = nodeState.inflationRate;
        node.token.inflationPeriod = nodeState.inflationPeriod;
        node.token.lastInflation = nodeState.lastInflation;
    }

    return node;
};

export const createResource = (
    timestamp: number,
    world: World,
    resources: Map<string, Resource>,
    type: ResourceType,
    x: number,
    y: number,
    mass: number,
    owner: string = ZeroAddress,
    id?: string,
    resourceState?: ResourceState,
): Resource => {
    const radius = resourceMassToRadius(type, mass);
    const body = world.createBody({
        position: Vec2(x, y),
        type: "dynamic",
        linearDamping: DAMPENING,
    });
    body.setMassData({ mass, center: Vec2(0, 0), I: 0 });
    const fixture = body.createFixture({
        shape: Circle(radius),
        density: 1,
        restitution: 0,
        friction: 0,
    });
    const resourceId = id ?? generateResourceId(resources);
    const resource: Resource = {
        id: resourceId,
        resource: type,
        body,
        fixture,
        owner,
        balance: 0,
        from: owner,
    };
    resource.body.setUserData(resourceId);
    resources.set(resource.body.getUserData() as string, resource);
    //    //console.log("404::creating resource", {
    //         id: `${resources.size}`,
    //         resource: type,
    //         position: {x, y},
    //         owner: ZeroAddress,
    //         balance: 0,
    //     });

    addEvent({
        timestamp,
        type: EventsType.CreateResource,
        id: resource.id,
        position: { x, y },
    });

    if(resourceState){
        //resource.attractor = resourceState.attractor;
    }

    return resource;
};

export const updateNode = (
    node: ResourceNode,
    newMass: number,
    newEmitted?: number,
): void => {
    node.mass = newMass;
    //console.log("new node mass", newMass);
    if (newEmitted) node.emitted = newEmitted;
    const radius = massToRadius(Math.max(node.mass, 1));
    node.body.destroyFixture(node.fixture);
    node.fixture = node.body.createFixture({
        shape: Circle(radius),
        density: 1,
        restitution: 0,
        friction: 0,
    });
};

export const updateResource = (
    resources: Map<string, Resource>,
    resource: Resource,
    newMass: number,
    timestamp: number = 0,
): void => {
    if (newMass <= 0) {
        resources.delete(resource.body.getUserData() as string);
        resource.body.getWorld().destroyBody(resource.body);
        resource = null;
        return;
    }
    resource.body.setMassData({ mass: newMass, center: Vec2(0, 0), I: 0 });
    const mass = resource.body.getMass();
    const radius = resourceMassToRadius(resource.resource, mass);
    resource.body.destroyFixture(resource.fixture);
    resource.fixture = resource.body.createFixture({
        shape: Circle(radius),
        density: 1,
        restitution: 0,
        friction: 0,
    });
};

export const nodeEmitResource = (
    timestamp: number,
    world: World,
    node: ResourceNode,
    resources: Map<string, Resource>,
    newNodeMass: number,
    emittedMass: number,
    direction: Vec2,
): Resource => {
    const radius = massToRadius(newNodeMass) + 0.2;
    const emittedResourceRadius = resourceMassToRadius(node.resource, emittedMass);
    const centerDelta = direction.clone().mul(radius + emittedResourceRadius);
    const emittedResourcePosition = node.body
        .getPosition()
        .clone()
        .add(centerDelta);
    const emittedResource = createResource(
        timestamp,
        world,
        resources,
        node.resource,
        emittedResourcePosition.x,
        emittedResourcePosition.y,
        emittedMass,
        node.id,
    );

    //Apply mass conservation
    const newResourceMass = newNodeMass;
    const newResourceEmission = node.emitted + emittedMass;
    updateNode(node, newResourceMass, newResourceEmission);

    //Apply momentum
    const emittedResourceVelocityDirection = direction.clone();
    const emittedResourceVelocityMagnitude = calculateEmissionVelocity(newNodeMass, emittedMass);
    const emittedResourceRelativeVelocity =
        emittedResourceVelocityDirection.mul(emittedResourceVelocityMagnitude);
    const emittedResourceVelocity = node.body
        .getLinearVelocity()
        .clone()
        .add(emittedResourceRelativeVelocity);
    emittedResource.body.setLinearVelocity(emittedResourceVelocity);

   //console.log("11emitted resource", emittedResourcePosition);
    return emittedResource;
};

export const nodeEmitBubble = (
    timestamp: number,
    world: World,
    bubbles: Map<string, Bubble>,
    node: ResourceNode,
    newNodeMass: number,
    emittedMass: number,
    direction: Vec2,
): Bubble => {
    const radius = massToRadius(newNodeMass) + 1;
    const emittedBubbleRadius = massToRadius(emittedMass);
    const centerDelta = direction.clone().mul((radius + emittedBubbleRadius)*2);
    const emittedBubblePosition = node.body
        .getPosition()
        .clone()
        .add(centerDelta);
    const emittedBubble = createBubble(
        timestamp,
        bubbles,
        world,
        node.owner,
        emittedBubblePosition.x,
        emittedBubblePosition.y,
        emittedMass,
        false,
        null,
        null,
        node.id,
    );

    //console.log("emitting bubble from node", emittedBubblePosition);

    //Apply mass conservation
    const newResourceMass = newNodeMass;
    updateNode(node, newResourceMass);

    //Apply momentum
    const emittedBubbleVelocityDirection = direction.clone();
    const emittedBubbleVelocityMagnitude = calculateEmissionVelocity(newNodeMass, emittedMass);
    const emittedBubbleRelativeVelocity = emittedBubbleVelocityDirection.mul(
        emittedBubbleVelocityMagnitude,
    );
    const emittedBubbleVelocity = node.body
        .getLinearVelocity()
        .clone()
        .add(emittedBubbleRelativeVelocity);
    emittedBubble.body.setLinearVelocity(emittedBubbleVelocity);

    return emittedBubble;
};

export const addPendingResourceEmission = (
    depositor: string,
    node: ResourceNode,
    amount: number,
): void => {
    if(depositor == "0x" || depositor == "0x0000000000000000000000000000000000000001" || amount <= 0) return;
    const pendingResourceEmit = node.pendingResourceEmission
        .find((pending) => pending.depositor === depositor)
    if (pendingResourceEmit) {
        pendingResourceEmit.amount += amount;
    } else {
        node.pendingResourceEmission.push({ depositor, amount });
    }
}

export const addPendingEthEmission = (
    depositor: string,
    node: ResourceNode,
    amount: number,
): void => {
    if(depositor == "0x" || depositor == "0x0000000000000000000000000000000000000001" || amount <= 0) return;
    const pendingEthEmit = node.pendingEthEmission
        .find((pending) => pending.depositor === depositor)
    if (pendingEthEmit) {
        pendingEthEmit.amount += amount;
    } else {
        node.pendingEthEmission.push({ depositor, amount });
    }
    console.log("pending eth emission", node.pendingEthEmission);
}

export const removePendingResourceEmission = (
    depositor: string,
    node: ResourceNode,
    amount: number,
): void => {
    const pendingResourceEmit = node.pendingResourceEmission
        .find((pending) => pending.depositor === depositor)
    if (pendingResourceEmit) {
        pendingResourceEmit.amount -= amount;
    }

    //remove pending emission if amount is 0
    node.pendingResourceEmission = node.pendingResourceEmission
        .filter((pending) => pending.amount > 0);
}

export const removePendingEthEmission = (
    depositor: string,
    node: ResourceNode,
    amount: number,
): void => {
    const pendingEthEmit = node.pendingEthEmission
        .find((pending) => pending.depositor === depositor)
    if (pendingEthEmit) {
        pendingEthEmit.amount -= amount;
    }

    //remove pending emission if amount is 0
    node.pendingEthEmission = node.pendingEthEmission
        .filter((pending) => pending.amount > 0);
}

export const nodeAbsorbResource = (
    nodes: Map<string, ResourceNode>,
    resources: Map<string, Resource>,
    bubbles: Map<string, Bubble>,
    node: ResourceNode,
    absorbedResource: Resource,
    timeElapsed: number,
): void => {
    const currentMass = node.mass;
    const resourceAbsorbed = resourceMassToAmount(absorbedResource.resource, absorbedResource.body.getMass());

    //get emission
    const ethToEmission = node.token.sell(resourceAbsorbed);

    updateResource(resources, absorbedResource, 0);
    updateNode(node, currentMass - ethToEmission);

    //Add pending eth emission
    const nearestDepositor  = absorbedResource.owner ?? absorbedResource.from;
    addPendingEthEmission(nearestDepositor, node, ethToEmission);

};

export const nodeAbsorbBubble = (
    nodes: Map<string, ResourceNode>,
    bubbles: Map<string, Bubble>,
    node: ResourceNode,
    absorbedBubble: Bubble,
    timeElapsed: number,
): void => {
    const currentMass = node.mass;
    const ethAbsorbed = getBubbleEthMass(absorbedBubble);
    const epBurned = getBubbleResourceMass(absorbedBubble, ResourceType.ENERGY)
    
    destroyBubble(bubbles, absorbedBubble)
    updateNode(node, currentMass + ethAbsorbed);

    //Add pending resource emission
    const resourceToEmit = node.token.buy(ethAbsorbed)
    const nearestDepositor = getNearestBubbleToPositionWithMinMass(
        node.body.getPosition(), bubbles, absorbedBubble.owner, PLANCK_MASS
    )?.body.getUserData() as string ?? "0x"
    addPendingResourceEmission(nearestDepositor, node, resourceToEmit);
};

export const getAdjustedRatio = (node: ResourceNode): number => {
    const totalEmitted = node.emitted;
    const realMass = node.mass;
    const calculatedMass = Math.pow(totalEmitted, 2) / 2;

    return realMass / calculatedMass;
};

//Y = x bonding curve
//Get what should be emitted if recieved bubble mass
export const getEmission = (
    node: ResourceNode,
    mass: number,
): { newMass: number; emission: number } => {
    if (mass < 0) return getBubbleEmission(node, mass);
    const prevMass = node.mass;
    const newMass = node.mass + mass;
    const emission = Math.sqrt(newMass * 2) - Math.sqrt(prevMass * 2);
    return { newMass, emission };
};

//Y = x bonding curve
//Get what should be emitted if recieved resource mass
export const getBubbleEmission = (
    node: ResourceNode,
    mass: number, // resource mass recieved INFO: MAss is negative
): { newMass: number; emission: number } => {
    const currentMass = node.mass;
    const currentEmission = Math.sqrt(currentMass * 2);
    const newEmitted = currentEmission + mass;
    const newMass = Math.pow(newEmitted, 2) / 2;

    //Calculate amount to emit if recieved resource mass
    const emission = currentMass - newMass;
    return { newMass, emission };
};

//Emit Resource or Bubble,
//Positive mass for resource, negative for bubble
export const handleEmission = (
    timestamp: number,
    world: World,
    node: ResourceNode,
    bubbles: Map<string, Bubble>,
    resources: Map<string, Resource>,
    mass: number,
    startDir: Vec2,
    isSnapshot: boolean = false
): Resource | Bubble | undefined | any => {
   //console.log("handling emission", mass);
    //console.log("node", node);
   //console.log("emission", mass, startDir);
    //const { newMass, emission } = getEmission(node, mass);
    const newMass = node.mass;
    const emission = Math.abs(mass);
    //console.log("emission", newMass, emission);
    if (mass < 0) {
        //for (let i = 0; i < 1; i++) {
            const massToEmit = emission ;
            const direction = rotateVec2(startDir, (Math.PI / 8));
            //console.log(isSnapshot ? "SNAPSHOT" : "", "emitting resource", massToEmit, direction);
            return nodeEmitResource(
                timestamp,
                world,
                node,
                resources,
                newMass,
                massToEmit,
                direction,
            );
        //}
    }
    if (mass > 0) {
        //for (let i = 0; i < 1; i++) {
            const massToEmit = emission ;
            const direction = rotateVec2(startDir, (Math.PI / 8) );
            //console.log(isSnapshot ? "SNAPSHOT" : "", "emitting bubble", massToEmit, direction);
            return nodeEmitBubble(
                timestamp,
                world,
                bubbles,
                node,
                newMass,
                massToEmit,
                direction,
            );
        //}
    }
};

// export const handleInflation = (
//     world: World,
//     node: ResourceNode,
//     resources: Map<string, Resource>,
//     mass: number,
//     direction: Vec2,
// ): Resource => {
//     const emittedResource = nodeEmitResource(timestamp, world, node, resources, node.mass, mass, direction);

//     return emittedResource;
// }
// function getPrice(uint256 supply, uint256 amount) public pure returns (uint256) {
//     uint256 sum1 = supply == 0 ? 0 : (supply - 1 )* (supply) * (2 * (supply - 1) + 1) / 6;
//     uint256 sum2 = supply == 0 && amount == 1 ? 0 : (supply - 1 + amount) * (supply + amount) * (2 * (supply - 1 + amount) + 1) / 6;
//     uint256 summation = sum2 - sum1;
//     return summation * 1 ether / 16000;
// }

// function getBuyPrice(address sharesSubject, uint256 amount) public view returns (uint256) {
//     return getPrice(sharesSupply[sharesSubject], amount);
// }

// function getSellPrice(address sharesSubject, uint256 amount) public view returns (uint256) {
//     return getPrice(sharesSupply[sharesSubject] - amount, amount);
// }

// Function to rotate a Vec2 by a given angle
export function rotateVec2(vector, angle) {
    const dir = Vec2(vector.x, vector.y);
    dir.normalize();
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return Vec2(
        dir.x * cos - dir.y * sin,
        dir.x * sin + dir.y * cos,
    );
}

export function crossProduct(a: Vec2, b: Vec2): number {
    return a.x * b.y - a.y * b.x;
}

export function crossProductAngle(a: Vec2, b: Vec2, angle: number): number {
    const l1 = a.clone().length();
    const l2 = b.clone().length();
    return l1 * l2* Math.sin(angle);
}

export function angleBetween(a: Vec2, b: Vec2): number {
    return Math.atan2(crossProduct(a, b), Vec2.dot(a, b));
}

export const handleNodeUpdates = (
    timestamp: number,
    world: World,
    nodes: Map<string, ResourceNode>,
    bubbles: Map<string, Bubble>,
    resources: Map<string, Resource>,
    attractors: Attractor[],
    timeElapsed: number,
    isSnapshot: boolean = false
): void => {
    timeElapsed;
    nodes.forEach((node) => {
        //HANDLE EMISSIONS
        node.pendingResourceEmission.forEach((pending) => {
            if (!node.lastEmission) node.lastEmission = timestamp;
            const lastEmission = node.lastEmission;
            if (timestamp - lastEmission < 0.1) {
                return;
            }
            //console.log("pending resource mass", node.pendingResourceMass);
            const depositor = pending.depositor;
            const amount = pending.amount;
            const resourceAmountToEmit = Math.max(
                Math.min(amount, 1),
                0
            )
            const nodePosition = node.body.getPosition();
            const depositorPosition = getEntityPosition(depositor, nodes, bubbles, null, resources);
            const range = 30;
            const randomRotation = (2 * range) * pseudoRandom(timestamp) - range; // Random rotation between -range and range
            const dirToDepositor = depositorPosition.clone().sub(nodePosition);
            dirToDepositor.normalize()
            //console.log("dir to depositor", dirToDepositor, " random rotation", randomRotation);
            const emissionDir =  rotateVec2(dirToDepositor, randomRotation * Math.PI / 180);
            //console.log("emission dir", emissionDir);
            const emittedResource = handleEmission(
                timestamp,
                world,
                node,
                bubbles,
                resources,
                -resourceAmountToEmit,
                emissionDir,
                isSnapshot
            );
            if(depositor != "0x" && emittedResource) {
                addAttractor(attractors, { to: depositor, from: emittedResource.body.getUserData() as string });
            }
            removePendingResourceEmission(depositor, node, resourceAmountToEmit);
            
            node.emissionDirection = {
                x: emissionDir.x,
                y: emissionDir.y,
            };

            node.lastEmission = timestamp;
        })
        node.pendingEthEmission.forEach((pending) => {
            if (!node.lastEmission) node.lastEmission = timestamp;
            const lastEmission = node.lastEmission;
            if (timestamp - lastEmission < 0.1) {
                return;
            }
            const depositor = pending.depositor;
            const amount = pending.amount;
            //console.log("pending eth mass", node.pendingEthMass);

            const ethMassToEmitPer = Math.max(
                Math.min(amount, PLANCK_MASS * 10),
                0
            )
            const nodePosition = node.body.getPosition();
            const depositorPosition = getEntityPosition(depositor, nodes, bubbles, null, resources);
            const range = 30;
            const randomRotation = (2 * range) * pseudoRandom(timestamp) - range; // Random rotation between -range and range
            const dirToDepositor = depositorPosition.clone().sub(nodePosition);
            dirToDepositor.normalize()
            //console.log("dir to depositor", dirToDepositor, " random rotation", randomRotation);
            const emissionDir =  rotateVec2(dirToDepositor, randomRotation * Math.PI / 180);
            //console.log("emission dir", emissionDir);


            const emittedBubble = handleEmission(
                timestamp,
                world,
                node,
                bubbles,
                resources,
                ethMassToEmitPer,
                emissionDir,
                isSnapshot
            );
            if(depositor != "0x" && emittedBubble) {
                addAttractor(attractors, { to: depositor, from: emittedBubble.body.getUserData() as string });
            }
            else {
                //console.log("not adding attractor", depositor);
            }
            //emittedBubble.attractor = depositor;
            //}
            removePendingEthEmission(depositor, node, ethMassToEmitPer);

            node.emissionDirection = {
                x: emissionDir.x,
                y: emissionDir.y,
            };
            node.lastEmission = timestamp;
        });




        // //HANDLE INFLATION
        // const last = node.token.lastInflation;
        // const rate = node.token.inflationRate;
        // const period = node.token.inflationPeriod;
        // const mc = node.token.marketCap;

        // if(mc <= 0) return;
        // if(last === 0){
        //     node.token.lastInflation = timestamp;
        //     return;
        // }
        // if(timestamp - last < period) return;
        // const inflation = rate * (timestamp - last);
        // node.token.inflateSupply(inflation);
        // node.token.lastInflation = timestamp;
        // addPendingResourceEmission(node.owner, node, inflation);

    });
};

export const getEntity = (
    id: string,
    nodes: Map<string, ResourceNode>,
    bubbles: Map<string, Bubble>,
    portals: Map<string, Portal>,
    resources: Map<string, Resource>,
): ResourceNode | Bubble | Portal | Resource => {
    const node = nodes?.get(id);
    const bubble = bubbles?.get(id);
    const portal = portals?.get(id);
    const resource = resources?.get(id);

    if (node) return node;
    if (bubble) return bubble;
    if (portal) return portal;
    if (resource) return resource;
}


export const getEntityPosition = (
    id: string,
    nodes: Map<string, ResourceNode>,
    bubbles: Map<string, Bubble>,
    portals: Map<string, Portal>,
    resources: Map<string, Resource>,
): Vec2 => {
    const entity = getEntity(id, nodes, bubbles, portals, resources);
    if (!entity) return Vec2();

    return entity.body.getPosition();
}


export const getNearestBubbleToPosition = (
    position: Vec2,
    bubbles: Map<string, Bubble>,
    owner: string
): Bubble => {
    let nearestBubble = null;
    let nearestDistance = Infinity;
    bubbles.forEach((bubble) => {
        const distance = bubble.body.getPosition().clone().sub(position).length();
        if (bubble.owner !== owner) return;
        if (distance < nearestDistance) {
            nearestBubble = bubble;
            nearestDistance = distance;
        }
    });
    return nearestBubble;
}

export const getNearestBubbleToPositionWithMinMass = (
    position: Vec2,
    bubbles: Map<string, Bubble>,
    owner: string,
    minMass: number
): Bubble => {
    let nearestBubble = null;
    let nearestDistance = Infinity;
    bubbles.forEach((bubble) => {
        const distance = bubble.body.getPosition().clone().sub(position).length();
        if (bubble.owner !== owner || bubble.body.getMass() <= minMass) return;
        if (distance < nearestDistance) {
            nearestBubble = bubble;
            nearestDistance = distance;
        }
    });
    return nearestBubble;
}

export const capVelocity = (velocity: Vec2, maxSpeed: number): Vec2  => {
    if (velocity.length() > maxSpeed) {
        velocity.normalize();
        return velocity.mul(maxSpeed);
    }
    return velocity;
}



export const handleAttractors = (
    nodes: Map<string, ResourceNode>,
    resources: Map<string, Resource>,
    bubbles: Map<string, Bubble>,
    portals: Map<string, Portal>,
    attractors: Attractor[],
    timestamp: number,
): void => {
    const _ = attractors.filter((attractor) => {
        if(!attractor.from || !attractor.to){
            //console.log("Invalid attractor undefined", attractor);
            return false;
        }
        const to = getEntity(attractor.to, null, bubbles, null, resources);
        const from = getEntity(attractor.from, null, bubbles, null, resources);
        if(!to || !from){
            //console.log("Invalid attractor", attractor);
            return false
        };
    
        const toPos = to.body.getPosition();
        const fromPos = from.body.getPosition();
    
        const direction = toPos.clone().sub(fromPos);
        const distance = direction.length();
        direction.normalize();

        const velocity = from.body.getLinearVelocity().clone()
        //const vMagnitude = velocity.length();
        //velocity.normalize();
        //Modulus by 90 degrees in radians
        const angle = Math.abs(angleBetween(velocity, direction)) % (Math.PI / 2);
        const multiplier = Math.max(1, crossProductAngle(velocity, direction, angle) * 1);
    
        // Apply force
        const force = direction.mul(Math.min(10, 1 / (distance*distance))).mul(multiplier);
        from.body.applyForceToCenter(force);

        // Cap velocity
        const maxSpeed = 3; // Define your max speed here
        const cappedVelocity = capVelocity(from.body.getLinearVelocity(), maxSpeed);
        from.body.setLinearVelocity(cappedVelocity);
    
        return true;
    })
    attractors.length = 0;
    attractors.push(..._);

    // //Check resources attractors
    // resources.forEach((resource) => {
    //     // Return if resource has no attractor
    //     if (!resource?.attractor || resource?.attractor == "0x0000000000000000000000000000000000000001"){
    //         console.log("No attractor for resource", resource);
    //         return;
    //     }

    //     // Resource pos
    //     const pos = resource.body.getPosition();
    //     console.log("resource pos", pos);

    //     // Find nearest bubble with attractor string as owner
    //     const nearestBubble = getNearestBubbleToPosition(pos, bubbles, resource.attractor);

    //     // Get attractor position
    //     const attractorPos = nearestBubble?.body.getPosition();
    //     if (!attractorPos) {
    //         console.log("No attractor position found for resource", attractorPos);
    //         return;
    //     }

    //     // Get ejector position
    //     const ejectorPos = getEntityPosition(resource?.owner, nodes, bubbles, portals, resources);
    //     console.log("ejector pos", ejectorPos);

    //     // Check if ejector position is valid
    //     if (ejectorPos?.x == undefined) {
    //         console.log("Invalid ejector position for resource", ejectorPos);
    //         return;
    //     }

    //     // Get direction to attractor
    //     const toAttractor = attractorPos.clone().sub(pos);
    //     console.log("to attractor", toAttractor);

    //     // Get from ejector
    //     const fromEjector = pos.clone().sub(ejectorPos);
    //     console.log("from ejector", fromEjector);

    //     // Get attractor force
    //     const distance = toAttractor.length();
    //     toAttractor.normalize();

    //     // Get ejector force
    //     const distance2 = fromEjector.length();
    //     fromEjector.normalize();

    //     // Apply force
    //     const force = toAttractor.mul(1 / (distance * distance)).add(fromEjector.mul(0.001 / (distance2 * distance2)));
    //     resource.body.applyForceToCenter(force);
    //     console.log("resource force", force);
    // });


    // //Check bubbles attractors
    // bubbles.forEach((bubble) => {
    //     // Return if bubble has no attractor
    //     if (!bubble?.attractor || bubble?.attractor == "0x0000000000000000000000000000000000000001"){
    //         console.log("No attractor for bubble", bubble);
    //         return;
    //     }

    //     // Bubble pos
    //     const pos = bubble.body.getPosition();

    //     // Find nearest bubble with attractor string as owner
    //     const nearestBubble = getNearestBubbleToPosition(pos, bubbles, bubble.attractor);

    //     // Get attractor position
    //     const attractorPos = nearestBubble?.body.getPosition();
    //     if (!attractorPos) {
    //         console.log("No attractor position found for bubble", attractorPos);
    //         return;
    //     }

    //     // Get ejector position
    //     const ejectorPos = getEntityPosition(bubble?.owner, nodes, bubbles, portals, resources);
    //     console.log("ejector pos", ejectorPos);

    //     // Check if ejector position is valid
    //     if (ejectorPos?.x == undefined) {
    //         console.log("Invalid ejector position for bubble", ejectorPos);
    //         return;
    //     }

    //     // Get direction to attractor
    //     const toAttractor = attractorPos.clone().sub(pos);
    //     console.log("to attractor", toAttractor);


    //     // Get from ejector
    //     const fromEjector = pos.clone().sub(ejectorPos);
    //     console.log("from ejector", fromEjector);

    //     // Get attractor force
    //     const distance = toAttractor.length();
    //     toAttractor.normalize();

    //     // Get ejector force
    //     const distance2 = fromEjector.length();
    //     fromEjector.normalize();

    //     // Apply force
    //     const force = toAttractor.mul(1 / (distance * distance)).add(fromEjector.mul(0.001 / (distance2 * distance2)));
    //     bubble.body.applyForceToCenter(force);
    //     console.log("bubble force", force);

    // });
};



// export const resourceCollideResource = (
//   resources: Map<string, Resource>,
//   resourceA: Resource,
//   resourceB: Resource,
//   timeElapsed: number,
// ): void => {
//   //Get relative momentum between two resources
//   // const momentumA = resourceA.body.getLinearVelocity().clone().mul(resourceA.body.getMass());
//   // const momentumB = resourceB.body.getLinearVelocity().clone().mul(resourceB.body.getMass());
//   // const relativeMomentum = momentumA.clone().sub(momentumB);
//   // //If close enough then absorb
//   // const shouldAbsorb = relativeMomentum.length() < 0.1;
//   // const biggerResource = resourceA.body.getMass() > resourceB.body.getMass() ? resourceA : resourceB;
//   // const smallerResource = resourceA.body.getMass() > resourceB.body.getMass() ? resourceB : resourceA;
//   // const amountAbsorbed = Math.min(smallerResource.body.getMass(), (MASS_PER_SECOND * timeElapsed));
//   // if(shouldAbsorb){
//   //     const newSmallerResourceMass = smallerResource.body.getMass() - amountAbsorbed;
//   //     const newBiggerResourceMass = biggerResource.body.getMass() + amountAbsorbed;
//   //     updateResource(resources, smallerResource, newSmallerResourceMass);
//   //     updateResource(resources, biggerResource, newBiggerResourceMass);
//   // }else {
//   //     //Clash with eachother and destroy resource
//   //     const newSmallerResourceMass = smallerResource.body.getMass() - amountAbsorbed;
//   //     const newBiggerResourceMass = biggerResource.body.getMass() - amountAbsorbed;
//   //     updateResource(resources, smallerResource, newSmallerResourceMass);
//   //     updateResource(resources, biggerResource, newBiggerResourceMass);
//   // }
// };
