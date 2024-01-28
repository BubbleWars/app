import { Circle, Vec2, World } from "planck-js";
import { Bubble, PuncturePoint } from "../types/bubble";
import { massToRadius, radiusToMass } from "./utils";
import { Address } from "../types/address";
import { MASS_PER_SECOND } from "../consts";
import { Resource, ResourceType } from "../types/resource";
import { createResource, updateResource } from "./resource";
import { bubbles } from "../world";

const PUNCTURE_EMIT_PER_SECOND = 0.1;

export const generateBubbleId = (bubbles: Map<string, Bubble>, owner: Address): string => {
    return `${owner.toLowerCase()}-${bubbles.size}`;
}

export const getBubbleMass = (bubble: Bubble): number => {
    const totalMass = bubble.body.getMass();
    if(!bubble.resources) return totalMass;
    let resourceMass = 0;
    bubble.resources.forEach(resource => {
        resourceMass += resource.mass;
    })
    return totalMass - resourceMass;
}

export const getBubbleResourceMass = (bubble: Bubble, resource: ResourceType): number => {
    if(!bubble.resources) return 0;
    if(!bubble.resources.has(resource)) return 0;
    const bubbleResource = bubble.resources?.get(resource);
    return bubbleResource?.mass || 0;
}

export const createBubble = (bubbles: Map<string, Bubble>, world: World, owner: Address, x: number, y: number, mass: number, controllable: boolean): Bubble => {
    const radius = massToRadius(mass);
    const body = world.createBody({position: Vec2(x, y), type: "dynamic", linearDamping: 0.01});
    body.setMassData({mass, center: Vec2(0, 0), I: 0});
    const fixture = body.createFixture({ shape: Circle(radius), density: 1, restitution: 0, friction: 0});
    const bubble = { owner, balance: 0, body, fixture, controllable };
    bubble.body.setUserData(generateBubbleId(bubbles, owner));
    bubbles.set(bubble.body.getUserData() as string, bubble);
    return bubble;
}

export const updateBubble = (
    bubbles: Map<string, Bubble>, 
    bubble: Bubble, 
    newMass: number,
    resourceAbsorbed: number = 0,
    resourceType?: Resource,
    ): void => {
    if(newMass <= 0) {
        console.log("destroying bubble", bubble);
        bubbles.delete(bubble.body.getUserData() as string);
        bubble.body.getWorld().destroyBody(bubble.body);
        bubble = null;
        return;
    } 
    bubble.body.setMassData({mass: newMass, center: Vec2(0, 0), I: 0});
    const radius = massToRadius(bubble.body.getMass());
    bubble.body.destroyFixture(bubble.fixture);
    bubble.fixture = bubble.body.createFixture({ shape: Circle(radius), density: 1, restitution: 0, friction: 0});
    console.log("new radius", bubble.fixture);
    if(resourceType) {
        if(!bubble.resources) bubble.resources = new Map();
        if(!bubble.resources.has(resourceType.resource)) bubble.resources.set(resourceType.resource, { resource: resourceType.resource, mass: 0 }); 
        const resource = bubble.resources.get(resourceType.resource);
        resource.mass += resourceAbsorbed;
    }

}

