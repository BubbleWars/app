import { Circle, Vec2, World } from "planck-js";
import { Bubble, PuncturePoint } from "../types/bubble";
import { calculateDeltaVelocity, calculateEjectionVelocity, calculateEmissionVelocity, massToRadius } from "./utils";
import { Address } from "../types/address";
import { CLASH_KE, DAMPENING, EMISSION_SPEED, MASS_PER_SECOND } from "../consts";
import { Resource, ResourceType } from "../types/resource";
import { createResource, rotateVec2, updateResource } from "./resource";
import { addEvent } from "./events";
import { EventsType } from "../types/events";
import { ZeroAddress } from "ethers";
import { BubbleState } from "../types/state";
import { pseudoRandom } from "./portal";
import { bubbles } from "../world";

//const PUNCTURE_EMIT_PER_SECOND = 100;

export const generateBubbleId = (
    bubbles: Map<string, Bubble>,
    owner: Address,
): string => {
    //loop through all the bubbles owned by the owner and return the next available id by getting the highest number "bubble-<number>"
    let max = 0;
    bubbles.forEach((value: Bubble, key: string) => {
        if (value.owner == owner) {
            const split = key.split("-");
            const number = parseInt(split[split.length - 1]);
            if (number > max) max = number;
        }
    });

    return `${owner.toLowerCase()}-${max + 1}`;
};

export const getBubbleMass = (bubble: Bubble): number => {
    const totalMass = bubble.body.getMass();
    if (!bubble.resources) return totalMass;
    let resourceMass = 0;
    bubble.resources.forEach((resource) => {
        resourceMass += resource.mass;
    });
    return totalMass - resourceMass;
};

export const getBubbleResourceMass = (
    bubble: Bubble,
    resource: ResourceType,
): number => {
    if (!bubble.resources) return 0;
    if (!bubble.resources.has(resource)) return 0;
    const bubbleResource = bubble.resources?.get(resource);
    return bubbleResource?.mass || 0;
};

export const setBubbleResourceMass = (
    bubble: Bubble,
    resource: ResourceType,
    mass: number,
): void => {
    //console.log("404::setBubbleResourceMass", bubble.resources, resource, mass)
    if (!bubble.resources) bubble.resources = new Map();
    const bubbleResource = bubble.resources?.get(resource);
    if (!bubbleResource) bubble.resources.set(resource, { resource, mass });
    bubble.resources.set(resource, { resource, mass });
    updateBubble(bubbles, bubble, getBubbleMass(bubble));
};

export const addBubbleResourceMass = (
    bubble: Bubble,
    resource: ResourceType,
    mass: number,
): void => {
    const currentMass = getBubbleResourceMass(bubble, resource);
    setBubbleResourceMass(bubble, resource, currentMass + mass);
}


export const createBubble = (
    timestamp: number,
    bubbles: Map<string, Bubble>,
    world: World,
    owner: Address,
    x: number,
    y: number,
    mass: number,
    controllable: boolean,
    id?: string,
    bubbleState?: BubbleState,
    from?: string
): Bubble => {
    const radius = massToRadius(mass);
    if (owner == ZeroAddress)
        throw new Error("Cannot create bubble with zero address");
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
    const bubble: Bubble = { owner, balance: 0, body, fixture, controllable, from: from ?? "" };
    //set id
    if (id) bubble.body.setUserData(id);
    else bubble.body.setUserData(generateBubbleId(bubbles, owner));
    bubbles.set(bubble.body.getUserData() as string, bubble);
    //    //console.log('new event creating bubble', {
    //         owner,
    //         balance: 0,
    //         position: {x, y},
    //         controllable,
    //     })

    if (bubbleState) {
        bubble.lastPunctureEmit = bubbleState.lastPunctureEmit;

        if (!bubble.punctures) bubble.punctures = new Map();
        bubbleState.punctures.forEach(({ point, puncture }) => {
            bubble.punctures?.set(point, puncture);
        });
    }

    addEvent({
        type: EventsType.CreateBubble,
        id: bubble.body.getUserData() as string,
        timestamp,
        position: { x, y },
    });
    //console.log("bubble created", bubble.body.getUserData() as string)
    return bubble;
};

