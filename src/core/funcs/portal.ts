import { World, Circle, Vec2 } from "planck-js";
import { Portal } from "../types/portal";
import { Address } from "../types/address";
import { calculateEmissionVelocity, massToRadius } from "./utils";
import {
    EMISSION_SPEED,
    MASS_PER_SECOND,
    PORTAL_SPAWN_RADIUS,
    WORLD_HEIGHT,
    WORLD_WIDTH,
} from "../consts";
import { Bubble } from "../types/bubble";
import { addUserPoints, createBubble, destroyBubble, getBubbleEthMass, getTotalBubbleMass, getTotalResourceMass, setBubbleEthMass, setBubbleResourceMass, updateBubble } from "./bubble";
import { Obstacle } from "../types/obstacle";
import { Resource, ResourceNode, ResourceType } from "../types/resource";
import { createResource, resourceMassToAmount, resourceMassToRadius, updateResource } from "./resource";
import { getItemMass } from "./entity";
import { PortalState } from "../types/state";
import { addEvent } from "./events";
import { EventsType } from "../types/events";
import { getBodyId } from "./obstacle";
import { WorldState } from "../world";
import { User } from "../types/user";

function deterministicHash(x: number, y: number): number {
    let hash = (Math.floor(x) * 0x1f1f1f1f) ^ Math.floor(y);
    hash = Math.sin(hash) * 10000;
    return hash - Math.floor(hash);
}

export function pseudoRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

export class SeededRandom {
    modulus: number;
    multiplier: number;
    increment: number;
    seed: number;

    constructor(seed: number) {
        this.modulus = 2147483648; // 2^31, a common modulus for LCGs
        this.multiplier = 1103515245; // A common multiplier
        this.increment = 12345; // A common increment
        this.seed = seed;
    }

    next() {
        this.seed = (this.multiplier * this.seed + this.increment) % this.modulus;
        return this.seed / this.modulus;
    }
}

export const generateSpawnPoint = (
    world: World,
    radius: number, // Radius of the object to be spawned
    distance: number, // Minimal distance from other objects
    lowerBounds: number, // Minimal distance from the center
    upperBounds: number, // Maximal distance from the center
    padding: number = 2, // Distance from upperBounds and lowerBounds
): Vec2 | null => {

    let found = false;
    let tries = 0;
    let size = world.getBodyCount();

    while (!found) {
        const seed = tries + size;
        const seedTheta = new SeededRandom(seed);
        const seedRadius = new SeededRandom(seed * seed);

        // Generate a random angle between 0 and 2π
        const theta = seedTheta.next() * 2 * Math.PI;
        
        // Adjust the bounds to account for the object's radius
        const minRadius = lowerBounds + padding + radius;
        const maxRadius = upperBounds - padding - radius;
        
        // Ensure the minRadius and maxRadius are valid
        if (minRadius >= maxRadius) {
            console.log("Invalid bounds: minRadius is greater than or equal to maxRadius");
            return null;
        }

        // Generate a random radius between minRadius and maxRadius
        const randomRadius = Math.sqrt(seedRadius.next() * (maxRadius * maxRadius - minRadius * minRadius) + minRadius * minRadius);
        
        // Convert polar coordinates (randomRadius, theta) to Cartesian coordinates (x, y)
        const x = randomRadius * Math.cos(theta);
        const y = randomRadius * Math.sin(theta);

        let safe = true;
        let body = world.getBodyList();
        console.log("world size", size);
        while (body) {
            const p = body.getPosition();
            const fixture = body.getFixtureList();
            if (!fixture) {
                body = body.getNext();
                continue;
            }
            if(fixture.getShape().getType() === "edge") {
                body = body.getNext();
                continue;
            }
            if(getBodyId(body) === "boundary") {
                body = body.getNext();
                continue;
            }
            const r = fixture.getShape().getRadius();
            if (Vec2.distance(Vec2(x, y), p) < r + radius + distance) {
                safe = false;
                break;
            }
            body = body.getNext();
        }

        if (safe){
            console.log("found with ", tries, " tries")
            return Vec2(x, y);
        }

        tries++;
        if(tries > 1000) {
            console.log("failed to find a spawn point after 1000 tries");
            return null;
        }
    }

    return null;
}




