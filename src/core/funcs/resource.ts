import { Circle, Vec2, World } from "planck-js";
import { Resource, ResourceNode, ResourceType } from "../types/resource";
import { calculateEmissionVelocity, massToRadius } from "./utils";
import { ZeroAddress } from "ethers";
import {
    DAMPENING,
    EMISSION_SPEED,
    MASS_PER_SECOND,
    WORLD_HEIGHT,
    WORLD_WIDTH,
} from "../consts";
import { createBubble, updateBubble } from "./bubble";
import { Bubble } from "../types/bubble";
import { addEvent } from "./events";
import { EventsType } from "../types/events";
import { createNoise2D } from "simplex-noise";
import Alea from "alea";

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

    for (let y = -WORLD_WIDTH / 2; y < WORLD_WIDTH / 2; y += 100) {
        for (let x = -WORLD_HEIGHT / 2; x < WORLD_HEIGHT / 2; x += 100) {
            const value = noise(x / 100, y / 100);
            //console.log("noise value", value);
            if (value > 0.9) {
                createNode(world, nodes, ResourceType.Energy, x, y, 0);
                count++;
            }
            //if(count >= 50) return;
        }
    }

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
    type: ResourceType = ResourceType.Energy,
    x: number,
    y: number,
    mass: number = 0,
    id?: string,
    emissionDirection?: { x: number; y: number },
    lastEmission?: number,
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
        pendingEthMass: 0,
        pendingResourceMass: 0,
        emissionDirection: emissionDirection ?? { x: 1, y: 1 },
        lastEmission: lastEmission ?? 0,
    };
    node.body.setUserData(`node-${nodes.size}`);
    nodes.set(node.body.getUserData() as string, node);

    return node;
};

export const createResource = (
    timestamp: number,
    world: World,
    resources: Map<string, Resource>,
    type: ResourceType = ResourceType.Energy,
    x: number,
    y: number,
    mass: number,
    owner: string = ZeroAddress,
    id?: string,
): Resource => {
    const radius = massToRadius(mass);
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

    return resource;
};

export const updateNode = (
    node: ResourceNode,
    newMass: number,
    newEmitted?: number,
): void => {
    node.mass = newMass;
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
): void => {
    if (newMass <= 0) {
        //console.log("destroying resource", resource);
        resources.delete(resource.body.getUserData() as string);
        resource.body.getWorld().destroyBody(resource.body);
        resource = null;
        return;
    }
    resource.body.setMassData({ mass: newMass, center: Vec2(0, 0), I: 0 });
    const radius = massToRadius(resource.body.getMass());
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
    const emittedResourceRadius = massToRadius(emittedMass);
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
    );

    //Apply mass conservation
    const newResourceMass = newNodeMass;
    const newResourceEmission = node.emitted + emittedMass;
    updateNode(node, newResourceMass, newResourceEmission);

    //Apply momentum
    const emittedResourceVelocityDirection = direction.clone();
    const emittedResourceVelocityMagnitude = calculateEmissionVelocity();
    const emittedResourceRelativeVelocity =
        emittedResourceVelocityDirection.mul(emittedResourceVelocityMagnitude);
    const emittedResourceVelocity = node.body
        .getLinearVelocity()
        .clone()
        .add(emittedResourceRelativeVelocity);
    emittedResource.body.setLinearVelocity(emittedResourceVelocity);

    console.log("11emitted resource", emittedResourcePosition);
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
    const radius = massToRadius(newNodeMass) + 0.2;
    const emittedBubbleRadius = massToRadius(emittedMass);
    const centerDelta = direction.clone().mul(radius + emittedBubbleRadius);
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
        node.id,
    );

    //Apply mass conservation
    const newResourceMass = newNodeMass;
    updateNode(node, newResourceMass);

    //Apply momentum
    const emittedBubbleVelocityDirection = direction.clone();
    const emittedBubbleVelocityMagnitude = calculateEmissionVelocity()
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

export const nodeAbsorbResource = (
    nodes: Map<string, ResourceNode>,
    resources: Map<string, Resource>,
    node: ResourceNode,
    absorbedResource: Resource,
    timeElapsed: number,
): void => {
    //console.log("node absorbing resource", absorbedResource, timeElapsed, MASS_PER_SECOND)
    const amountAbsorbed = Math.min(
        absorbedResource.body.getMass(),
        MASS_PER_SECOND * timeElapsed,
    );
    const newResourceMass = absorbedResource.body.getMass() - amountAbsorbed;

    //get emission
    const { newMass, emission } = getEmission(node, -amountAbsorbed);
    node.pendingResourceMass += emission;

    updateResource(resources, absorbedResource, newResourceMass);
    updateNode(node, newMass);
};