export const updateBubble = (
    bubbles: Map<string, Bubble>,
    bubble: Bubble,
    newMass: number,
    timestamp?: number,
): void => {

    //Check if should DESTROY bubble
    if (newMass <= 0) {
        addEvent({
            type: EventsType.DestroyBubble,
            id: bubble.body.getUserData() as string,
            timestamp: timestamp ?? 0,
            position: {
                x: bubble.body.getPosition().x,
                y: bubble.body.getPosition().y,
            },
        });
        bubbles.delete(bubble.body.getUserData() as string);
        bubble.body.getWorld().destroyBody(bubble.body);
        bubble = null as any;
        return;
    }

    //Set bubble MASS
    bubble.body.setMassData({ mass: newMass, center: Vec2(0, 0), I: 0 });

    //Set bubble RADIUS
    const radius = massToRadius(bubble.body.getMass());
    bubble.body.destroyFixture(bubble.fixture);
    bubble.fixture = bubble.body.createFixture({
        shape: Circle(radius),
        density: 1,
        restitution: 0,
        friction: 0,
    });
};

//This emits a bubble from a bubble
export const emitBubble = (
    timestamp: number,
    bubbles: Map<string, Bubble>,
    bubble: Bubble,
    mass: number,
    direction: Vec2,
    emissionDirection?: Vec2,
): Bubble => {
    //if(!bubble.controllable) throw new Error("Cannot emit from a non-controllable bubble");
    if (mass > bubble.body.getMass()){
        console.log("Cannot emit more than of the bubble's mass");
        return;
    }
    //console.log("emitting bubble", mass, bubble.body.getMass() );
    const radius = bubble.fixture.getShape().getRadius();
    const emittedBubbleRadius = massToRadius(mass);
    const centerDelta = direction.clone().mul(radius + emittedBubbleRadius);
    const emittedBubblePosition = bubble.body
        .getPosition()
        .clone()
        .add(centerDelta);
    const emittedBubble = createBubble(
        timestamp,
        bubbles,
        bubble.body.getWorld(),
        bubble.owner,
        emittedBubblePosition.x,
        emittedBubblePosition.y,
        mass,
        false,
        undefined,
        undefined,
        bubble.body.getUserData() as string,
    );
    const totalMomentum = bubble.body
        .getLinearVelocity()
        .clone()
        .mul(bubble.body.getMass());

    //console.log("emittedBubble", emittedBubble);
    //Apply mass conservation
    const newBubbleMass = bubble.body.getMass() - mass;
    updateBubble(bubbles, bubble, newBubbleMass);

    //Apply momentum conservation
    const originalBubbleMomentum = totalMomentum.clone();
    //const emittedBubbleVelocityDirection = emissionDirection ? emissionDirection.clone() : direction.clone();
    //const emittedBubbleVelocityMagnitude = calculateEmissionVelocity(newBubbleMass, mass);
    const emittedBubbleRelativeVelocity = calculateEjectionVelocity(direction);
    const emittedBubbleVelocity = bubble.body
        .getLinearVelocity()
        .clone()
        .add(emittedBubbleRelativeVelocity);
    const emittedBubbleMomentum = emittedBubbleVelocity
        .clone()
        .mul(emittedBubble.body.getMass());
    emittedBubble.body.setLinearVelocity(emittedBubbleVelocity);
    const m = bubble.body.getMass();
    const me = emittedBubble.body.getMass();
    const deltaVelocity = calculateDeltaVelocity(emittedBubbleRelativeVelocity, m, me);
    bubble.body.setLinearVelocity(
        bubble.body.getLinearVelocity().clone().add(deltaVelocity),
    );

    return emittedBubble;
};

