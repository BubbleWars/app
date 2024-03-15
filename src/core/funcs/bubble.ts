import { Circle, Vec2, World } from "planck-js";
import { Bubble, PuncturePoint } from "../types/bubble";
import { massToRadius } from "./utils";
import { Address } from "../types/address";
import { DAMPENING, EMISSION_SPEED, MASS_PER_SECOND } from "../consts";
import { Resource, ResourceType } from "../types/resource";
import { createResource, updateResource } from "./resource";
import { addEvent } from "./events";
import { EventsType } from "../types/events";
import { ZeroAddress } from "ethers";
import { BubbleState } from "../types/state";

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
};

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
    const bubble: Bubble = { owner, balance: 0, body, fixture, controllable };
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
    return bubble;
};

export const updateBubble = (
    bubbles: Map<string, Bubble>,
    bubble: Bubble,
    newMass: number,
    resourceAbsorbed: number = 0,
    resourceType?: Resource,
    timestamp?: number,
): void => {
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
    bubble.body.setMassData({ mass: newMass, center: Vec2(0, 0), I: 0 });
    const radius = massToRadius(bubble.body.getMass());
    bubble.body.destroyFixture(bubble.fixture);
    bubble.fixture = bubble.body.createFixture({
        shape: Circle(radius),
        density: 1,
        restitution: 0,
        friction: 0,
    });
    if (resourceType) {
        if (!bubble.resources) bubble.resources = new Map();
        if (!bubble.resources.has(resourceType.resource))
            bubble.resources.set(resourceType.resource, {
                resource: resourceType.resource,
                mass: 0,
            });
        const resource = bubble.resources.get(resourceType.resource);
        if (resource) resource.mass += resourceAbsorbed;
        //console.log("updateBubble resource", bubble.resources);
    }
};