// export const generateSpawnPoint = (
//     world: World,
//     radius: number,
//     distance: number,
// ): Vec2 | null => {

//     let found = false;
//     let tries = 0;
//     let size = world.getBodyCount();

//     while (!found) {
//         const seed = tries + size;
//         const seedX = new SeededRandom(seed);
//         const seedY = new SeededRandom(seed * seed);
//         //Define x, random number between -WORLD_WIDTH/2 and WORLD_WIDTH/2
//         const x = seedX.next() * WORLD_WIDTH - WORLD_WIDTH/2;
//         const y = seedY.next() * WORLD_HEIGHT - WORLD_HEIGHT/2;

//         let safe = true;
//         let body = world.getBodyList();
//         console.log("world size", size);
//         while (body) {
//             const p = body.getPosition();
//             const fixture = body.getFixtureList();
//             if (!fixture) {
//                 body = body.getNext();
//                 continue;
//             }
//             const r = fixture.getShape().getRadius();
//             if (Vec2.distance(Vec2(x, y), p) < r + radius + distance) {
//                 safe = false;
//                 break;
//             }
//             body = body.getNext();
//         }

//         if (safe){
//             console.log("found with ", tries, " tries")
//             return Vec2(x, y);
//         }

//         tries++;
//         if(tries > 1000) {
//             console.log("failed to find a spawn point after 1000 tries");
//             return null;
//         }
//     }

//     return null;
// }

// export const generateSpawnPoint = (
//     timestamp: number,
//     world: { width: number, height: number },
//     portals: Map<string, Portal>,
//     bubbles: Map<string, Bubble>,
//     nodes: Map<string, ResourceNode>,
//     mass: number,
//     maxDistanceFromLastPortal: number = world.width
// ): Vec2 => {

//     const minimumSafeDistance = 10; // Minimum safe distance from other objects
//     let safeSpawnFound = false;
//     let attempt = 0;
//     let spawnPoint = new Vec2(0, 0);
//     const entityRadius = massToRadius(mass);

//     while (!safeSpawnFound) {
//         const seed = attempt + portals.size + bubbles.size + nodes.size;
//         const rngX = new SeededRandom(seed);
//         const rngY = new SeededRandom(seed * seed);
//         const x = (rngX.next() * WORLD_WIDTH - WORLD_WIDTH/2) * 0.5;
//         const y = (rngY.next() * WORLD_HEIGHT - WORLD_HEIGHT/2) * 0.5;

//        //console.log("generateSpawnPoint", x, y);

//         spawnPoint = new Vec2(x, y);

//         let isSafe = true;

//         // Check distance from portals
//         portals.forEach((portal) => {
//             const portalPosition = portal.body.getPosition();
//             const portalRadius = portal.fixture.getShape().getRadius();
//             if (Vec2.distance(spawnPoint, portalPosition) < entityRadius + portalRadius + minimumSafeDistance) {
//                 isSafe = false;
//             }
//         });

//         // // Check distance from bubbles
//         // bubbles.forEach((bubble) => {
//         //     const bubblePosition = bubble.body.getPosition();
//         //     const bubbleRadius = bubble.fixture.getShape().getRadius();
//         //     if (Vec2.distance(spawnPoint, bubblePosition) < entityRadius + bubbleRadius + minimumSafeDistance) {
//         //         isSafe = false;
//         //     }
//         // });

//         // Check distance from nodes
//         nodes.forEach((node) => {
//             const nodePosition = node.body.getPosition();
//             const nodeRadius = node.fixture.getShape().getRadius();
//             if (Vec2.distance(spawnPoint, nodePosition) < entityRadius + nodeRadius + minimumSafeDistance) {
//                 isSafe = false;
//             }
//         });

//         if (isSafe) {
//             safeSpawnFound = true;
//         } else {
//             attempt++;
//         }
//     }

//     if (!safeSpawnFound) {
//         throw new Error("Failed to find a safe spawn point after " + attempt + " attempts");
//     }