//This emits a bubble from a bubble
export const emitBubble = (bubbles: Map<string, Bubble>, bubble: Bubble, mass: number, direction: Vec2): Bubble => {
    //if(!bubble.controllable) throw new Error("Cannot emit from a non-controllable bubble");
    if(mass > bubble.body.getMass()/2) throw new Error("Cannot emit more than half of the bubble's mass");
    const radius = bubble.fixture.getShape().getRadius();
    const emittedBubbleRadius = massToRadius(mass);
    const centerDelta = direction.clone().mul(radius+emittedBubbleRadius);
    const emittedBubblePosition = bubble.body.getPosition().clone().add(centerDelta);
    const emittedBubble = createBubble(bubbles, bubble.body.getWorld(), bubble.owner, emittedBubblePosition.x, emittedBubblePosition.y, mass, false);
    const totalMomentum = bubble.body.getLinearVelocity().clone().mul(bubble.body.getMass());

    //console.log("emittedBubble", emittedBubble);
    //Apply mass conservation
    const newBubbleMass = bubble.body.getMass() - mass;
    updateBubble(bubbles, bubble, newBubbleMass);

    //Apply momentum conservation
    const originalBubbleMomentum = totalMomentum.clone();
    const emittedBubbleVelocityDirection = direction.clone();
    const emittedBubbleVelocityMagnitude = (bubble.body.getMass() / emittedBubble.body.getMass())*0.1;
    const emittedBubbleRelativeVelocity = emittedBubbleVelocityDirection.mul(emittedBubbleVelocityMagnitude);
    const emittedBubbleVelocity = bubble.body.getLinearVelocity().clone().add(emittedBubbleRelativeVelocity);
    const emittedBubbleMomentum = emittedBubbleVelocity.clone().mul(emittedBubble.body.getMass());
    emittedBubble.body.setLinearVelocity(emittedBubbleVelocity);
    bubble.body.setLinearVelocity(originalBubbleMomentum.sub(emittedBubbleMomentum).mul(1 / bubble.body.getMass()));

    return emittedBubble;
}

export const emitResource = (
    world: World,
    bubbles: Map<string, Bubble>,
    resources: Map<string, Resource>,
    bubble: Bubble,
    resourceType: ResourceType,
    mass: number,
    direction: Vec2,
): Resource => {
    if(mass > getBubbleResourceMass(bubble, resourceType)) throw new Error("Cannot emit more than the bubble's resource mass");
    const radius = bubble.fixture.getShape().getRadius();
    const emittedResourceRadius = massToRadius(mass);
    const centerDelta = direction.clone().mul(radius+emittedResourceRadius);
    const emittedResourcePosition = bubble.body.getPosition().clone().add(centerDelta);
    const emittedResource = createResource(world, resources, resourceType, emittedResourcePosition.x, emittedResourcePosition.y, mass);
    const totalMomentum = bubble.body.getLinearVelocity().clone().mul(bubble.body.getMass());

    const newBubbleMass = bubble.body.getMass() - mass;
    updateBubble(bubbles, bubble, newBubbleMass);
    bubble.resources.get(resourceType).mass -= mass;

    //Apply momentum conservation
    const originalBubbleMomentum = totalMomentum.clone();
    const emittedResourceVelocityDirection = direction.clone();
    const emittedResourceVelocityMagnitude = (bubble.body.getMass() / emittedResource.body.getMass())*0.1;
    const emittedResourceRelativeVelocity = emittedResourceVelocityDirection.mul(emittedResourceVelocityMagnitude);
    const emittedResourceVelocity = bubble.body.getLinearVelocity().clone().add(emittedResourceRelativeVelocity);
    const emittedResourceMomentum = emittedResourceVelocity.clone().mul(emittedResource.body.getMass());
    emittedResource.body.setLinearVelocity(emittedResourceVelocity);
    bubble.body.setLinearVelocity(originalBubbleMomentum.sub(emittedResourceMomentum).mul(1 / bubble.body.getMass()));

    return emittedResource;
}