//This emits a bubble from a bubble
export const emitBubble = (
    timestamp: number,
    bubbles: Map<string, Bubble>,
    bubble: Bubble,
    mass: number,
    direction: Vec2,
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
    const emittedBubbleVelocityDirection = direction.clone();
    const emittedBubbleVelocityMagnitude =
        (bubble.body.getMass() / emittedBubble.body.getMass()) * EMISSION_SPEED;
    const emittedBubbleRelativeVelocity = emittedBubbleVelocityDirection.mul(
        emittedBubbleVelocityMagnitude,
    );
    const emittedBubbleVelocity = bubble.body
        .getLinearVelocity()
        .clone()
        .add(emittedBubbleRelativeVelocity);
    const emittedBubbleMomentum = emittedBubbleVelocity
        .clone()
        .mul(emittedBubble.body.getMass());
    emittedBubble.body.setLinearVelocity(emittedBubbleVelocity);
    bubble.body.setLinearVelocity(
        originalBubbleMomentum
            .sub(emittedBubbleMomentum)
            .mul(1 / bubble.body.getMass()),
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

    const newBubbleMass = bubble.body.getMass() - mass;
    updateBubble(bubbles, bubble, newBubbleMass);
    setBubbleResourceMass(
        bubble,
        resourceType,
        getBubbleResourceMass(bubble, resourceType) - mass,
    );

    //Apply momentum conservation
    const originalBubbleMomentum = totalMomentum.clone();
    const emittedResourceVelocityDirection = direction.clone();
    const emittedResourceVelocityMagnitude =
        (bubble.body.getMass() / emittedResource.body.getMass()) *
        EMISSION_SPEED;
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
    // Predict future positions based on current velocities
    const futurePositionBubble = bubble.body
        .getPosition()
        .clone()
        .add(bubble.body.getLinearVelocity().clone().mul(timeElapsed));
    const futurePositionAbsorbedBubble = absorbedBubble.body
        .getPosition()
        .clone()
        .add(absorbedBubble.body.getLinearVelocity().clone().mul(timeElapsed));

    // Calculate future distance between bubble centers
    const futureDistance = futurePositionBubble
        .sub(futurePositionAbsorbedBubble)
        .length();
    const totalRadii =
        bubble.fixture.getShape().getRadius() +
        absorbedBubble.fixture.getShape().getRadius();

    // Determine the overlap if the bubbles were to continue their paths
    const potentialOverlap = totalRadii - futureDistance;

    //console.log("potentialOverlap", potentialOverlap);

    const amountAbsorbed = Math.min(
        absorbedBubble.body.getMass(),
        MASS_PER_SECOND * timeElapsed,
    );
    const percentageAbsorbed = amountAbsorbed / absorbedBubble.body.getMass();
    const amountResourceAbsorbed =
        percentageAbsorbed *
        getBubbleResourceMass(absorbedBubble, ResourceType.Energy);
    const momentumAbsorbed = absorbedBubble.body
        .getLinearVelocity()
        .clone()
        .mul(amountAbsorbed);
    const newBubbleMass = bubble.body.getMass() + amountAbsorbed;
    const newBubbleResourceMass =
        getBubbleResourceMass(bubble, ResourceType.Energy) +
        amountResourceAbsorbed;
    const newBubbleMomentum = bubble.body
        .getLinearVelocity()
        .clone()
        .mul(bubble.body.getMass())
        .add(momentumAbsorbed);
    const newAbsorbedBubbleMass =
        absorbedBubble.body.getMass() - amountAbsorbed;
    const newAbsorbedBubbleResourceMass =
        getBubbleResourceMass(absorbedBubble, ResourceType.Energy) -
        amountResourceAbsorbed;
    const newAbsorbedBubbleMomentum = absorbedBubble.body
        .getLinearVelocity()
        .clone()
        .mul(absorbedBubble.body.getMass())
        .sub(momentumAbsorbed);
    updateBubble(bubbles, bubble, newBubbleMass);
    setBubbleResourceMass(bubble, ResourceType.Energy, newBubbleResourceMass);
    updateBubble(bubbles, absorbedBubble, newAbsorbedBubbleMass);
    setBubbleResourceMass(
        absorbedBubble,
        ResourceType.Energy,
        newAbsorbedBubbleResourceMass,
    );
    //console.log("amountAbsorbed", amountAbsorbed, "newBubbleMass", newBubbleMass, "newAbsorbedBubbleMass", newAbsorbedBubbleMass);
    if (bubble.body.isDynamic())
        bubble.body.setLinearVelocity(newBubbleMomentum.mul(1 / newBubbleMass));
    absorbedBubble.body.setLinearVelocity(
        newAbsorbedBubbleMomentum.mul(1 / newAbsorbedBubbleMass),
    );
};

export const absorbResource = (
    bubbles: Map<string, Bubble>,
    resources: Map<string, Resource>,
    bubble: Bubble,
    absorbedResource: Resource,
    timeElapsed: number,
): void => {
    // Predict future positions based on current velocities
    const futurePositionBubble = bubble.body
        .getPosition()
        .clone()
        .add(bubble.body.getLinearVelocity().clone().mul(timeElapsed));
    const futurePositionAbsorbedResource = absorbedResource.body
        .getPosition()
        .clone()
        .add(
            absorbedResource.body.getLinearVelocity().clone().mul(timeElapsed),
        );

    // Calculate future distance between bubble centers
    const futureDistance = futurePositionBubble
        .sub(futurePositionAbsorbedResource)
        .length();
    const totalRadii =
        bubble.fixture.getShape().getRadius() +
        absorbedResource.fixture.getShape().getRadius();

    // Determine the overlap if the bubbles were to continue their paths
    const potentialOverlap = totalRadii - futureDistance;

    //console.log("potentialOverlap", potentialOverlap);

    const amountAbsorbed = Math.min(
        absorbedResource.body.getMass(),
        MASS_PER_SECOND * timeElapsed,
    );
    const momentumAbsorbed = absorbedResource.body
        .getLinearVelocity()
        .clone()
        .mul(amountAbsorbed);
    const newBubbleMass = bubble.body.getMass() + amountAbsorbed;
    const newBubbleMomentum = bubble.body
        .getLinearVelocity()
        .clone()
        .mul(bubble.body.getMass())
        .add(momentumAbsorbed);
    const newAbsorbedResourceMass =
        absorbedResource.body.getMass() - amountAbsorbed;
    const newAbsorbedResourceMomentum = absorbedResource.body
        .getLinearVelocity()
        .clone()
        .mul(absorbedResource.body.getMass())
        .sub(momentumAbsorbed);
    //Get the relative momentum between the bubble and the resource
    if (absorbedResource.resource == ResourceType.Energy) {
        const resourceMass = absorbedResource.body.getMass();
        const resourceVelocity = absorbedResource.body.getLinearVelocity();
        const kineticEnergy =
            resourceVelocity.clone().lengthSquared() * resourceMass;
        //the closer the relative momentum is to zero, the more the bubble is moving in the same direction as the resource
        const shouldClash = kineticEnergy > 5;
        //console.log("clash relativeMomentum", relativeMomentum.length(), shouldNotClash);
        if (shouldClash) {
            updateBubble(
                bubbles,
                bubble,
                newBubbleMass - amountAbsorbed,
                -amountAbsorbed,
                absorbedResource,
            );
            updateResource(
                resources,
                absorbedResource,
                newAbsorbedResourceMass,
            );
            //if bubble energy negative add a puncture
            const bubbleResourceMass = getBubbleResourceMass(
                bubble,
                ResourceType.Energy,
            );
            if (bubbleResourceMass)
                if (bubbleResourceMass < 0) {
                    const energyDeficit = bubbleResourceMass;
                    if (!bubble.punctures) bubble.punctures = new Map();
                    //puncture point is normalized vector from bubble to resource
                    const puncturePoint = absorbedResource.body
                        .getPosition()
                        .clone()
                        .sub(bubble.body.getPosition());
                    const puncturePointNormalized: PuncturePoint = {
                        x:
                            puncturePoint.clone().x /
                            puncturePoint.clone().length(),
                        y:
                            puncturePoint.clone().y /
                            puncturePoint.clone().length(),
                    };

                    if (!bubble.punctures.has(puncturePointNormalized)) {
                        bubble.punctures.set(puncturePointNormalized, {
                            amount: 0,
                        });
                    }
                    const puncture = bubble.punctures.get(
                        puncturePointNormalized,
                    );
                    if (puncture) puncture.amount += -energyDeficit;
                    //now set resource to zero
                    setBubbleResourceMass(bubble, ResourceType.Energy, 0);
                }
            return;
        } else {
            updateBubble(
                bubbles,
                bubble,
                newBubbleMass,
                amountAbsorbed,
                absorbedResource,
            );
            updateResource(
                resources,
                absorbedResource,
                newAbsorbedResourceMass,
            );
            if (bubble.body.isDynamic())
                bubble.body.setLinearVelocity(
                    newBubbleMomentum.mul(1 / newBubbleMass),
                );
            absorbedResource.body.setLinearVelocity(
                newAbsorbedResourceMomentum.mul(1 / newAbsorbedResourceMass),
            );
        }

        //console.log("amountAbsorbed", amountAbsorbed, "newBubbleMass", newBubbleMass, "newAbsorbedResourceMass", newAbsorbedResourceMass);
    }
};

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

        if (timeSinceLast > 1.5) {
            const amountEmitted = Math.min(
                Math.min(puncture.amount, 0.1),
                getBubbleMass(bubble),
            );
            if (amountEmitted > 0) {
                const newPunctureAmount = puncture.amount - amountEmitted;
                emitBubble(
                    timestamp,
                    bubbles,
                    bubble,
                    amountEmitted,
                    Vec2(puncturePoint.x, puncturePoint.y),
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