//     return spawnPoint;
// };

export const portalRemoveEth = (
    portal: Portal,
    amount: number,
): void => {
    if (amount > getPortalMass(portal)){
        console.log("Cannot remove more than the portal's mass");
        return;
    }
    const newPortalMass = portal.mass - amount;
    updatePortal(portal, newPortalMass);
}

export const destroyPortal = (
    portals: Map<string, Portal>,
    portal: Portal,
): void => {
    portals.delete(portal.owner as string);
    portal.body.getWorld().destroyBody(portal.body);
    portal = null;
}


export const createPortal = (
    portals: Map<string, Portal>,
    world: World,
    owner: Address,
    x: number,
    y: number,
    mass: number,
): Portal => {
    if (portals.size >= PORTAL_SPAWN_RADIUS){
        console.log("Cannot create more portals than the max limit");
        return;
    }
    const radius = massToRadius(mass);
    const body = world.createBody({ position: Vec2(x, y), type: "static" });
    body.setMassData({ mass, center: Vec2(0, 0), I: 0 });
    const fixture = body.createFixture({
        shape: Circle(radius),
        density: 1,
        restitution: 0,
    });
    const portal = { owner, balance: 0, body, fixture, mass };
    portal.body.setUserData(owner);
    portals.set(portal.body.getUserData() as string, portal);
    // setPortalResourceMass(portal, ResourceType.Energy, 50);
    // updatePortal(portal, mass);
    //console.log("portal created", portal.body.getUserData());
    //console.log("portal created", { owner, balance: 0, mass, x, y });

    

    return portal;
};

export const addPortalMass = (portal: Portal, mass: number): void => {
    portal.mass += mass;
};

export const removePortalMass = (portal: Portal, mass: number): void => {
    portal.mass -= mass;
};

export const updatePortal = (portal: Portal, newMass: number): void => {
    portal.mass = newMass;
    const radius = massToRadius(portal.mass);
    portal.body.destroyFixture(portal.fixture);
    portal.fixture = portal.body.createFixture({
        shape: Circle(radius),
        density: 1,
        restitution: 0,
        friction: 0,
    });
    if (!portal.resources) portal.resources = new Map();
};

export const applyPortalGrowth = (
    portal: Portal,
    timeElapsed: number,
): void => {
    const totalMassDelta = portal.mass - portal.body.getMass();
    if (totalMassDelta === 0) return;
    const shouldGrow = totalMassDelta > 0;
    const massDelta = shouldGrow
        ? Math.min(totalMassDelta, MASS_PER_SECOND * timeElapsed)
        : Math.max(totalMassDelta, -MASS_PER_SECOND * timeElapsed);
    const newMass = portal.body.getMass() + massDelta;
    updatePortal(portal, newMass);
};

export const applyPortalGravity = (portal: Portal, bubble: Bubble): void => {
    if (!portal || !bubble) return;
    // const mi = portal.mass;
    // const pi = portal.body.getPosition();
    // const mk = bubble.body.getMass();
    // const pk = bubble.body.getPosition();
    // const delta = pk.sub(pi);
    // const r = delta.length();
    // const force = GRAVITATIONAL_CONSTANT * mi * mk / (r * r);
    // delta.normalize();
    // bubble.body.applyForceToCenter(
    //     delta.mul(force).neg());
    ////console.log(force);
};

export const getPortalMass = (portal: Portal): number => {
    const totalMass = portal.mass;
    let resourceMass = 0;
    portal.resources?.forEach((resource) => {
        resourceMass += resource.mass;
    });
    portal?.inventory?.items?.forEach((item) => {
        resourceMass += getItemMass(item);
    });
    return totalMass - resourceMass;
};

export const getPortalResourceMass = (
    portal: Portal,
    resource: ResourceType,
): number => {
    const portalResource = portal.resources?.get(resource);
    return portalResource?.mass || 0;
};

export const getPortalStateResourceMass = (
    portal: PortalState,
    resource: ResourceType,
): number => {
    const portalResource = portal.resources?.find((r) => r.resource === resource);
    return portalResource?.mass || 0;
}

