import { World, Circle, Vec2 } from "planck-js";
import { Portal } from "../types/portal";
import { Address } from "../types/address";
import { massToRadius } from "./utils";
import { GRAVITATIONAL_CONSTANT, MASS_PER_SECOND } from "../consts";
import { Bubble } from "../types/bubble";
import { createBubble, updateBubble } from "./bubble";
import { Obstacle } from "../types/obstacle";

export const generateSpawnPoint = (world: World, portals: Map<string, Portal>, bubbles: Map<string, Bubble>, obstacles: Map<string, Obstacle>, mass: number): Vec2 => {
    return Vec2(0, 0);
}

export const createPortal = (portals: Map<string, Portal>, world: World, owner: Address, x: number, y: number, mass: number): Portal => {
    const radius = massToRadius(mass);
    const body = world.createBody({position: Vec2(x, y), type: "static"});
    body.setMassData({mass, center: Vec2(0, 0), I: 0});
    const fixture = body.createFixture({ shape: Circle(radius), density: 1, restitution: 0});
    const portal = { owner, balance: 0, body, fixture, mass };
    portal.body.setUserData(owner)
    portals.set(portal.body.getUserData() as string, portal);
    return portal;
}

export const addPortalMass = (portal: Portal, mass: number): void => {
    portal.mass += mass;
}

export const removePortalMass = (portal: Portal, mass: number): void => {
    portal.mass -= mass;
}

export const updatePortal = (portal: Portal, newMass: number): void => {
    portal.mass = newMass;
    const radius = massToRadius(portal.mass);
    portal.body.destroyFixture(portal.fixture);
    portal.fixture = portal.body.createFixture({ shape: Circle(radius), density: 1, restitution: 0, friction: 0});
}

export const applyPortalGrowth = (portal: Portal, timeElapsed: number): void => {
    const totalMassDelta = portal.mass - portal.body.getMass();
    if (totalMassDelta === 0) return;
    const shouldGrow = totalMassDelta > 0;
    const massDelta = shouldGrow ? 
        Math.min(totalMassDelta, MASS_PER_SECOND * timeElapsed) : 
        Math.max(totalMassDelta, -MASS_PER_SECOND * timeElapsed);
    const newMass = portal.body.getMass() + massDelta;
    updatePortal(portal, newMass);
}

export const applyPortalGravity = (portal: Portal, bubble: Bubble): void => {
    if(!portal || !bubble) return;
    const mi = portal.mass;
    const pi = portal.body.getPosition();
    const mk = bubble.body.getMass();
    const pk = bubble.body.getPosition();
    const delta = pk.sub(pi);
    const r = delta.length();
    const force = GRAVITATIONAL_CONSTANT * mi * mk / (r * r);
    delta.normalize();
    bubble.body.applyForceToCenter(
        delta.mul(force).neg());
    ////console.log(force);
}

export const portalAbsorbBubble = (bubbles: Map<string, Bubble>, portal: Portal, absorbedBubble: Bubble, timeElapsed: number): void => {
    if(!portal || !absorbedBubble) return;
    const amountAbsorbed = Math.min(absorbedBubble.body.getMass(), MASS_PER_SECOND * timeElapsed);
    const newPortalMass = portal.mass + amountAbsorbed;
    const newBubbleMass = absorbedBubble.body.getMass() - amountAbsorbed;
    //console.log("portalAbsorbBubble", amountAbsorbed, newPortalMass, newBubbleMass);
    updatePortal(portal, newPortalMass);
    updateBubble(bubbles, absorbedBubble, newBubbleMass);
}

export const portalEmitBubble = (bubbles: Map<string, Bubble>, portal: Portal, mass: number, direction: Vec2): Bubble => {
    if(mass > portal.mass) throw new Error("Cannot emit more than the portal's mass");
    const portalRadius = portal.fixture.getShape().getRadius();
    const emittedBubbleRadius = massToRadius(mass);
    const centerDelta = direction.clone().mul(portalRadius + emittedBubbleRadius);
    const emittedBubblePosition = portal.body.getPosition().clone().add(centerDelta);
    console.log("emittedBubblePosition", emittedBubblePosition);
    const emittedBubble = createBubble(bubbles, portal.body.getWorld(), portal.owner, emittedBubblePosition.x, emittedBubblePosition.y, mass, false);
    console.log("emittedBubblePosition after create", JSON.stringify(emittedBubble.body.getPosition()));
    //Apply mass conservation
    const newPortalMass = portal.mass - mass;
    updatePortal(portal, newPortalMass);

    //Apply momentum conservation
    const emittedBubbleVelocityDirection = direction.clone();
    const emittedBubbleVelocityMagnitude = (portal.mass / emittedBubble.body.getMass())*1;
    const emittedBubbleRelativeVelocity = emittedBubbleVelocityDirection.mul(emittedBubbleVelocityMagnitude);
    const emittedBubbleVelocity = portal.body.getLinearVelocity().clone().add(emittedBubbleRelativeVelocity);
    emittedBubble.body.setLinearVelocity(emittedBubbleVelocity);
    console.log("emittedBubblePosition after velocity", JSON.stringify(emittedBubble.body.getPosition()));

    return emittedBubble;
}