export const emitResource = (
    timestamp: number,
    world: World,
    bubbles: Map<string, Bubble>,
    resources: Map<string, Resource>,
    bubble: Bubble,
    resourceType: ResourceType,
    mass: number,
    direction: Vec2,
): Resource => {
    if (mass > getBubbleResourceMass(bubble, resourceType)){
        console.log("Cannot emit more than the bubble's resource mass");
        return;
    }
    //console.log("emitting resource", resourceType, mass, getBubbleResourceMass(bubble, resourceType));
    const radius = bubble.fixture.getShape().getRadius();
    const emittedResourceRadius = massToRadius(mass);
    const centerDelta = direction.clone().mul(radius + emittedResourceRadius);
    const emittedResourcePosition = bubble.body
        .getPosition()
        .clone()
        .add(centerDelta);
    const emittedResource = createResource(
        timestamp,
        world,
        resources,
        resourceType,
        emittedResourcePosition.x,
        emittedResourcePosition.y,
        mass,
        bubble.body.getUserData() as string,
    );
    const totalMomentum = bubble.body
        .getLinearVelocity()
        .clone()
        .mul(bubble.body.getMass());

    setBubbleResourceMass(
        bubble,
        resourceType,
        getBubbleResourceMass(bubble, resourceType) - mass,
    );

    const newBubbleMass = getBubbleMass(bubble);
    updateBubble(bubbles, bubble, newBubbleMass);

    //Apply momentum conservation
    const originalBubbleMomentum = totalMomentum.clone();
    const emittedResourceVelocityDirection = direction.clone()
    const emittedResourceVelocityMagnitude = calculateEmissionVelocity(newBubbleMass, mass);
    const emittedResourceRelativeVelocity =
        emittedResourceVelocityDirection.mul(emittedResourceVelocityMagnitude);
    const emittedResourceVelocity = bubble.body
        .getLinearVelocity()
        .clone()
        .add(emittedResourceRelativeVelocity);
    const emittedResourceMomentum = emittedResourceVelocity
        .clone()
        .mul(emittedResource.body.getMass());
    emittedResource.body.setLinearVelocity(emittedResourceVelocity);
    bubble.body.setLinearVelocity(
        originalBubbleMomentum
            .sub(emittedResourceMomentum)
            .mul(1 / bubble.body.getMass()),
    );

    
    return emittedResource;
};

export const absorbBubble = (
    bubbles: Map<string, Bubble>,
    bubble: Bubble,
    absorbedBubble: Bubble,
    timeElapsed: number,
): void => {
    const absorbedMass = getBubbleMass(absorbedBubble);
    const newBubbleMass = getBubbleMass(bubble) + absorbedMass;

    //Transfer resources to bubble
    if (absorbedBubble.resources) {
        absorbedBubble.resources.forEach((resource) => {
            addBubbleResourceMass(bubble, resource.resource, resource.mass);
        });
    }

    //Update bubble
    updateBubble(bubbles, bubble, newBubbleMass);

    //Destory absorbed bubble
    updateBubble(bubbles, absorbedBubble, 0);

    //Transfer momentum to bubble
    if (bubble.body.isDynamic()){
        const momentumAbsorbed = absorbedBubble.body.getLinearVelocity().clone().mul(absorbedMass);
        const newBubbleMomentum = bubble.body.getLinearVelocity().clone().mul(bubble.body.getMass()).add(momentumAbsorbed);
        bubble.body.setLinearVelocity(newBubbleMomentum.mul(1 / newBubbleMass));
    }
};


export const transferResourceToBubble = (
    bubbles: Map<string, Bubble>,
    resources: Map<string, Resource>,
    bubble: Bubble,
    absorbedResource: Resource,
) => {
    const amount = absorbedResource.body.getMass();
    const type = absorbedResource.resource;

    const prev = getBubbleResourceMass(bubble, type);
    const now = prev + amount;
    setBubbleResourceMass(bubble, type, now);
    updateResource(resources, absorbedResource, 0);
}

export const addPuncturePoint = (
    bubble: Bubble,
    puncturePoint: PuncturePoint,
    amount: number,
) => {
    if (!bubble.punctures) bubble.punctures = new Map();
    if (!bubble.punctures.has(puncturePoint)) {
        bubble.punctures.set(puncturePoint, { amount });
    } else {
        const puncture = bubble.punctures.get(puncturePoint);
        if (puncture) puncture.amount += amount;
    }
}

export const subtractPuncturePoint = (
    bubble: Bubble,
    puncturePoint: PuncturePoint,
    amount: number,
) => {
    if (!bubble.punctures) return;
    if (!bubble.punctures.has(puncturePoint)) return;
    const puncture = bubble.punctures.get(puncturePoint);
    if (puncture) puncture.amount -= amount;
}



export const isResourceActivated = (resource: Resource) => {
    const v = resource.body.getLinearVelocity().clone().length();
    const ke = 0.5 * resource.body.getMass() * v * v;
    return ke > CLASH_KE;
}


