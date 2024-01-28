import { Circle, Vec2, World } from "planck-js";
import { Resource, ResourceNode, ResourceType } from "../types/resource";
import { massToRadius, radiusToMass } from "./utils";
import { ZeroAddress } from "ethers";
import { MASS_PER_SECOND, WORLD_HEIGHT, WORLD_WIDTH } from "../consts";
import { createBubble, updateBubble } from "./bubble";
import { Bubble } from "../types/bubble";

//Generates random initial starting point for resource nodes
export const generateNodes = (
    world: World,
    nodes: Map<string, ResourceNode>,
    amount: number,
): void => {
    const minDistance = 10; // minimum distance between nodes

    for (let i = 0; i < amount; i++) {
        let x, y, tooClose;

        do {
            tooClose = false;
            // Generate random positions for the node
            x = Math.random() * WORLD_WIDTH; // Assuming worldWidth is the width of your world
            y = Math.random() * WORLD_HEIGHT; // Assuming worldHeight is the height of your world

            // Check if the new node is too close to existing nodes
            nodes.forEach((existingNode) => {
                const existingX = existingNode.body.getPosition().x;
                const existingY = existingNode.body.getPosition().y;
                const distance = Math.sqrt(Math.pow(x - existingX, 2) + Math.pow(y - existingY, 2));
                if (distance < minDistance) {
                    tooClose = true;
                }
            });
        } while (tooClose);

        // Create the node at the generated position
        createNode(world, nodes, ResourceType.Energy, x, y, 0);
    }
}

export const createNode = (
    world: World,
    nodes: Map<string, ResourceNode>, 
    type: ResourceType = ResourceType.Energy,
    x: number,
    y: number,
    mass: number = 0,
): ResourceNode  => {
    //default radius of nodes equates to 1 mass
    const radius = massToRadius(1);
    const body = world.createBody({position: Vec2(x,y), type: "static"});
    const fixture = body.createFixture({shape: Circle(radius), density: 1, restitution: 0, friction: 0});
    const node: ResourceNode = { 
        resource: type, 
        mass,
        body, 
        fixture ,
        owner: ZeroAddress,
        balance: 0,
        emitted: 0,
        pendingEthMass: 0,
        pendingResourceMass: 0,
        emissionDirection: {x: 1, y: 1}
    };
    node.body.setUserData(`${nodes.size}`);
    nodes.set(node.body.getUserData() as string, node);

    return node;
}

export const createResource = (
    world: World,
    resources: Map<string, Resource>,
    type: ResourceType = ResourceType.Energy,
    x: number,
    y: number,
    mass: number,
): Resource => {
    const radius = massToRadius(mass);
    const body = world.createBody({position: Vec2(x, y), type: "dynamic", linearDamping: 0.01});
    body.setMassData({mass, center: Vec2(0, 0), I: 0});
    const fixture = body.createFixture({shape: Circle(radius), density: 1, restitution: 0, friction: 0});
    const resource: Resource = {
        resource: type,
        body,
        fixture,
        owner: ZeroAddress,
        balance: 0,
    };
    resource.body.setUserData(`${resources.size}`);
    resources.set(resource.body.getUserData() as string, resource);

    return resource;
}

export const updateNode = (
    node: ResourceNode,
    newMass: number,
    newEmitted?: number,
): void => {
    node.mass = newMass;
    if(newEmitted )node.emitted = newEmitted;
    const radius = Math.min(massToRadius(node.mass), 1)
    node.body.destroyFixture(node.fixture);
    node.fixture = node.body.createFixture({shape: Circle(radius), density: 1, restitution: 0, friction: 0});
}

export const updateResource = (
    resources: Map<string, Resource>,
    resource: Resource,
    newMass: number,
): void => {
    if(newMass <= 0) {
        console.log("destroying resource", resource);
        resources.delete(resource.body.getUserData() as string);
        resource.body.getWorld().destroyBody(resource.body);
        resource = null;
        return;
    }
    resource.body.setMassData({mass: newMass, center: Vec2(0, 0), I: 0});
    const radius = massToRadius(resource.body.getMass());
    resource.body.destroyFixture(resource.fixture);
    resource.fixture = resource.body.createFixture({shape: Circle(radius), density: 1, restitution: 0, friction: 0});
}