export const absorbBubble = (bubbles: Map<string, Bubble>, bubble: Bubble, absorbedBubble: Bubble, timeElapsed: number): void => {
    // Predict future positions based on current velocities
    const futurePositionBubble = bubble.body.getPosition().clone().add(bubble.body.getLinearVelocity().clone().mul(timeElapsed));
    const futurePositionAbsorbedBubble = absorbedBubble.body.getPosition().clone().add(absorbedBubble.body.getLinearVelocity().clone().mul(timeElapsed));

    // Calculate future distance between bubble centers
    const futureDistance = futurePositionBubble.sub(futurePositionAbsorbedBubble).length();
    const totalRadii = bubble.fixture.getShape().getRadius() + absorbedBubble.fixture.getShape().getRadius();

    // Determine the overlap if the bubbles were to continue their paths
    const potentialOverlap = totalRadii - futureDistance;
    const addedAmountAbsorbed = radiusToMass(potentialOverlap);

    //console.log("potentialOverlap", potentialOverlap);
    
    const amountAbsorbed = Math.min(absorbedBubble.body.getMass(), (MASS_PER_SECOND * timeElapsed));
    const percentageAbsorbed = amountAbsorbed / absorbedBubble.body.getMass();
    const amountResourceAbsorbed = percentageAbsorbed * getBubbleResourceMass(absorbedBubble, ResourceType.Energy);
    const momentumAbsorbed = absorbedBubble.body.getLinearVelocity().clone().mul(amountAbsorbed);
    const newBubbleMass = bubble.body.getMass() + amountAbsorbed;
    const newBubbleResourceMass = getBubbleResourceMass(bubble, ResourceType.Energy) + amountResourceAbsorbed;
    const newBubbleMomentum = bubble.body.getLinearVelocity().clone().mul(bubble.body.getMass()).add(momentumAbsorbed);
    const newAbsorbedBubbleMass = absorbedBubble.body.getMass() - amountAbsorbed;
    const newAbsorbedBubbleResourceMass = getBubbleResourceMass(absorbedBubble, ResourceType.Energy) - amountResourceAbsorbed;
    const newAbsorbedBubbleMomentum = absorbedBubble.body.getLinearVelocity().clone().mul(absorbedBubble.body.getMass()).sub(momentumAbsorbed);
    updateBubble(bubbles, bubble, newBubbleMass);
    bubble.resources.get(ResourceType.Energy).mass = newBubbleResourceMass;
    updateBubble(bubbles, absorbedBubble, newAbsorbedBubbleMass);
    absorbedBubble.resources.get(ResourceType.Energy).mass = newAbsorbedBubbleResourceMass;
    //console.log("amountAbsorbed", amountAbsorbed, "newBubbleMass", newBubbleMass, "newAbsorbedBubbleMass", newAbsorbedBubbleMass);
    if(bubble.body.isDynamic())
        bubble.body.setLinearVelocity(newBubbleMomentum.mul(1 / newBubbleMass));
    absorbedBubble.body.setLinearVelocity(newAbsorbedBubbleMomentum.mul(1 / newAbsorbedBubbleMass));
}