export const setPortalResourceMass = (
    portal: Portal,
    resource: ResourceType,
    mass: number,
): void => {
    if (!portal.resources) portal.resources = new Map();
    const portalResource = portal.resources?.get(resource);
    if (!portalResource) portal.resources?.set(resource, { resource, mass });
    else portalResource.mass = mass;
};

export const portalAbsorbBubble = (
    timestamp: number,
    bubbles: Map<string, Bubble>,
    portal: Portal,
    absorbedBubble: Bubble,
    timeElapsed: number,
): void => {
    if (!portal || !absorbedBubble) return;
    const absorbedEthMass = getBubbleEthMass(absorbedBubble);
    const absorbedTotalMass = getTotalBubbleMass(absorbedBubble);
    const newPortalEthMass = getPortalMass(portal) + absorbedEthMass; 
    const newTotalMass = portal.mass + absorbedEthMass;
    const totalAbsorbedResourceAmount = getTotalResourceMass(absorbedBubble);

    //Transfer resources to portal
    if(absorbedBubble.resources){
        absorbedBubble.resources.forEach((resource) => {
            setPortalResourceMass(
                portal,
                resource.resource,
                getPortalResourceMass(portal, resource.resource) +
                    resource.mass,
            );
        });
    }
    
    //Transfer ETH to portal
    updatePortal(portal, newTotalMass);
    destroyBubble(bubbles, absorbedBubble) 

    //Emit event
    addEvent({
        type: EventsType.AbsorbBubble,
        absorber: portal.owner,
        absorbed: absorbedBubble.owner,
        absorberEntityId: getBodyId(portal.body),
        absorbedResourceAmount: totalAbsorbedResourceAmount,
        amount: absorbedEthMass,
        isPortal: true,
        blockNumber: 0,
        timestamp,

    })
};

export const portalEmitBubble = (
    timestamp: number,
    bubbles: Map<string, Bubble>,
    portal: Portal,
    mass: number,
    direction: Vec2 = new Vec2(1, 1),
): Bubble => {
    if (mass > getPortalMass(portal)){
       //console.log("Cannot emit more than the portal's mass. Portals mass:", getPortalMass(portal), "emitting:", mass);
        return;
    }
    const portalRadius = portal.fixture.getShape().getRadius();
    const emittedBubbleRadius = massToRadius(mass);
    const centerDelta = direction
        .clone()
        .mul(portalRadius + emittedBubbleRadius);
    const emittedBubblePosition = portal.body
        .getPosition()
        .clone()
        .add(centerDelta);
    //console.log("emittedBubblePosition", emittedBubblePosition);
    const emittedBubble = createBubble(
        timestamp,
        bubbles,
        portal.body.getWorld(),
        portal.owner,
        emittedBubblePosition.x,
        emittedBubblePosition.y,
        mass,
        false,
        undefined,
        undefined,
        portal.owner
    );
    //console.log("emittedBubblePosition after create", JSON.stringify(emittedBubble.body.getPosition()));
    //console.log("123at", emittedBubble.body.getUserData());
    //console.log("123at", bubbles)
    //Apply mass conservation
    const newPortalMass = portal.mass - mass;
    updatePortal(portal, newPortalMass);

    //Apply momentum conservation
    const emittedBubbleVelocityDirection = direction.clone();
    const emittedBubbleVelocityMagnitude = calculateEmissionVelocity(newPortalMass, mass) * 0.5;
    const emittedBubbleRelativeVelocity = emittedBubbleVelocityDirection.mul(
        emittedBubbleVelocityMagnitude,
    );
    const emittedBubbleVelocity = portal.body
        .getLinearVelocity()
        .clone()
        .add(emittedBubbleRelativeVelocity);
    emittedBubble.body.setLinearVelocity(emittedBubbleVelocity);
    //console.log("emittedBubblePosition after velocity", JSON.stringify(emittedBubble.body.getPosition()));
    //setBubbleResourceMass(emittedBubble, ResourceType.ENERGY, 10);
    //console.log("bubble emitted", emittedBubble.resources);
    // setBubbleResourceMass(emittedBubble, ResourceType.GREEN, 10);
    // setBubbleResourceMass(emittedBubble, ResourceType.VIOLET, 10);

    //Emit event
    addEvent({
        type: EventsType.EmitBubble,
        userAddress: portal.owner,
        amount: mass,
        blockNumber: 0,
        timestamp,
        fromPortal: true,
        hash:"0",
        sender: portal.owner,
    })

    return emittedBubble;
};