export const nodeEmitResource = (
    world: World,
    node: ResourceNode,
    resources: Map<string, Resource>,
    newNodeMass: number,
    emittedMass: number,
    direction: Vec2,
): Resource => {
    const radius = node.fixture.getShape().getRadius();
    const emittedResourceRadius = massToRadius(emittedMass);
    const centerDelta = direction.clone().mul(radius+emittedResourceRadius);
    const emittedResourcePosition = node.body.getPosition().clone().add(centerDelta);
    const emittedResource = createResource(world, resources, node.resource, emittedResourcePosition.x, emittedResourcePosition.y, mass);

    //Apply mass conservation
    const newResourceMass = newNodeMass;
    const newResourceEmission = node.emitted + emittedMass;
    updateNode(node, newResourceMass, newResourceEmission);

    //Apply momentum
    const emittedResourceVelocityDirection = direction.clone();
    const emittedResourceVelocityMagnitude = (node.mass / emittedResource.body.getMass())*0.1;
    const emittedResourceRelativeVelocity = emittedResourceVelocityDirection.mul(emittedResourceVelocityMagnitude);
    const emittedResourceVelocity = node.body.getLinearVelocity().clone().add(emittedResourceRelativeVelocity);
    emittedResource.body.setLinearVelocity(emittedResourceVelocity);

    return emittedResource
}

export const nodeEmitBubble = (
    world: World,
    bubbles: Map<string, Bubble>,
    node: ResourceNode,
    newNodeMass: number,
    emittedMass: number,
    direction: Vec2,
): Bubble => {
    const radius = node.fixture.getShape().getRadius();
    const emittedBubbleRadius = massToRadius(emittedMass);
    const centerDelta = direction.clone().mul(radius+emittedBubbleRadius);
    const emittedBubblePosition = node.body.getPosition().clone().add(centerDelta);
    const emittedBubble = createBubble(bubbles, world, node.owner, emittedBubblePosition.x, emittedBubblePosition.y, emittedMass, false);

    //Apply mass conservation
    const newResourceMass = newNodeMass;
    updateNode(node, newResourceMass);

    //Apply momentum
    const emittedBubbleVelocityDirection = direction.clone();
    const emittedBubbleVelocityMagnitude = (node.mass / emittedBubble.body.getMass())*0.1;
    const emittedBubbleRelativeVelocity = emittedBubbleVelocityDirection.mul(emittedBubbleVelocityMagnitude);
    const emittedBubbleVelocity = node.body.getLinearVelocity().clone().add(emittedBubbleRelativeVelocity);
    emittedBubble.body.setLinearVelocity(emittedBubbleVelocity);

    return emittedBubble
}

export const nodeAbsorbResource = (
    nodes: Map<string, ResourceNode>,
    resources: Map<string, Resource>,
    node: ResourceNode,
    absorbedResource: Resource,
    timeElapsed: number,
): void => {

    const amountAbsorbed = Math.min(absorbedResource.body.getMass(), (MASS_PER_SECOND * timeElapsed));
    const newResourceMass = absorbedResource.body.getMass() - amountAbsorbed;
    node.pendingResourceMass += amountAbsorbed;

    updateResource(resources, absorbedResource, newResourceMass);
}

export const nodeAbsorbBubble = (
    nodes: Map<string, ResourceNode>,
    bubbles: Map<string, Bubble>,
    node: ResourceNode,
    absorbedBubble: Bubble,
    timeElapsed: number,
): void => {
    const amountAbsorbed = Math.min(absorbedBubble.body.getMass(), (MASS_PER_SECOND * timeElapsed));
    const newBubbleMass = absorbedBubble.body.getMass() - amountAbsorbed;
    node.pendingEthMass += amountAbsorbed;

    updateBubble(bubbles, absorbedBubble, newBubbleMass);
}

export const getAdjustedRatio = (node: ResourceNode): number => {
    const totalEmitted = node.emitted;
    const realMass = node.mass;
    const calculatedMass = Math.pow(totalEmitted, 2)/2;

    return realMass/calculatedMass;
}


//Y = x bonding curve
//Get what should be emitted if recieved bubble mass
export const getEmission = (
    node: ResourceNode,
    mass: number
): { newMass: number, emission: number } => {
    if(mass < 0) return getBubbleEmission(node, mass);
    const prevMass = node.mass;
    const newMass = node.mass + mass;
    const emission = (Math.sqrt(newMass *2) - Math.sqrt(prevMass * 2));
    return { newMass, emission }
}

//Y = x bonding curve
//Get what should be emitted if recieved resource mass
export const getBubbleEmission = (
    node: ResourceNode,
    mass: number // resource mass recieved INFO: MAss is negative
): { newMass: number, emission: number } => {
    const currentMass = node.mass;
    const currentEmission = Math.sqrt(currentMass * 2);
    const newEmitted = currentEmission + mass;
    const newMass = Math.pow(newEmitted, 2)/2;
    
    //Calculate amount to emit if recieved resource mass
    const emission = currentMass - newMass;
    return { newMass, emission }
}

