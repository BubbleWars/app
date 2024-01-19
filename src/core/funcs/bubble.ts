import { Circle, Vec2, World } from "planck-js";
import { Bubble } from "../types/bubble";
import { massToRadius, radiusToMass } from "./utils";
import { Address } from "../types/address";
import { MASS_PER_SECOND } from "../consts";

export const generateBubbleId = (bubbles: Map<string, Bubble>, owner: Address): string => {
    return `${owner.toLowerCase()}-${bubbles.size}`;
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

export const updateBubble = (bubbles: Map<string, Bubble>, bubble: Bubble, newMass: number): void => {
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
    const momentumAbsorbed = absorbedBubble.body.getLinearVelocity().clone().mul(amountAbsorbed);
    const newBubbleMass = bubble.body.getMass() + amountAbsorbed;
    const newBubbleMomentum = bubble.body.getLinearVelocity().clone().mul(bubble.body.getMass()).add(momentumAbsorbed);
    const newAbsorbedBubbleMass = absorbedBubble.body.getMass() - amountAbsorbed;
    const newAbsorbedBubbleMomentum = absorbedBubble.body.getLinearVelocity().clone().mul(absorbedBubble.body.getMass()).sub(momentumAbsorbed);
    updateBubble(bubbles, bubble, newBubbleMass);
    updateBubble(bubbles, absorbedBubble, newAbsorbedBubbleMass);
    //console.log("amountAbsorbed", amountAbsorbed, "newBubbleMass", newBubbleMass, "newAbsorbedBubbleMass", newAbsorbedBubbleMass);
    if(bubble.body.isDynamic())
        bubble.body.setLinearVelocity(newBubbleMomentum.mul(1 / newBubbleMass));
    absorbedBubble.body.setLinearVelocity(newAbsorbedBubbleMomentum.mul(1 / newAbsorbedBubbleMass));
}

