import { World, Circle, Vec2 } from "planck-js";
import { Portal } from "../types/portal";
import { Address } from "../types/address";
import { calculateEmissionVelocity, massToRadius } from "./utils";
import {
    EMISSION_SPEED,
    MASS_PER_SECOND,
    WORLD_HEIGHT,
    WORLD_WIDTH,
} from "../consts";
import { Bubble } from "../types/bubble";
import { createBubble, setBubbleResourceMass, updateBubble } from "./bubble";
import { Obstacle } from "../types/obstacle";
import { Resource, ResourceNode, ResourceType } from "../types/resource";
import { createResource, updateResource } from "./resource";

function deterministicHash(x: number, y: number): number {
    let hash = (Math.floor(x) * 0x1f1f1f1f) ^ Math.floor(y);
    hash = Math.sin(hash) * 10000;
    return hash - Math.floor(hash);
}

export function pseudoRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

export const generateSpawnPoint = (
    timestamp: number,
    world: World,
    portals: Map<string, Portal>,
    bubbles: Map<string, Bubble>,
    nodes: Map<string, ResourceNode>,
    mass: number,
    maxDistanceFromLastPortal: number = 70 // Maximum distance from the last portal
): Vec2 => {
    const minimumSafeDistance = 50; // Minimum safe distance from other objects
    let safeSpawnFound = false;
    let attempt = 0;
    let spawnPoint = new Vec2(0, 0);
    const entityRadius = massToRadius(mass);

    // Retrieve the last portal's position
    const lastPortal = Array.from(portals.values()).pop(); 
    let lastPortalPosition = new Vec2(0, 0);
    if (lastPortal) {
        lastPortalPosition = lastPortal.body.getPosition();
    }

    while (!safeSpawnFound && attempt < 1000) {
        const seed = timestamp + attempt;
        const angle = pseudoRandom(seed) * 2 * Math.PI; // Generate a random angle
        const distance = pseudoRandom(seed + 1) * maxDistanceFromLastPortal; // Generate a random distance within the max range
        const x = lastPortalPosition.x + distance * Math.cos(angle);
        const y = lastPortalPosition.y + distance * Math.sin(angle);

        spawnPoint = new Vec2(x, y);

        let isSafe = true;

        // Check distance from portals
        portals.forEach((portal) => {
            const portalRadius = portal.fixture.getShape().getRadius();
            if (Vec2.distance(spawnPoint, portal.body.getPosition()) < entityRadius + portalRadius + minimumSafeDistance) {
                isSafe = false;
            }
        });

        // Check distance from bubbles
        bubbles.forEach((bubble) => {
            const bubbleRadius = bubble.fixture.getShape().getRadius();
            if (Vec2.distance(spawnPoint, bubble.body.getPosition()) < entityRadius + bubbleRadius + minimumSafeDistance) {
                isSafe = false;
            }
        });

        // Check distance from nodes
        nodes.forEach((node) => {
            const nodeRadius = node.fixture.getShape().getRadius();
            if (Vec2.distance(spawnPoint, node.body.getPosition()) < entityRadius + nodeRadius + minimumSafeDistance) {
                isSafe = false;
            }
        });

        if (isSafe) {
            safeSpawnFound = true;
        } else {
            attempt++;
        }
    }

    if (!safeSpawnFound) {
        throw new Error("Failed to find a safe spawn point after " + attempt + " attempts");
    }

    return spawnPoint;
};

export const createPortal = (
    portals: Map<string, Portal>,
    world: World,
    owner: Address,
    x: number,
    y: number,
    mass: number,
): Portal => {
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
    return totalMass - resourceMass;
};

export const getPortalResourceMass = (
    portal: Portal,
    resource: ResourceType,
): number => {
    const portalResource = portal.resources?.get(resource);
    return portalResource?.mass || 0;
};

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
    const amountAbsorbed = Math.min(
        absorbedBubble.body.getMass(),
        MASS_PER_SECOND * timeElapsed,
    );
    const percentageAbsorbed = amountAbsorbed / absorbedBubble.body.getMass();
    const amountResourceAbsorbed =
        (absorbedBubble.resources?.get(ResourceType.Energy)?.mass ?? 0) *
        percentageAbsorbed;
    const newPortalMass = portal.mass + amountAbsorbed;
    const newPortalResourceMass =
        (portal.resources?.get(ResourceType.Energy)?.mass ?? 0) +
        amountResourceAbsorbed;
    const newBubbleMass = absorbedBubble.body.getMass() - amountAbsorbed;
    const newBubbleResourceMass =
        (absorbedBubble.resources?.get(ResourceType.Energy)?.mass ?? 0) -
        amountResourceAbsorbed;
    //console.log("portalAbsorbBubble", amountAbsorbed, newPortalMass, newBubbleMass);
    updatePortal(portal, newPortalMass);
    setPortalResourceMass(portal, ResourceType.Energy, newPortalResourceMass);
    updateBubble(
        bubbles,
        absorbedBubble,
        newBubbleMass,
        (timestamp = timestamp),
    );
    setBubbleResourceMass(
        absorbedBubble,
        ResourceType.Energy,
        newBubbleResourceMass,
    );
};

export const portalEmitBubble = (
    timestamp: number,
    bubbles: Map<string, Bubble>,
    portal: Portal,
    mass: number,
    direction: Vec2 = new Vec2(1, 1),
): Bubble => {
    if (mass > getPortalMass(portal)){
        console.log("Cannot emit more than the portal's mass");
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
    const emittedBubbleVelocityMagnitude = calculateEmissionVelocity(newPortalMass, mass) * 0.05;
    const emittedBubbleRelativeVelocity = emittedBubbleVelocityDirection.mul(
        emittedBubbleVelocityMagnitude,
    );
    const emittedBubbleVelocity = portal.body
        .getLinearVelocity()
        .clone()
        .add(emittedBubbleRelativeVelocity);
    emittedBubble.body.setLinearVelocity(emittedBubbleVelocity);
    //console.log("emittedBubblePosition after velocity", JSON.stringify(emittedBubble.body.getPosition()));

    return emittedBubble;
};

export const portalAbsorbResource = (
    portals: Map<string, Portal>,
    resources: Map<string, Resource>,
    portal: Portal,
    absorbedResource: Resource,
    timeElapsed: number,
): void => {
    if (!portal || !absorbedResource) return;
    const amountAbsorbed = Math.min(
        absorbedResource.body.getMass(),
        MASS_PER_SECOND * timeElapsed,
    );
    const newPortalMass = portal.mass + amountAbsorbed;
    const newResourceMass = absorbedResource.body.getMass() - amountAbsorbed;
    //console.log("portalAbsorbBubble", amountAbsorbed, newPortalMass);
    updatePortal(portal, newPortalMass);

    //Add resource to portal
    setPortalResourceMass(
        portal,
        absorbedResource.resource,
        getPortalResourceMass(portal, absorbedResource.resource) +
            amountAbsorbed,
    );

    updateResource(resources, absorbedResource, newResourceMass);
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
    if (mass > getPortalResourceMass(portal, resource)){
        console.log("Cannot emit more than the portal's resource mass");
        return;
    }
    const portalRadius = portal.fixture.getShape().getRadius();
    const emittedResourceRadius = massToRadius(mass);
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
    const newPortalMass = portal.mass - mass;
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

    return emittedResource;
};