export const absorbResource = (bubbles: Map<string, Bubble>, resources: Map<string, Resource>, bubble: Bubble, absorbedResource: Resource, timeElapsed: number): void => {
    // Predict future positions based on current velocities
    const futurePositionBubble = bubble.body.getPosition().clone().add(bubble.body.getLinearVelocity().clone().mul(timeElapsed));
    const futurePositionAbsorbedResource = absorbedResource.body.getPosition().clone().add(absorbedResource.body.getLinearVelocity().clone().mul(timeElapsed));

    // Calculate future distance between bubble centers
    const futureDistance = futurePositionBubble.sub(futurePositionAbsorbedResource).length();
    const totalRadii = bubble.fixture.getShape().getRadius() + absorbedResource.fixture.getShape().getRadius();

    // Determine the overlap if the bubbles were to continue their paths
    const potentialOverlap = totalRadii - futureDistance;
    const addedAmountAbsorbed = radiusToMass(potentialOverlap);

    //console.log("potentialOverlap", potentialOverlap);
    
    const amountAbsorbed = Math.min(absorbedResource.body.getMass(), (MASS_PER_SECOND * timeElapsed));
    const momentumAbsorbed = absorbedResource.body.getLinearVelocity().clone().mul(amountAbsorbed);
    const newBubbleMass = bubble.body.getMass() + amountAbsorbed;
    const newBubbleMomentum = bubble.body.getLinearVelocity().clone().mul(bubble.body.getMass()).add(momentumAbsorbed);
    const newAbsorbedResourceMass = absorbedResource.body.getMass() - amountAbsorbed;
    const newAbsorbedResourceMomentum = absorbedResource.body.getLinearVelocity().clone().mul(absorbedResource.body.getMass()).sub(momentumAbsorbed);
    //Get the relative momentum between the bubble and the resource
    if(absorbedResource.resource == ResourceType.Energy){
        const absorbedResourceMomentum = absorbedResource.body.getLinearVelocity().clone().mul(absorbedResource.body.getMass());
        const bubbleMomentum = bubble.body.getLinearVelocity().clone().mul(bubble.body.getMass());
        const relativeMomentum = absorbedResourceMomentum.sub(bubbleMomentum);
        //the closer the relative momentum is to zero, the more the bubble is moving in the same direction as the resource
        const shouldNotClash = relativeMomentum.length() < 0.1;
        if(!shouldNotClash){
            updateBubble(bubbles, bubble, newBubbleMass-amountAbsorbed, -amountAbsorbed, absorbedResource);
            updateResource(resources, absorbedResource, newAbsorbedResourceMass);
            //if bubble energy negative add a puncture
            if(bubble.resources?.has(ResourceType.Energy))
            if(bubble.resources?.get(ResourceType.Energy).mass < 0){
                const energyDeficit = bubble.resources?.get(ResourceType.Energy).mass;
                if(!bubble.punctures) bubble.punctures = new Map();
                //puncture point is normalized vector from bubble to resource
                const puncturePoint = absorbedResource.body.getPosition().clone().sub(bubble.body.getPosition());
                const puncturePointNormalized: PuncturePoint = {
                    x: puncturePoint.clone().x / puncturePoint.clone().length(),
                    y: puncturePoint.clone().y / puncturePoint.clone().length(),
                }

                if(!bubble.punctures.has(puncturePointNormalized)){
                    bubble.punctures.set(puncturePointNormalized, {amount: 0});
                }
                bubble.punctures.get(puncturePointNormalized).amount += -energyDeficit;
                //now set resource to zero
                bubble.resources.get(ResourceType.Energy).mass = 0; 
            }
            return;
        } else {
            updateBubble(bubbles, bubble, newBubbleMass, amountAbsorbed, absorbedResource);
            updateResource(resources, absorbedResource, newAbsorbedResourceMass);
        }
    }
        //console.log("amountAbsorbed", amountAbsorbed, "newBubbleMass", newBubbleMass, "newAbsorbedResourceMass", newAbsorbedResourceMass);
    if(bubble.body.isDynamic())
        bubble.body.setLinearVelocity(newBubbleMomentum.mul(1 / newBubbleMass));
    absorbedResource.body.setLinearVelocity(newAbsorbedResourceMomentum.mul(1 / newAbsorbedResourceMass));
}

export const handlePunctures = (
    bubbles: Map<string, Bubble>, 
    bubble: Bubble, 
    timeElapsed: number
): void => {
    if(!bubble.punctures) return;
    bubble.punctures.forEach((puncture, puncturePoint) => {
        const amountEmitted = Math.min(puncture.amount, PUNCTURE_EMIT_PER_SECOND * timeElapsed);
        if(amountEmitted > 0) {
            const newPunctureAmount = puncture.amount - amountEmitted;
            emitBubble(bubbles, bubble, amountEmitted, Vec2(puncturePoint.x, puncturePoint.y));
            puncture.amount = newPunctureAmount;
            if(newPunctureAmount <= 0) bubble.punctures.delete(puncturePoint);
        }
    })
}

export const handleBubbleUpdates = (
    bubbles: Map<string, Bubble>,
    timeElapsed: number,
): void => {
    bubbles.forEach(bubble => {
        handlePunctures(bubbles, bubble, timeElapsed);
    } )
}