export const nodeAbsorbBubble = (
    nodes: Map<string, ResourceNode>,
    bubbles: Map<string, Bubble>,
    node: ResourceNode,
    absorbedBubble: Bubble,
    timeElapsed: number,
): void => {
    const amountAbsorbed = Math.min(
        absorbedBubble.body.getMass(),
        MASS_PER_SECOND * timeElapsed,
    );
    const newBubbleMass = absorbedBubble.body.getMass() - amountAbsorbed;
    //get emission
    const { newMass, emission } = getEmission(node, amountAbsorbed);
    node.pendingEthMass += emission;
    //console.log("331node absorbing bubble", absorbedBubble, amountAbsorbed, newBubbleMass);

    updateBubble(bubbles, absorbedBubble, newBubbleMass);
    updateNode(node, newMass);
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
): Resource | Bubble | undefined | any => {
    console.log("handling emission", mass);
    //console.log("node", node);
    console.log("emission", mass, startDir);
    //const { newMass, emission } = getEmission(node, mass);
    const newMass = node.mass;
    const emission = Math.abs(mass);
    //console.log("emission", newMass, emission);
    if (mass > 0) {
        for (let i = 0; i < 16; i++) {
            const massToEmit = emission / 16;
            const direction = rotateVec2(startDir, (Math.PI / 8) * i);
            nodeEmitResource(
                timestamp,
                world,
                node,
                resources,
                newMass,
                massToEmit,
                direction,
            );
        }
    }
    if (mass < 0) {
        for (let i = 0; i < 16; i++) {
            const massToEmit = emission / 16;
            const direction = rotateVec2(startDir, (Math.PI / 8) * i);
            nodeEmitBubble(
                timestamp,
                world,
                bubbles,
                node,
                newMass,
                massToEmit,
                direction,
            );
        }
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
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return Vec2(
        vector.x * cos - vector.y * sin,
        vector.x * sin + vector.y * cos,
    );
}

export const handleNodeUpdates = (
    timestamp: number,
    world: World,
    nodes: Map<string, ResourceNode>,
    bubbles: Map<string, Bubble>,
    resources: Map<string, Resource>,
    timeElapsed: number,
): void => {
    timeElapsed;
    nodes.forEach((node) => {
        //Check if resources have been injected
        //If so emit bubbles
        if (!node.lastEmission) node.lastEmission = timestamp;
        const lastEmission = node.lastEmission;
        if (timestamp - lastEmission < 2) {
            return;
        }

        //console.log("handling node updates", node.id, node.pendingEthMass, node.pendingResourceMass);
        //Check if bubbles have been injected
        //If so emit resources
        if (node.pendingEthMass) {
            //console.log("pending eth mass", node.pendingEthMass);

            const ethMassToEmitPer = node.pendingEthMass;
            const emissionDir = Vec2(
                node.emissionDirection.x,
                node.emissionDirection.y,
            );

            handleEmission(
                timestamp,
                world,
                node,
                bubbles,
                resources,
                ethMassToEmitPer,
                emissionDir,
            );
            //}
            node.pendingEthMass -= ethMassToEmitPer;

            const newEmissionDir = rotateVec2(emissionDir, 1);
            node.emissionDirection = {
                x: newEmissionDir.x,
                y: newEmissionDir.y,
            };
        } else if (node.pendingResourceMass) {
            //console.log("pending resource mass", node.pendingResourceMass);
            const resourceMassToConvert = node.pendingResourceMass;
            const emissionDir = Vec2(
                node.emissionDirection.x,
                node.emissionDirection.y,
            );
            handleEmission(
                timestamp,
                world,
                node,
                bubbles,
                resources,
                -resourceMassToConvert,
                emissionDir,
            );
            node.pendingResourceMass -= resourceMassToConvert;

            const newEmissionDir = rotateVec2(emissionDir, 1);
            node.emissionDirection = {
                x: newEmissionDir.x,
                y: newEmissionDir.y,
            };
        }

        node.lastEmission = timestamp;
    });
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