export const absorbResource = (
    bubbles: Map<string, Bubble>,
    resources: Map<string, Resource>,
    bubble: Bubble,
    absorbedResource: Resource,
    timeElapsed: number,
): void => {
    //Transfer resource to bubble
    const resourceType = absorbedResource.resource;
    switch (resourceType) {
        case ResourceType.BLUE:
            //Transfer BLUE to bubble
            transferResourceToBubble(bubbles, resources, bubble, absorbedResource);
            break;
    
        case ResourceType.RED:
            //Check kinetic energy for PUNCTURE
            if(isResourceActivated(absorbedResource)){
                punctureBubble(bubbles, resources, bubble, absorbedResource);
                break;
            }
            //Transfer RED to bubble
            transferResourceToBubble(bubbles, resources, bubble, absorbedResource);
            break;
        
        case ResourceType.GREEN:
            transferResourceToBubble(bubbles, resources, bubble, absorbedResource);
            break;
        
        case ResourceType.VIOLET:
            transferResourceToBubble(bubbles, resources, bubble, absorbedResource);
            break;
    }

    //Transfer momentum to bubble
    if (bubble.body.isDynamic()){
        const resourceMomentum = absorbedResource.body.getLinearVelocity().clone().mul(absorbedResource.body.getMass());
        const totalMomentum = bubble.body.getLinearVelocity().clone().mul(bubble.body.getMass());
        const newBubbleMomentum = totalMomentum.add(resourceMomentum);
        bubble.body.setLinearVelocity(newBubbleMomentum.mul(1 / bubble.body.getMass()));
    }   
};

export const punctureBubble = (
    bubbles: Map<string, Bubble>,
    resources: Map<string, Resource>,
    bubble: Bubble,
    incoming: Resource,
): void => {
    //Make sure the incoming resource is RED
    if(incoming.resource != ResourceType.RED) return;

    //Get the defense and attack values
    const defense = getBubbleResourceMass(bubble, ResourceType.BLUE);
    const attack = incoming.body.getMass();

    //Calculate the damage
    const remaining = defense - attack;
    if(remaining >= 0){
        //Transfer the remaining defense to the bubble and destroy the incoming resource
        setBubbleResourceMass(bubble, ResourceType.BLUE, remaining);
    } else {
        //Puncture the bubble
        const puncturePoint = incoming.body
            .getPosition().clone()
            .sub(bubble.body.getPosition())
        puncturePoint.normalize();
        addPuncturePoint(bubble, {x: puncturePoint.x, y:puncturePoint.y}, attack - defense);
    }

    //Destroy the incoming resource
    updateResource(resources, incoming, 0);        
}

export const handlePunctures = (
    timestamp: number,
    bubbles: Map<string, Bubble>,
    bubble: Bubble,
    timeElapsed: number,
): void => {
    if (!bubble.punctures) return;
    bubble.punctures.forEach((puncture, puncturePoint) => {
        if (!bubble.lastPunctureEmit) bubble.lastPunctureEmit = timestamp;

        const timeSinceLast = timestamp - bubble.lastPunctureEmit;

        if (timeSinceLast > 0.5) {
            const amountEmitted = Math.min(
                Math.min(puncture.amount, 0.1),
                getBubbleMass(bubble),
            );
            //Create puncture direction vector as random direction within 40 degrees of puncture vector
            const randomAngle = pseudoRandom(timestamp) * 70 - 35;
            const puncturePointVec = Vec2(puncturePoint.x, puncturePoint.y);
            const emissionDirection = rotateVec2(puncturePointVec, randomAngle);

            if (amountEmitted > 0) {
                const newPunctureAmount = puncture.amount - amountEmitted;
                emitBubble(
                    timestamp,
                    bubbles,
                    bubble,
                    amountEmitted,
                    puncturePointVec,
                    emissionDirection
                );
                puncture.amount = newPunctureAmount;
                if (newPunctureAmount <= 0)
                    bubble?.punctures?.delete(puncturePoint);
                bubble.lastPunctureEmit = timestamp;
            }
        }
    });
};

export const handleBubbleUpdates = (
    timestamp: number,
    bubbles: Map<string, Bubble>,
    timeElapsed: number,
): void => {
    bubbles.forEach((bubble) => {
        handlePunctures(timestamp, bubbles, bubble, timeElapsed);
    });
};