export const portalAbsorbResource = (
    users: Map<string, User>,
    portals: Map<string, Portal>,
    resources: Map<string, Resource>,
    portal: Portal,
    absorbedResource: Resource,
    timeElapsed: number,
): void => {
    const amount = resourceMassToAmount(absorbedResource.resource, absorbedResource.body.getMass());
    const owner = portal.owner;
    addUserPoints(users, owner, amount);
    // if (!portal || !absorbedResource) return;
    // const trueResourceMass = absorbedResource.body.getMass();
    // const amountAbsorbed = resourceMassToAmount(absorbedResource.resource, trueResourceMass);
    // const newPortalMass = portal.mass;
    // //console.log("portalAbsorbBubble", amountAbsorbed, newPortalMass);
    // updatePortal(portal, newPortalMass);

    // //Add resource to portal
    // setPortalResourceMass(
    //     portal,
    //     absorbedResource.resource,
    //     getPortalResourceMass(portal, absorbedResource.resource) +
    //         amountAbsorbed,
    // );

    updateResource(resources, absorbedResource, 0);

    //Emit event
    addEvent({
        type: EventsType.AbsorbResource,
        absorber: portal.owner,
        absorberEntityId: getBodyId(portal.body),
        amount: 0,
        isPortal: true,
        blockNumber: 0,
        timestamp: 0,
    })
};

export const portalEmitResource = (
    timestamp: number,
    portals: Map<string, Portal>,
    world: World,
    resources: Map<string, Resource>,
    portal: Portal,
    resource: ResourceType,
    mass: number,
    direction: Vec2 = new Vec2(1, 1),
): Resource => {
    console.log("portalEmitResource", mass);
    if (mass > getPortalResourceMass(portal, resource)){
       //console.log("Cannot emit more than the portal's resource mass");
        return;
    }
    const portalRadius = portal.fixture.getShape().getRadius();
    const emittedResourceRadius = resourceMassToRadius(resource, mass);
    const centerDelta = direction
        .clone()
        .mul(portalRadius + emittedResourceRadius);
    const emittedResourcePosition = portal.body
        .getPosition()
        .clone()
        .add(centerDelta);
    //console.log("emittedResourcePosition", emittedResourcePosition);
    const emittedResource = createResource(
        timestamp,
        world,
        resources,
        resource,
        emittedResourcePosition.x,
        emittedResourcePosition.y,
        mass,
        portal.body.getUserData() as string,
    );
    //console.log("emittedResourcePosition after create", JSON.stringify(emittedResource.body.getPosition()));
    //console.log("123at", emittedResource.body.getUserData());
    //console.log("123at", resources)
    //Apply mass conservation
    const newPortalMass = portal.mass;
    updatePortal(portal, newPortalMass);
    setPortalResourceMass(
        portal,
        resource,
        getPortalResourceMass(portal, resource) - mass,
    );

    //Apply momentum conservation
    const emittedResourceVelocityDirection = direction.clone();
    const emittedResourceVelocityMagnitude = calculateEmissionVelocity(newPortalMass, mass);
    const emittedResourceRelativeVelocity =
        emittedResourceVelocityDirection.mul(emittedResourceVelocityMagnitude);
    const emittedResourceVelocity = portal.body
        .getLinearVelocity()
        .clone()
        .add(emittedResourceRelativeVelocity);
    emittedResource.body.setLinearVelocity(emittedResourceVelocity);
    //console.log("emittedResourcePosition after velocity", JSON.stringify(emittedResource.body.getPosition()));

    //Emit event
    addEvent({
        type: EventsType.EmitResource,
        userAddress: portal.owner,
        amount: mass,
        fromPortal: true,
        blockNumber: 0,
        timestamp,
    })

    return emittedResource;
};