//Emit Resource or Bubble,
//Positive mass for resource, negative for bubble
export const handleEmission = (
    world: World,
    node: ResourceNode,
    bubbles: Map<string, Bubble>,
    resources: Map<string, Resource>,
    mass: number,
    direction: Vec2,
): Resource | Bubble | undefined => {
    const { newMass, emission } = getEmission(node, mass);
    if(mass > 0) 
     return nodeEmitResource(world, node, resources, newMass, emission, direction);
    if(mass < 0)
     return nodeEmitBubble(world, bubbles, node, newMass, emission, direction);
}

export const handleInflation = (
    world: World,
    node: ResourceNode,
    resources: Map<string, Resource>,
    mass: number,
    direction: Vec2,
): Resource => {
    const emittedResource = nodeEmitResource(world, node, resources, node.mass, mass, direction);

    return emittedResource;
}
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


export const handleNodeUpdates = (
    world: World,
    nodes: Map<string, ResourceNode>,
    bubbles: Map<string, Bubble>,
    resources: Map<string, Resource>,
    timeElapsed: number,
): void => {
    nodes.forEach(node => {
        //Check if resources have been injected
        //If so emit bubbles
        if(node.pendingResourceMass){
            const resourceMassToConvert = Math.min(node.pendingResourceMass, (MASS_PER_SECOND * timeElapsed));
            handleEmission(
                world,
                node,
                bubbles,
                resources,
                -resourceMassToConvert,
                Vec2(
                    node.emissionDirection.x, 
                    node.emissionDirection.y
                )
            );
            node.pendingResourceMass -= resourceMassToConvert;

            //update emission direction, change angle by 1 degree
            const angle = Math.atan2(node.emissionDirection.y, node.emissionDirection.x);
            const newAngle = angle + (Math.PI/180);
            node.emissionDirection.x = Math.cos(newAngle);
            node.emissionDirection.y = Math.sin(newAngle);
        }

        //Check if bubbles have been injected
        //If so emit resources
        if(node.pendingEthMass){
            const ethMassToConvert = Math.min(node.pendingEthMass, (MASS_PER_SECOND * timeElapsed));
            handleEmission(
                world,
                node,
                bubbles,
                resources,
                ethMassToConvert,
                Vec2(
                    node.emissionDirection.x, 
                    node.emissionDirection.y
                )
            );
            node.pendingEthMass -= ethMassToConvert;
            
            //update emission direction, change angle by 1 degree
            const angle = Math.atan2(node.emissionDirection.y, node.emissionDirection.x);
            const newAngle = angle + (Math.PI/180);
            node.emissionDirection.x = Math.cos(newAngle);
            node.emissionDirection.y = Math.sin(newAngle);
        }
    });
}

export const resourceCollideResource = (
    resources: Map<string, Resource>,
    resourceA: Resource,
    resourceB: Resource,
    timeElapsed: number,
): void => {
    //Get relative momentum between two resources
    const momentumA = resourceA.body.getLinearVelocity().clone().mul(resourceA.body.getMass());
    const momentumB = resourceB.body.getLinearVelocity().clone().mul(resourceB.body.getMass());
    const relativeMomentum = momentumA.clone().sub(momentumB);

    //If close enough then absorb
    const shouldAbsorb = relativeMomentum.length() < 0.1;
    const biggerResource = resourceA.body.getMass() > resourceB.body.getMass() ? resourceA : resourceB;
    const smallerResource = resourceA.body.getMass() > resourceB.body.getMass() ? resourceB : resourceA;
    const amountAbsorbed = Math.min(smallerResource.body.getMass(), (MASS_PER_SECOND * timeElapsed));
    if(shouldAbsorb){
        const newSmallerResourceMass = smallerResource.body.getMass() - amountAbsorbed;
        const newBiggerResourceMass = biggerResource.body.getMass() + amountAbsorbed;
        updateResource(resources, smallerResource, newSmallerResourceMass);
        updateResource(resources, biggerResource, newBiggerResourceMass);
    }else {
        //Clash with eachother and destroy resource
        const newSmallerResourceMass = smallerResource.body.getMass() - amountAbsorbed;
        const newBiggerResourceMass = biggerResource.body.getMass() - amountAbsorbed;
        updateResource(resources, smallerResource, newSmallerResourceMass);
        updateResource(resources, biggerResource, newBiggerResourceMass);
    }
}

